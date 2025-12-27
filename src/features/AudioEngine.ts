import type { VoicePreset } from '../types/voice';
import { ElevenLabsClient } from '../services/ElevenLabsClient';
import { VoiceRegistry } from '../services/VoiceRegistry';
import { AudioCache } from '../services/AudioCache';

class AudioEngineService {
    private audioContext: AudioContext | null = null;
    private currentSource: AudioBufferSourceNode | null = null;
    private isPlaying: boolean = false;

    constructor() {
        // Init lazily
    }

    private getContext(): AudioContext {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
            console.log('[AudioEngine] New AudioContext initialized');
        }
        return this.audioContext;
    }

    // Feature 2: Context-Aware Voice Modulation
    detectSceneEmotion(text: string): VoicePreset & { emotion: string } {
        // ACTION
        if (/!{2,}|attack|fight|run|watch out|now!/i.test(text)) {
            return {
                stability: 0.3,
                style: 0.7,
                speed: 1.2,
                emotion: 'action'
            };
        }
        // EMOTIONAL
        if (/\?{2,}|why|no!|please|love|hate|sob/i.test(text)) {
            return {
                stability: 0.4,
                style: 0.9,
                speed: 0.9,
                emotion: 'emotional'
            };
        }
        // WHISPER
        if (/\.{3,}|shhh|quiet|whisper/i.test(text)) {
            return {
                stability: 0.8,
                style: 0.1,
                speed: 0.8,
                emotion: 'whisper'
            };
        }

        // NORMAL
        return {
            stability: 0.6,
            style: 0.3,
            speed: 1.0,
            emotion: 'normal'
        };
    }

    async playDialogue(text: string, voiceId: string | undefined): Promise<void> {
        // Stop potential previous audio
        this.stop();
        this.isPlaying = true;

        console.log(`[AudioEngine] Playing: "${text.substring(0, 30)}..." with voice ${voiceId}`);
        const emotionData = this.detectSceneEmotion(text);

        try {
            if (!voiceId) throw new Error("No voice ID");

            let ctx = this.getContext();
            // Ensure context is running, restart if necessary
            if (ctx.state === 'suspended') await ctx.resume();

            let audioBuffer: ArrayBuffer | null = null;

            // 0. GENERATE CACHE KEY
            const cacheKey = AudioCache.generateKey(text, voiceId, emotionData.stability, emotionData.style);

            // 1. CHECK CACHE
            audioBuffer = await AudioCache.getAudio(cacheKey);

            if (!audioBuffer) {
                // 2. FETCH FROM ELEVENLABS (Cache Miss)
                console.log('[AudioEngine] Cache miss. Generating audio...');
                try {
                    audioBuffer = await ElevenLabsClient.generateSpeech({
                        text,
                        voiceId,
                        stability: emotionData.stability,
                        style: emotionData.style,
                        similarityBoost: 0.75
                    });

                    // 3. SAVE TO CACHE
                    if (audioBuffer) {
                        await AudioCache.saveAudio(cacheKey, audioBuffer as ArrayBuffer);
                    }
                } catch (apiError) {
                    console.warn("[AudioEngine] ElevenLabs API failed, attempting fallback:", apiError);
                    throw apiError; // Throw to trigger fallback
                }
            } else {
                console.log('[AudioEngine] Cache Hit! Playing instantly.');
            }

            if (!audioBuffer) throw new Error("Failed to get audio buffer");

            // 4. Decode Audio
            const decodedBuffer = await ctx.decodeAudioData(audioBuffer.slice(0));

            // 5. Play Audio
            const source = ctx.createBufferSource();
            source.buffer = decodedBuffer;

            // Apply speed modulation (Web Audio API feature, cheap)
            if (emotionData.speed !== 1.0) {
                source.playbackRate.value = emotionData.speed;
            }

            source.connect(ctx.destination);
            this.currentSource = source;
            source.start(0);

            await new Promise<void>((resolve) => {
                source.onended = () => {
                    if (this.currentSource === source) {
                        this.isPlaying = false;
                        this.currentSource = null;
                    }
                    resolve();
                };
            });

        } catch (error) {
            console.error('[AudioEngine] Main playback failed. Switching to Browser Fallback.');
            await this.speakBrowser(text, emotionData);
        } finally {
            // Safety check
            if (!this.currentSource && !window.speechSynthesis.speaking) {
                this.isPlaying = false;
            }
        }
    }

    private async speakBrowser(text: string, emotionData: { speed: number, emotion: string }): Promise<void> {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.error("Browser TTS not supported");
                resolve();
                return;
            }

            this.isPlaying = true;
            const utter = new SpeechSynthesisUtterance(text);

            // Try to match emotion/speed approx
            utter.rate = emotionData.speed || 1.0;
            utter.pitch = 1.0; // Baseline

            if (emotionData.emotion === 'action') utter.rate *= 1.1;
            if (emotionData.emotion === 'whisper') utter.volume = 0.6;

            // Voice selection logic (simple male/female heuristic or default)
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
            if (preferredVoice) utter.voice = preferredVoice;

            utter.onend = () => {
                this.isPlaying = false;
                resolve();
            };

            utter.onerror = (e) => {
                console.error("Browser TTS error", e);
                this.isPlaying = false;
                resolve();
            };

            window.speechSynthesis.speak(utter);
        });
    }

    stop() {
        // Stop Web Audio
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            this.currentSource = null;
        }

        // Stop Browser TTS
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        this.isPlaying = false;
    }

    async togglePause(): Promise<boolean> {
        const ctx = this.getContext();
        // Returns true if playing (running), false if paused (suspended)
        if (this.isPlaying && ctx.state === 'running') {
            await ctx.suspend();
            return false;
        } else if (this.isPlaying && ctx.state === 'suspended') {
            await ctx.resume();
            return true;
        }
        return false;
    }

    /**
     * Plays a full script sequence.
     * @param script Array of ScriptLine objects
     * @param onLineStart Optional callback when a line starts playing (for UI highlighting)
     */
    async playScript(script: any[], onLineStart?: (line: any) => void): Promise<void> {
        console.log('[AudioEngine] Starting script playback', script.length, 'lines');

        for (const line of script) {
            // Map character to voice using VoiceRegistry (Persistent/Locked)
            // Pass archetype (e.g. "legendary_deep") to ensure correct voice selection
            const voiceId = VoiceRegistry.getVoice(
                line.character_type,
                undefined,
                line.voice_archetype
            );

            // Notify UI
            if (onLineStart) onLineStart(line);

            // Play line and wait for it to finish
            try {
                await this.playDialogue(line.text, voiceId);

                // Small natural pause between lines
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (e) {
                console.warn('Skipping line due to error', e);
            }
        }
        console.log('[AudioEngine] Script playback finished');
    }

    getIsPlaying() {
        return this.isPlaying;
    }
}

export const AudioEngine = new AudioEngineService();

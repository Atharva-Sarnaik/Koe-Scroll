import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ElevenLabsClient } from './ElevenLabsClient';
import { VoiceRegistry } from './VoiceRegistry';
import { AudioCache } from './AudioCache';
import type { ScriptLine } from '../types/script';

class AudioEngineService {
    private soundObject: Audio.Sound | null = null;
    private isPlaying: boolean = false;

    constructor() {
        // Configure audio mode for playback
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });
    }

    /**
     * Context-Aware Voice Modulation
     */
    detectSceneEmotion(text: string) {
        if (/!{2,}|attack|fight|run|watch out|now!/i.test(text)) {
            return { stability: 0.3, style: 0.7, speed: 1.2, emotion: 'action' };
        }
        if (/\?{2,}|why|no!|please|love|hate|sob/i.test(text)) {
            return { stability: 0.4, style: 0.9, speed: 0.9, emotion: 'emotional' };
        }
        if (/\.{3,}|shhh|quiet|whisper/i.test(text)) {
            return { stability: 0.8, style: 0.1, speed: 0.8, emotion: 'whisper' };
        }
        return { stability: 0.6, style: 0.3, speed: 1.0, emotion: 'normal' };
    }

    async playDialogue(text: string, voiceId: string | undefined): Promise<void> {
        await this.stop();
        this.isPlaying = true;

        // 1. Load Global Settings
        let globalSpeed = 1.0;
        let dictionary: any[] = [];
        try {
            const [speedStr, dictStr] = await Promise.all([
                AsyncStorage.getItem('voice_speed'),
                AsyncStorage.getItem('voice_dictionary')
            ]);
            if (speedStr) globalSpeed = parseFloat(speedStr);
            if (dictStr) dictionary = JSON.parse(dictStr);
        } catch (e) { console.log('Error loading settings', e); }

        // 2. Apply Dictionary Substitutions
        let processedText = text;
        dictionary.forEach(item => {
            // Replace occurrences (case-insensitive or simple replacing)
            // Using split/join for simple All-occurrence replacement
            processedText = processedText.split(item.word).join(item.pronunciation);
        });

        console.log(`[AudioEngine] Playing: "${processedText.substring(0, 30)}..." (Orig: "${text.substring(0, 10)}...") speed=${globalSpeed}`);

        const emotionData = this.detectSceneEmotion(text); // Use original text for emotion detection to preserve context
        const finalSpeed = Math.max(0.5, Math.min(2.0, emotionData.speed * globalSpeed));

        try {
            if (!voiceId) throw new Error("No voice ID");

            // 3. Check Cache (Use processed text for cache key so pronunciation changes invalidate cache)
            const cacheKey = AudioCache.generateKey(processedText, voiceId, emotionData.stability, emotionData.style);
            let audioUri = await AudioCache.getAudio(cacheKey);

            // 4. Fetch if missing
            if (!audioUri) {
                console.log('[AudioEngine] Cache miss. Generating...');
                const base64Audio = await ElevenLabsClient.generateSpeech({
                    text: processedText,
                    voiceId,
                    stability: emotionData.stability,
                    style: emotionData.style,
                    similarityBoost: 0.75
                });

                audioUri = await AudioCache.saveAudio(cacheKey, base64Audio);
            } else {
                console.log('[AudioEngine] Cache Hit!');
            }

            if (!audioUri) throw new Error("Failed to get audio URI");

            // 5. Play Audio with Global Speed
            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true, rate: finalSpeed }
            );

            // Ensure rate is applied (Android sometimes ignores initial rate)
            await sound.setRateAsync(finalSpeed, true);

            this.soundObject = sound;

            // Wait for finish
            return new Promise((resolve) => {
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        this.isPlaying = false;
                        this.soundObject = null;
                        sound.unloadAsync();
                        resolve();
                    }
                });
            });

        } catch (error) {
            console.error('[AudioEngine] Playback failed:', error);
            this.isPlaying = false;
        }
    }

    async stop() {
        if (this.soundObject) {
            try {
                await this.soundObject.stopAsync();
                await this.soundObject.unloadAsync();
            } catch (e) {
                // Ignore
            }
            this.soundObject = null;
        }
        this.isPlaying = false;
    }

    async playScript(script: ScriptLine[], onLineStart?: (line: ScriptLine) => void): Promise<void> {
        console.log('[AudioEngine] Starting script playback', script.length, 'lines');

        for (const line of script) {
            if (!this.isPlaying && script.indexOf(line) > 0) {
                // Stop signal received? actually playDialogue handles isPlaying override usually.
                // But loop should check if we should continue.
                // We need an explicit stop flag logic or just let stop() kill the current sound.
                // Ideally we want to break the loop if stopped.
                // For now, simple check:
            }

            // Map voice
            const voiceId = VoiceRegistry.getVoice(
                line.character_type,
                undefined,
                line.voice_archetype
            );

            if (onLineStart) onLineStart(line);

            // Play
            await this.playDialogue(line.text, voiceId);

            // Pause between lines
            await new Promise(r => setTimeout(r, 400));
        }
        console.log('[AudioEngine] Script finished');
    }
}

export const AudioEngine = new AudioEngineService();

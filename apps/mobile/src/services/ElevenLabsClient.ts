import { EXPO_PUBLIC_ELEVENLABS_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SECRETS } from '../constants/Secrets';

interface ITSOptions {
    text: string;
    voiceId: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
}

class ElevenLabsClientService {
    private apiKey: string = '';
    private baseUrl = 'https://api.elevenlabs.io/v1';

    constructor() {
        // Warning check is harder with async, relying on runtime checks now
    }

    private async getApiKey(): Promise<string> {
        try {
            const storedKey = await AsyncStorage.getItem('elevenlabs_api_key');
            if (storedKey) return storedKey;
        } catch (e) {
            // ignore error, fall back to default
        }
        return process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || SECRETS.ELEVENLABS_API_KEY || '';
    }

    /**
     * Generates speech and returns Base64 string data
     */
    async generateSpeech({ text, voiceId, stability = 0.5, similarityBoost = 0.75, style = 0.0 }: ITSOptions): Promise<string> {
        this.apiKey = await this.getApiKey();

        if (!this.apiKey) {
            throw new Error('Missing ElevenLabs API Key');
        }

        const url = `${this.baseUrl}/text-to-speech/${voiceId}?optimize_streaming_latency=3`;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': this.apiKey,
                'Accept': 'audio/mpeg' // Request MP3
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability,
                    similarity_boost: similarityBoost,
                    style: style,
                    use_speaker_boost: true
                }
            })
        };

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API Error: ${response.status} ${errorText}`);
            }

            // Expo FileSystem prefers writing base64 strings
            const arrayBuffer = await response.arrayBuffer();
            const base64 = this.arrayBufferToBase64(arrayBuffer);
            return base64;
        } catch (err) {
            console.error('[ElevenLabs] Generation Failed:', err);
            throw err;
        }
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    async getVoices(): Promise<any[]> {
        try {
            const key = await this.getApiKey();
            const response = await fetch(`${this.baseUrl}/voices`, {
                headers: {
                    'xi-api-key': key
                }
            });
            const data = await response.json();
            return data.voices;
        } catch (e) {
            console.error('[ElevenLabs] Failed to fetch voices:', e);
            return [];
        }
    }
}

export const ElevenLabsClient = new ElevenLabsClientService();

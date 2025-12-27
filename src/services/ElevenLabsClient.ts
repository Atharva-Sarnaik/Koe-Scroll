
interface ITSOptions {
    text: string;
    voiceId: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
}

class ElevenLabsClientService {
    private baseUrl = 'https://api.elevenlabs.io/v1';

    /**
     * Gets the API key, checking localStorage first (user-saved), then env variable
     */
    private getApiKey(): string {
        // Priority: localStorage (user Settings) > environment variable
        const userKey = localStorage.getItem('elevenlabs_api_key');
        if (userKey && userKey.trim()) {
            return userKey.trim();
        }

        const envKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
        return envKey.trim();
    }

    async generateSpeech({ text, voiceId, stability = 0.5, similarityBoost = 0.75, style = 0.0 }: ITSOptions): Promise<ArrayBuffer> {
        const apiKey = this.getApiKey();

        if (!apiKey) {
            throw new Error('Missing ElevenLabs API Key. Please add it in Settings or set VITE_ELEVENLABS_API_KEY.');
        }

        const url = `${this.baseUrl}/text-to-speech/${voiceId}?optimize_streaming_latency=3`;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
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

            return await response.arrayBuffer();
        } catch (err) {
            console.error('[ElevenLabs] Generation Failed:', err);
            throw err;
        }
    }
}

export const ElevenLabsClient = new ElevenLabsClientService();


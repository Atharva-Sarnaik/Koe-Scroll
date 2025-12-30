
interface ITSOptions {
    text: string;
    voiceId: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
}

class ElevenLabsClientService {
    private apiKey: string;
    private baseUrl = 'https://api.elevenlabs.io/v1';

    constructor() {
        const key = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
        this.apiKey = key.trim();

        if (!this.apiKey) {
            console.warn('[ElevenLabs] API Key not found in VITE_ELEVENLABS_API_KEY');
        }
    }

    async generateSpeech({ text, voiceId, stability = 0.5, similarityBoost = 0.75, style = 0.0 }: ITSOptions): Promise<ArrayBuffer> {
        if (!this.apiKey) {
            throw new Error('Missing ElevenLabs API Key');
        }

        const url = `${this.baseUrl}/text-to-speech/${voiceId}?optimize_streaming_latency=3`;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': this.apiKey,
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2', // Updated from deprecated v1
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

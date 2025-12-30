export interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
}

export interface VoicePreset {
    stability: number;
    style: number;
    speed: number;
}

export interface Character {
    id: string;
    mangaId: string;
    name: string;
    imageUrl?: string;
    voiceId: string; // ElevenLabs Voice ID
    voiceSettings?: VoiceSettings;
}

export interface VoiceProfile {
    characterName: string;
    voiceId: string;
    personality: 'hero' | 'villain' | 'comic' | 'wise' | 'young' | 'other';
    mangaTitle?: string;
    timestamp: number;
}

export interface VoiceProfile {
    characterName: string; // e.g. "naruto"
    voiceId: string; // ElevenLabs Voice ID
    personality: 'hero' | 'villain' | 'narrator' | 'mob' | 'other';
    mangaTitle?: string;
    timestamp: number;
}

export interface UserPreferences {
    theme: 'light' | 'dark';
    readingDirection: 'ltr' | 'rtl'; // RTL for standard manga
    defaultVoiceSettings: {
        stability: number;
        similarity_boost: number;
    };
    autoAdvance: boolean;
    voiceFollowsScroll: boolean;
    audioQuality: 'low' | 'medium' | 'high';
    developerMode: boolean; // For debugging overlays
}

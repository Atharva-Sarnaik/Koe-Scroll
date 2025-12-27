import type { VoiceProfile } from '../types/voice';

const STORAGE_KEY = 'koe_scroll_voice_memory';

class VoiceMemoryService {
    private profiles: VoiceProfile[] = [];

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.profiles = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load voice memory', e);
            this.profiles = [];
        }
    }

    saveVoice(characterName: string, voiceId: string, personality: VoiceProfile['personality'] = 'other', mangaTitle?: string) {
        const profile: VoiceProfile = {
            characterName: characterName.toLowerCase(),
            voiceId,
            personality,
            mangaTitle,
            timestamp: Date.now()
        };

        // Remove existing entry for exact same char name if exists to update it
        this.profiles = this.profiles.filter(p => p.characterName !== profile.characterName);
        this.profiles.push(profile);

        this.saveToStorage();
    }

    private saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
        } catch (e) {
            console.warn('Failed to save voice memory', e);
        }
    }

    // Feature 4: Smart Suggestions
    suggestVoice(characterName: string): string | null {
        const lowerName = characterName.toLowerCase();

        // 1. Exact Name Match (e.g. "Naruto" -> "Naruto")
        const exactMatch = this.profiles.find(p => p.characterName === lowerName);
        if (exactMatch) return exactMatch.voiceId;

        // 2. Fuzzy/Partial Match (e.g. "Naruto Uzumaki" -> "Naruto")
        // Check if stored name is part of new name OR new name is part of stored name
        const partialMatch = this.profiles.find(p =>
            lowerName.includes(p.characterName) || p.characterName.includes(lowerName)
        );
        if (partialMatch) return partialMatch.voiceId;

        return null;
    }

    suggestByPersonality(personality: VoiceProfile['personality']): string[] {
        return this.profiles
            .filter(p => p.personality === personality)
            .sort((a, b) => b.timestamp - a.timestamp) // Recent first
            .map(p => p.voiceId)
            .slice(0, 3);
    }

    getAllProfiles() {
        return this.profiles;
    }
}

export const VoiceMemory = new VoiceMemoryService();

import type { VoiceProfile } from '../types/voice';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'koe_scroll_voice_memory_v2';

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

    async syncVoices(mangaTitle?: string) {
        if (!mangaTitle) return;
        if (!isSupabaseConfigured) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('voice_assignments')
                .select('*')
                .eq('user_id', user.id)
                .eq('manga_title', mangaTitle);

            if (data) {
                // Merge with local state, preferring remote
                data.forEach((remote: any) => {
                    // Check if we already have it
                    const existingIndex = this.profiles.findIndex(
                        p => p.characterName === remote.character_name && p.mangaTitle === remote.manga_title
                    );

                    const profile: VoiceProfile = {
                        characterName: remote.character_name,
                        voiceId: remote.voice_id,
                        personality: remote.personality as any,
                        mangaTitle: remote.manga_title,
                        timestamp: new Date(remote.updated_at).getTime()
                    };

                    if (existingIndex >= 0) {
                        this.profiles[existingIndex] = profile;
                    } else {
                        this.profiles.push(profile);
                    }
                });
                this.saveToStorage();
                console.log(`[VoiceMemory] Synced ${data.length} voices for ${mangaTitle}`);
            }
        } catch (e) {
            console.error('[VoiceMemory] Sync failed:', e);
        }
    }

    async saveVoice(characterName: string, voiceId: string, personality: VoiceProfile['personality'] = 'other', mangaTitle?: string) {
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

        // Sync to Supabase
        if (mangaTitle && isSupabaseConfigured) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('voice_assignments').upsert({
                        user_id: user.id,
                        manga_title: mangaTitle,
                        character_name: profile.characterName,
                        voice_id: voiceId,
                        personality: personality,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id, manga_title, character_name' });
                    console.log('[VoiceMemory] Saved to Supabase');
                }
            } catch (e) {
                console.error('[VoiceMemory] Failed to save to Supabase:', e);
            }
        }
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

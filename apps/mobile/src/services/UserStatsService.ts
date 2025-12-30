import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    display_name: string;
    avatar_url?: string;
    xp: number;
    level: number;
    streak_days: number;
    last_activity_date: string;
    joined_at: string;
}

export interface ReadingActivity {
    date: string; // YYYY-MM-DD
    pages_read: number;
    minutes_listened: number;
    sessions: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    unlocked_at?: string; // If unlocked
}

export interface VoiceStats {
    preferred_voice_type: string;
    total_characters_voiced: number;
    favorite_voices: string[];
    consistency_score: number;
    avg_playback_speed: number;
}

class UserStatsServiceImpl {
    private userId: string | null = null;

    setUserId(id: string) {
        this.userId = id;
    }

    // --- Fetchers ---

    async getProfile(): Promise<UserProfile | null> {
        if (!this.userId) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', this.userId)
            .single();

        if (error) {
            console.warn('Error fetching profile:', error.message);
            return null;
        }

        return data as UserProfile;
    }

    async getReadingActivity(): Promise<ReadingActivity[]> {
        if (!this.userId) return [];

        // Get last 30 days
        const { data } = await supabase
            .from('reading_activity')
            .select('*')
            .eq('user_id', this.userId)
            .order('date', { ascending: false })
            .limit(30);

        return (data || []) as ReadingActivity[];
    }

    async getAchievements(): Promise<Achievement[]> {
        if (!this.userId) return [];

        // Get all achievements
        const { data: allAchievements } = await supabase
            .from('achievements')
            .select('*');

        // Get user unlocked achievements
        const { data: userAchievements } = await supabase
            .from('user_achievements')
            .select('achievement_id, unlocked_at')
            .eq('user_id', this.userId);

        const unlockedMap = new Map();
        userAchievements?.forEach((ua: any) => {
            unlockedMap.set(ua.achievement_id, ua.unlocked_at);
        });

        // Merge
        return (allAchievements || []).map((a: any) => ({
            ...a,
            unlocked_at: unlockedMap.get(a.id)
        }));
    }

    async getVoiceStats(): Promise<VoiceStats | null> {
        if (!this.userId) return null;

        const { data } = await supabase
            .from('voice_stats')
            .select('*')
            .eq('user_id', this.userId)
            .single();

        return data as VoiceStats;
    }
}

export const UserStatsService = new UserStatsServiceImpl();

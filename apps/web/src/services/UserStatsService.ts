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

    // XP Configuration
    private readonly XP_PER_PAGE = 10;
    private readonly XP_PER_CHAPTER = 100;
    private readonly XP_PER_MINUTE_LISTENED = 5;
    private readonly XP_PER_VOICE_ASSIGNED = 2;

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

    // --- Actions ---

    async createProfile(id: string, name: string, avatarUrl?: string | null) {
        const { error } = await supabase
            .from('profiles')
            .insert({
                id,
                display_name: name,
                avatar_url: avatarUrl,
                xp: 0,
                level: 1,
                streak_days: 0,
                last_activity_date: new Date().toISOString()
            });

        if (error) throw error;
    }

    async updateProfileData(name: string, avatarUrl?: string) {
        if (!this.userId) {
            console.error("updateProfileData: User ID not set");
            throw new Error("User not authenticated");
        }

        const updates: any = {
            id: this.userId,
            display_name: name
        };
        if (avatarUrl !== undefined) {
            updates.avatar_url = avatarUrl;
        }

        // Use upsert to handle cases where profile row might be missing
        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) throw error;
    }

    async updateStreak() {
        if (!this.userId) return;
        // Logic handled by daily activity trigger usually, but simple client version:
        // const today = new Date().toISOString().split('T')[0];
        // In real app, check last activity date and increment streak if consecutive day
    }

    async trackDailyActivity(field: 'pagesRead' | 'minutesListened' | 'sessions', amount: number) {
        if (!this.userId) return;
        const today = new Date().toISOString().split('T')[0];

        // Use RPC function defined in schema
        await supabase.rpc('increment_daily_activity', {
            p_user_id: this.userId,
            p_date: today,
            p_field: field,
            p_increment: amount
        });
    }

    async addXP(amount: number) {
        if (!this.userId) return;

        // Get current profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('xp, level')
            .eq('id', this.userId)
            .single();

        if (!profile) return;

        const newXP = profile.xp + amount;
        // Simple level curve: Level = floor(sqrt(XP / 100)) + 1
        // or Linear: Level = floor(XP / 1000) + 1
        const newLevel = Math.floor(Math.sqrt(newXP / 50)) + 1;

        await supabase
            .from('profiles')
            .update({ xp: newXP, level: newLevel })
            .eq('id', this.userId);
    }

    // --- Public Tracking Methods ---

    async trackPageRead() {
        if (!this.userId) return;
        await this.trackDailyActivity('pagesRead', 1);
        await this.addXP(this.XP_PER_PAGE);

        // Check for 'first_read' achievement
        await this.checkAchievement('first_read');
    }

    async trackChapterComplete() {
        if (!this.userId) return;
        await this.addXP(this.XP_PER_CHAPTER);
        await this.checkAchievement('chapter_complete');
    }

    async trackListeningTime(minutes: number) {
        if (!this.userId) return;
        await this.trackDailyActivity('minutesListened', minutes);
        await this.addXP(minutes * this.XP_PER_MINUTE_LISTENED);
    }

    async trackVoiceAssigned() {
        if (!this.userId) return;
        await this.addXP(this.XP_PER_VOICE_ASSIGNED);
        await supabase.rpc('increment_voice_stats', { p_user_id: this.userId });
    }

    async checkAchievement(achievementId: string) {
        if (!this.userId) return;

        // Check if already unlocked
        const { data } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', this.userId)
            .eq('achievement_id', achievementId)
            .single();

        if (data) return; // Already unlocked

        // Unlock it
        await supabase
            .from('user_achievements')
            .insert({
                user_id: this.userId,
                achievement_id: achievementId
            });

        // Award XP for achievement? Handled by db trigger or separate call?
        // Let's keep it simple for now
    }
    // --- Static Helpers (exposed on instance for convenience) ---

    getNextLevelXP(level: number): number {
        // Inverse of Level = floor(sqrt(XP / 50)) + 1
        // Level - 1 = floor(sqrt(XP / 50))
        // (Level - 1)^2 = XP / 50
        // XP = 50 * (Level - 1)^2 
        // Next level is level + 1, so needed XP = 50 * (level)^2
        return 50 * Math.pow(level, 2);
    }

    getCurrentLevelXP(level: number): number {
        // XP required for current level
        return 50 * Math.pow(level - 1, 2);
    }
}

export const UserStatsService = new UserStatsServiceImpl();

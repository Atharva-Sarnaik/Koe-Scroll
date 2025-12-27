import { supabase, isSupabaseConfigured } from '../lib/supabase';

// XP thresholds for each level (exponential curve)
const LEVEL_THRESHOLDS = [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    850,    // Level 5
    1300,   // Level 6
    1900,   // Level 7
    2600,   // Level 8
    3500,   // Level 9
    4600,   // Level 10
    6000,   // Level 11
    7700,   // Level 12
    9800,   // Level 13
    12300,  // Level 14
    15200,  // Level 15
];

// XP rewards for different actions
export const XP_REWARDS = {
    PAGE_READ: 5,
    CHAPTER_COMPLETE: 25,
    VOICE_ASSIGNED: 10,
    LISTEN_10_MIN: 15,
    DAILY_STREAK: 20,
    ACHIEVEMENT_UNLOCK: 50,
};

export interface UserProfile {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    xp: number;
    level: number;
    streakDays: number;
    lastActivityDate: string | null;
    createdAt: string;
}

export interface ReadingActivity {
    date: string;
    sessions: number;
    pagesRead: number;
    minutesListened: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    xpReward: number;
    icon: string;
    unlockedAt?: string;
}

export interface VoiceStats {
    preferredVoiceType: string;
    avgPlaybackSpeed: number;
    totalCharactersVoiced: number;
    favoriteVoices: string[];
    consistencyScore: number;
}

class UserStatsServiceClass {
    private userId: string | null = null;

    setUserId(id: string | null) {
        this.userId = id;
    }

    // Calculate level from XP
    calculateLevel(xp: number): number {
        for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (xp >= LEVEL_THRESHOLDS[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    // Get XP needed for next level
    getNextLevelXP(level: number): number {
        if (level >= LEVEL_THRESHOLDS.length) {
            return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
        }
        return LEVEL_THRESHOLDS[level];
    }

    // Get current level XP threshold
    getCurrentLevelXP(level: number): number {
        return LEVEL_THRESHOLDS[level - 1] || 0;
    }

    // Add XP to user
    async addXP(amount: number, reason: string): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
        if (!this.userId || !isSupabaseConfigured) {
            console.log(`[Stats] Would add ${amount} XP for: ${reason}`);
            return { newXP: 0, newLevel: 1, leveledUp: false };
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('xp, level')
            .eq('id', this.userId)
            .single();

        if (error || !profile) {
            console.error('[Stats] Failed to fetch profile:', error);
            return { newXP: 0, newLevel: 1, leveledUp: false };
        }

        const newXP = profile.xp + amount;
        const newLevel = this.calculateLevel(newXP);
        const leveledUp = newLevel > profile.level;

        await supabase
            .from('profiles')
            .update({ xp: newXP, level: newLevel })
            .eq('id', this.userId);

        console.log(`[Stats] Added ${amount} XP for: ${reason}. Total: ${newXP}, Level: ${newLevel}`);

        return { newXP, newLevel, leveledUp };
    }

    // Track page read
    async trackPageRead(): Promise<void> {
        await this.addXP(XP_REWARDS.PAGE_READ, 'Page read');
        await this.updateDailyActivity('pagesRead', 1);
    }

    // Track chapter complete
    async trackChapterComplete(): Promise<void> {
        await this.addXP(XP_REWARDS.CHAPTER_COMPLETE, 'Chapter complete');
    }

    // Track voice assignment
    async trackVoiceAssigned(): Promise<void> {
        await this.addXP(XP_REWARDS.VOICE_ASSIGNED, 'Voice assigned');
        await this.updateVoiceStats();
    }

    // Track listening time (call every 10 minutes)
    async trackListeningTime(minutes: number): Promise<void> {
        if (minutes >= 10) {
            await this.addXP(XP_REWARDS.LISTEN_10_MIN, '10 minutes listened');
        }
        await this.updateDailyActivity('minutesListened', minutes);
    }

    // Update daily activity for heatmap
    async updateDailyActivity(field: 'sessions' | 'pagesRead' | 'minutesListened', increment: number): Promise<void> {
        if (!this.userId || !isSupabaseConfigured) return;

        const today = new Date().toISOString().split('T')[0];

        // Upsert: increment if exists, create if not
        const { error } = await supabase.rpc('increment_daily_activity', {
            p_user_id: this.userId,
            p_date: today,
            p_field: field,
            p_increment: increment
        });

        if (error) {
            console.error('[Stats] Failed to update daily activity:', error);
        }
    }

    // Update streak
    async updateStreak(): Promise<number> {
        if (!this.userId || !isSupabaseConfigured) return 0;

        const today = new Date().toISOString().split('T')[0];

        const { data: profile } = await supabase
            .from('profiles')
            .select('streak_days, last_activity_date')
            .eq('id', this.userId)
            .single();

        if (!profile) return 0;

        const lastDate = profile.last_activity_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = profile.streak_days;

        if (lastDate === yesterday) {
            // Consecutive day - increment streak
            newStreak += 1;
            await this.addXP(XP_REWARDS.DAILY_STREAK, 'Daily streak bonus');
        } else if (lastDate !== today) {
            // Streak broken
            newStreak = 1;
        }

        await supabase
            .from('profiles')
            .update({ streak_days: newStreak, last_activity_date: today })
            .eq('id', this.userId);

        return newStreak;
    }

    // Get user profile
    async getProfile(): Promise<UserProfile | null> {
        if (!this.userId || !isSupabaseConfigured) return null;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', this.userId)
            .single();

        if (!data) return null;

        return {
            id: data.id,
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
            xp: data.xp,
            level: data.level,
            streakDays: data.streak_days,
            lastActivityDate: data.last_activity_date,
            createdAt: data.created_at
        };
    }

    // Get reading activity for heatmap (last 30 days)
    async getReadingActivity(): Promise<ReadingActivity[]> {
        if (!this.userId || !isSupabaseConfigured) return [];

        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

        const { data } = await supabase
            .from('reading_activity')
            .select('*')
            .eq('user_id', this.userId)
            .gte('date', thirtyDaysAgo)
            .order('date', { ascending: true });

        return (data || []).map(d => ({
            date: d.date,
            sessions: d.sessions,
            pagesRead: d.pages_read,
            minutesListened: d.minutes_listened
        }));
    }

    // Get user achievements
    async getAchievements(): Promise<Achievement[]> {
        if (!this.userId || !isSupabaseConfigured) return [];

        const { data: allAchievements } = await supabase
            .from('achievements')
            .select('*');

        const { data: userAchievements } = await supabase
            .from('user_achievements')
            .select('achievement_id, unlocked_at')
            .eq('user_id', this.userId);

        const unlockedMap = new Map(
            (userAchievements || []).map(ua => [ua.achievement_id, ua.unlocked_at])
        );

        return (allAchievements || []).map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            xpReward: a.xp_reward,
            icon: a.icon,
            unlockedAt: unlockedMap.get(a.id)
        }));
    }

    // Unlock achievement
    async unlockAchievement(achievementId: string): Promise<boolean> {
        if (!this.userId || !isSupabaseConfigured) return false;

        const { error } = await supabase
            .from('user_achievements')
            .insert({ user_id: this.userId, achievement_id: achievementId });

        if (!error) {
            await this.addXP(XP_REWARDS.ACHIEVEMENT_UNLOCK, `Achievement: ${achievementId}`);
            return true;
        }

        return false;
    }

    // Update voice stats
    async updateVoiceStats(): Promise<void> {
        if (!this.userId || !isSupabaseConfigured) return;

        // Increment total characters voiced
        await supabase.rpc('increment_voice_stats', {
            p_user_id: this.userId
        });
    }

    // Get voice stats
    async getVoiceStats(): Promise<VoiceStats | null> {
        if (!this.userId || !isSupabaseConfigured) return null;

        const { data } = await supabase
            .from('voice_stats')
            .select('*')
            .eq('user_id', this.userId)
            .single();

        if (!data) return null;

        return {
            preferredVoiceType: data.preferred_voice_type || 'Not set',
            avgPlaybackSpeed: data.avg_playback_speed || 1.0,
            totalCharactersVoiced: data.total_characters_voiced || 0,
            favoriteVoices: data.favorite_voices || [],
            consistencyScore: data.consistency_score || 0
        };
    }

    // Create initial profile for new user
    async createProfile(userId: string, name: string, avatarUrl: string | null): Promise<void> {
        if (!isSupabaseConfigured) return;

        await supabase.from('profiles').upsert({
            id: userId,
            display_name: name,
            avatar_url: avatarUrl,
            xp: 0,
            level: 1,
            streak_days: 0,
            last_activity_date: new Date().toISOString().split('T')[0]
        });

        // Create voice stats entry
        await supabase.from('voice_stats').upsert({
            user_id: userId,
            preferred_voice_type: 'Deep / Authoritative',
            avg_playback_speed: 1.0,
            total_characters_voiced: 0,
            favorite_voices: [],
            consistency_score: 0
        });
    }
}

export const UserStatsService = new UserStatsServiceClass();

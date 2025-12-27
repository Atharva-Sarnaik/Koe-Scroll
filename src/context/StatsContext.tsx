import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserStatsService, type UserProfile, type ReadingActivity, type Achievement, type VoiceStats } from '../services/UserStatsService';

interface StatsContextType {
    profile: UserProfile | null;
    readingActivity: ReadingActivity[];
    achievements: Achievement[];
    voiceStats: VoiceStats | null;
    loading: boolean;
    refreshStats: () => Promise<void>;
    trackPageRead: () => Promise<void>;
    trackChapterComplete: () => Promise<void>;
    trackVoiceAssigned: () => Promise<void>;
    trackListeningTime: (minutes: number) => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [readingActivity, setReadingActivity] = useState<ReadingActivity[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [voiceStats, setVoiceStats] = useState<VoiceStats | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshStats = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setReadingActivity([]);
            setAchievements([]);
            setVoiceStats(null);
            setLoading(false);
            return;
        }

        UserStatsService.setUserId(user.id);
        setLoading(true);

        try {
            const [profileData, activityData, achievementsData, voiceData] = await Promise.all([
                UserStatsService.getProfile(),
                UserStatsService.getReadingActivity(),
                UserStatsService.getAchievements(),
                UserStatsService.getVoiceStats()
            ]);

            // Create profile if it doesn't exist
            if (!profileData && user) {
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Reader';
                const avatar = user.user_metadata?.avatar_url || null;
                await UserStatsService.createProfile(user.id, name, avatar);

                // Fetch again after creation
                const newProfile = await UserStatsService.getProfile();
                setProfile(newProfile);
            } else {
                setProfile(profileData);
            }

            setReadingActivity(activityData);
            setAchievements(achievementsData);
            setVoiceStats(voiceData);
        } catch (error) {
            console.error('[StatsContext] Failed to load stats:', error);
        }

        setLoading(false);
    }, [user]);

    // Load stats when user changes
    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    // Update streak on daily activity
    useEffect(() => {
        if (user) {
            UserStatsService.updateStreak();
        }
    }, [user]);

    const trackPageRead = useCallback(async () => {
        await UserStatsService.trackPageRead();
        // Update profile XP in state
        const newProfile = await UserStatsService.getProfile();
        if (newProfile) setProfile(newProfile);
    }, []);

    const trackChapterComplete = useCallback(async () => {
        await UserStatsService.trackChapterComplete();
        const newProfile = await UserStatsService.getProfile();
        if (newProfile) setProfile(newProfile);
    }, []);

    const trackVoiceAssigned = useCallback(async () => {
        await UserStatsService.trackVoiceAssigned();
        const [newProfile, newVoiceStats] = await Promise.all([
            UserStatsService.getProfile(),
            UserStatsService.getVoiceStats()
        ]);
        if (newProfile) setProfile(newProfile);
        if (newVoiceStats) setVoiceStats(newVoiceStats);
    }, []);

    const trackListeningTime = useCallback(async (minutes: number) => {
        await UserStatsService.trackListeningTime(minutes);
        const newProfile = await UserStatsService.getProfile();
        if (newProfile) setProfile(newProfile);
    }, []);

    return (
        <StatsContext.Provider value={{
            profile,
            readingActivity,
            achievements,
            voiceStats,
            loading,
            refreshStats,
            trackPageRead,
            trackChapterComplete,
            trackVoiceAssigned,
            trackListeningTime
        }}>
            {children}
        </StatsContext.Provider>
    );
};

export const useStats = () => {
    const context = useContext(StatsContext);
    if (!context) {
        throw new Error('useStats must be used within a StatsProvider');
    }
    return context;
};

import React from 'react';
import { User, Settings as SettingsIcon, Award, Mic2, Flame, Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';
import { UserStatsService } from '../services/UserStatsService';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const { profile, readingActivity, achievements, voiceStats, loading } = useStats();

    // Display data from auth or profile
    const displayName = profile?.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Reader';
    const avatarUrl = user?.user_metadata?.avatar_url || profile?.avatarUrl;
    const level = profile?.level || 1;
    const xp = profile?.xp || 0;
    const nextLevelXP = UserStatsService.getNextLevelXP(level);
    const currentLevelXP = UserStatsService.getCurrentLevelXP(level);
    const xpProgress = nextLevelXP > currentLevelXP ? ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 0;
    const streakDays = profile?.streakDays || 0;

    // Generate heatmap from reading activity (last 30 days)
    const heatmapData = React.useMemo(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            const activity = readingActivity.find(a => a.date === date);
            const intensity = activity
                ? Math.min(3, Math.floor((activity.sessions + activity.pagesRead / 5) / 2))
                : 0;
            days.push({ date, intensity });
        }
        return days;
    }, [readingActivity]);

    // Voice DNA data
    const voiceDNA = voiceStats || {
        preferredVoiceType: 'Not set yet',
        avgPlaybackSpeed: 1.0,
        totalCharactersVoiced: 0,
        consistencyScore: 0
    };

    // Achievement icons map
    const getAchievementIcon = (iconName: string) => {
        switch (iconName) {
            case 'mic': return <Mic2 size={18} />;
            case 'flame': return <Flame size={18} />;
            case 'award': return <Award size={18} />;
            default: return <Award size={18} />;
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                <Loader2 size={32} className="spin-animation" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '24px 40px 80px 40px', maxWidth: '1000px', margin: '0 auto' }}>

            {/* Header Card */}
            <div className="glass-panel" style={{
                padding: '32px',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, var(--color-surface), rgba(255,255,255,0.02))',
                border: '1px solid var(--color-border)'
            }}>
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        style={{
                            width: 100, height: 100,
                            borderRadius: '50%',
                            border: '3px solid var(--color-primary)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                        }}
                    />
                ) : (
                    <div style={{
                        width: 100, height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #333, #555)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                    }}>
                        <User size={40} color="#ddd" />
                    </div>
                )}

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1, color: 'var(--color-text-primary)' }}>
                                {displayName}
                            </h1>
                            <span style={{
                                background: 'var(--gradient-primary)',
                                color: '#000',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                Level {level} Reader
                            </span>
                        </div>
                        <Link to="/app/settings" className="btn-icon" style={{ color: 'var(--color-text-secondary)' }}>
                            <SettingsIcon size={24} />
                        </Link>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                            <span>XP Progress</span>
                            <span>{xp} / {nextLevelXP} XP</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(100, xpProgress)}%`,
                                height: '100%',
                                background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                                transition: 'width 0.5s ease'
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>

                {/* Reading Activity (Heatmap) */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                        <Flame size={20} color="#FF5555" /> Reading Activity
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {heatmapData.map((d, i) => (
                            <div key={i} style={{
                                width: '24px', height: '24px', borderRadius: '4px',
                                background: d.intensity === 0 ? 'var(--color-border)' :
                                    d.intensity === 1 ? 'rgba(245, 158, 11, 0.3)' :
                                        d.intensity === 2 ? 'rgba(245, 158, 11, 0.6)' :
                                            'var(--color-primary)',
                                transition: 'all 0.2s'
                            }} title={d.date} />
                        ))}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '16px' }}>
                        {streakDays > 0 ? `🔥 ${streakDays} Day Streak! Keep it up.` : 'Start reading to build your streak!'}
                    </div>
                </div>

                {/* Voice DNA */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                        <Mic2 size={20} color="#00D9FF" /> Voice DNA
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <DNAMetric label="Preferred Type" value={voiceDNA.preferredVoiceType} />
                        <DNAMetric label="Avg Speed" value={`${voiceDNA.avgPlaybackSpeed}x`} />
                        <DNAMetric label="Characters Voiced" value={voiceDNA.totalCharactersVoiced.toString()} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Consistency</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{voiceDNA.consistencyScore}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Achievements */}
            <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Achievements</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {achievements.length > 0 ? achievements.map(ach => (
                        <div key={ach.id} className="glass-panel" style={{
                            padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                            opacity: ach.unlockedAt ? 1 : 0.5
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: ach.unlockedAt ? 'rgba(255, 215, 0, 0.1)' : 'var(--color-border)',
                                color: ach.unlockedAt ? '#FFD700' : 'var(--color-text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {ach.unlockedAt ? getAchievementIcon(ach.icon) : <Lock size={18} />}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ach.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{ach.description}</div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ color: 'var(--color-text-secondary)', gridColumn: '1 / -1', textAlign: 'center', padding: '32px' }}>
                            Achievements will appear here once you start reading!
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

const DNAMetric: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{label}</span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
);

export default Profile;

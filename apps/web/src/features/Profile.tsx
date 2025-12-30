import React from 'react';
import { User, Settings as SettingsIcon, Award, Mic2, Flame, Lock, Loader2, Edit3, Camera, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';
import { UserStatsService } from '../services/UserStatsService';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const { profile, readingActivity, achievements, voiceStats, loading, updateUserProfile } = useStats();

    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);

    // Initialize edit state when profile loads
    React.useEffect(() => {
        if (profile) {
            setEditName(profile.display_name || '');
        } else if (user?.user_metadata?.full_name) {
            setEditName(user.user_metadata.full_name || '');
        }
    }, [profile, user]);

    // Display data from auth or profile
    const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Reader';
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
    const level = profile?.level || 1;
    const xp = profile?.xp || 0;
    const nextLevelXP = UserStatsService.getNextLevelXP(level);
    const currentLevelXP = UserStatsService.getCurrentLevelXP(level);
    const xpProgress = nextLevelXP > currentLevelXP ? ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 0;
    const streakDays = profile?.streak_days || 0;

    const handleSave = async () => {
        if (!editName.trim()) return;
        setIsSaving(true);
        try {
            await updateUserProfile(editName, avatarUrl); // Keep current avatar for now unless changed
            setIsEditing(false);
        } catch (err: any) {
            console.error('Failed to update profile', err);
            alert(`Failed to update profile: ${err.message || JSON.stringify(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("File too large. Please choose an image under 5MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                updateUserProfile(editName, base64);
                setIsAvatarModalOpen(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePresetSelect = (url: string) => {
        updateUserProfile(editName, url);
        setIsAvatarModalOpen(false);
    };

    const PRESET_AVATARS = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Zoom',
        'https://api.dicebear.com/7.x/bottts/svg?seed=C3PO',
        'https://api.dicebear.com/7.x/notionists/svg?seed=Leo',
        'https://api.dicebear.com/7.x/notionists/svg?seed=Mila',
        'https://api.dicebear.com/7.x/micah/svg?seed=Oliver',
        'https://api.dicebear.com/7.x/micah/svg?seed=Willow',
    ];

    // Generate heatmap from reading activity (last 30 days)
    const heatmapData = React.useMemo(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            const activity = readingActivity.find(a => a.date === date);
            const intensity = activity
                ? Math.min(3, Math.floor((activity.sessions + activity.pages_read / 5) / 2))
                : 0;
            days.push({ date, intensity });
        }
        return days;
    }, [readingActivity]);

    // Voice DNA data
    const voiceDNA = voiceStats || {
        preferred_voice_type: 'Not set yet',
        avg_playback_speed: 1.0,
        total_characters_voiced: 0,
        consistency_score: 0
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

    if (!user) {
        return (
            <div className="container" style={{ padding: '24px 40px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: '48px', borderRadius: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div style={{ marginBottom: '24px', display: 'inline-flex', padding: '24px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%' }}>
                        <User size={48} color="#F59E0B" />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 700 }}>Profile Not Available</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>
                        Please sign in to view your profile, stats, and achievements.
                    </p>
                    <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 32px' }}>
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '24px 40px 80px 40px', maxWidth: '1000px', margin: '0 auto' }}>

            {/* Avatar Selection Modal */}
            {isAvatarModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setIsAvatarModalOpen(false)}>
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '32px', borderRadius: '24px',
                        width: '90%', maxWidth: '500px',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', color: 'var(--color-text-primary)' }}>Choose an Avatar</h3>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>PRESETS</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                {PRESET_AVATARS.map((url, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePresetSelect(url)}
                                        className="hover-scale"
                                        style={{
                                            background: 'var(--color-background)',
                                            border: '2px solid var(--color-border)',
                                            borderRadius: '12px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            height: '80px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <img src={url} alt={`Preset ${i}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>UPLOAD IMAGE</div>
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '16px', background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px', cursor: 'pointer',
                                border: '1px dashed var(--color-border)',
                                justifyContent: 'center'
                            }}>
                                <Camera size={20} color="var(--color-primary)" />
                                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Upload from Device</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsAvatarModalOpen(false)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    padding: '8px 16px', cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Card */}
            <div className="glass-panel" style={{
                padding: '32px',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, var(--color-surface), rgba(255,255,255,0.02))',
                border: '1px solid var(--color-border)',
                position: 'relative'
            }}>
                <div style={{ position: 'relative', cursor: isEditing ? 'pointer' : 'default' }} onClick={() => isEditing && setIsAvatarModalOpen(true)}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            style={{
                                width: 100, height: 100,
                                borderRadius: '50%',
                                border: '3px solid var(--color-primary)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                opacity: isEditing ? 0.7 : 1
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 100, height: 100,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #333, #555)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            opacity: isEditing ? 0.7 : 1
                        }}>
                            <User size={40} color="#ddd" />
                        </div>
                    )}

                    {isEditing && (
                        <div style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: '50%',
                            width: '40px', height: '40px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            <Camera size={20} color="#fff" />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: '100%' }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            color: 'var(--color-text-primary)',
                                            width: '100%',
                                            maxWidth: '400px',
                                            fontFamily: 'inherit'
                                        }}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1, color: 'var(--color-text-primary)' }}>
                                    {displayName}
                                </h1>
                            )}

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

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="btn-icon"
                                        style={{ background: 'var(--color-success)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        {isSaving ? <Loader2 size={18} className="spin-animation" /> : <Check size={18} />}
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(false); setEditName(displayName); }}
                                        disabled={isSaving}
                                        className="btn-icon"
                                        style={{ background: 'var(--color-error)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-icon hover-scale"
                                    style={{ color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Edit Profile"
                                >
                                    <Edit3 size={20} />
                                </button>
                            )}

                            <Link to="/app/settings" className="btn-icon hover-scale" style={{ color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <SettingsIcon size={20} />
                            </Link>
                        </div>
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
                        <DNAMetric label="Preferred Type" value={voiceDNA.preferred_voice_type || 'Not set yet'} />
                        <DNAMetric label="Avg Speed" value={`${voiceDNA.avg_playback_speed || 1.0}x`} />
                        <DNAMetric label="Characters Voiced" value={(voiceDNA.total_characters_voiced || 0).toString()} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Consistency</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{voiceDNA.consistency_score || 0}%</span>
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
                            opacity: ach.unlocked_at ? 1 : 0.5
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: ach.unlocked_at ? 'rgba(255, 215, 0, 0.1)' : 'var(--color-border)',
                                color: ach.unlocked_at ? '#FFD700' : 'var(--color-text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {ach.unlocked_at ? getAchievementIcon(ach.icon) : <Lock size={18} />}
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

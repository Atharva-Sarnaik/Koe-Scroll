import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Key, Moon, Sun, Volume2, LogOut, User, Palette, Trash2, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { AudioCache } from '../services/AudioCache';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { user, signOut } = useAuth();

    const [apiKey, setApiKey] = useState('');
    const [masterVolume, setMasterVolume] = useState(80);
    const [saved, setSaved] = useState(false);
    const [clearing, setClearing] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const storedKey = localStorage.getItem('elevenlabs_api_key');
        if (storedKey) setApiKey(storedKey);

        const storedVolume = localStorage.getItem('master_volume');
        if (storedVolume) setMasterVolume(parseInt(storedVolume));
    }, []);

    const handleSaveApiKey = () => {
        localStorage.setItem('elevenlabs_api_key', apiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleVolumeChange = (value: number) => {
        setMasterVolume(value);
        localStorage.setItem('master_volume', value.toString());
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const handleClearCache = async () => {
        if (confirm('This will clear all cached audio files. Continue?')) {
            setClearing(true);
            try {
                await AudioCache.clear();
                alert('Audio cache cleared successfully!');
            } catch (e) {
                console.error('Failed to clear cache:', e);
                alert('Failed to clear cache.');
            }
            setClearing(false);
        }
    };

    // User display data
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
    const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const userEmail = user?.email;

    return (
        <div className="container" style={{ padding: '24px 40px 80px 40px', maxWidth: '800px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="btn-icon"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Settings</h1>
            </div>

            {/* Account Section */}
            <SettingsSection title="Account" icon={<User size={20} />}>
                <div className="glass-panel card-hover" style={{
                    padding: '20px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)'
                }}>
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt="Avatar"
                            style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--color-primary)' }}
                        />
                    ) : (
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <User size={28} color="#000" />
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
                            {userName}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            {userEmail || 'Not signed in'}
                        </div>
                    </div>
                    {user && (
                        <button
                            onClick={handleSignOut}
                            className="btn-secondary"
                            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    )}
                </div>
            </SettingsSection>

            {/* Appearance Section */}
            <SettingsSection title="Appearance" icon={<Palette size={20} />}>
                <SettingsRow
                    label="Theme"
                    description="Choose your preferred color scheme"
                >
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setTheme('dark')}
                            className={theme === 'dark' ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Moon size={16} /> Dark
                        </button>
                        <button
                            onClick={() => setTheme('light')}
                            className={theme === 'light' ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Sun size={16} /> Light
                        </button>
                    </div>
                </SettingsRow>
            </SettingsSection>

            {/* API Key Section */}
            <SettingsSection title="API Configuration" icon={<Key size={20} />}>
                <div className="glass-panel" style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)'
                }}>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                        Enter your ElevenLabs API Key to enable real AI voice generation.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk_..."
                            style={{
                                flex: 1,
                                background: 'var(--color-surface-elevated)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                fontSize: '0.95rem'
                            }}
                        />
                        <button
                            onClick={handleSaveApiKey}
                            className={saved ? 'btn-secondary' : 'btn-primary'}
                            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {saved ? <Check size={18} /> : <Save size={18} />} {saved ? 'Saved!' : 'Save'}
                        </button>
                    </div>
                </div>
            </SettingsSection>

            {/* Audio Section */}
            <SettingsSection title="Audio Defaults" icon={<Volume2 size={20} />}>
                <SettingsRow
                    label="Master Volume"
                    description={`${masterVolume}%`}
                >
                    <input
                        type="range"
                        min="0" max="100"
                        value={masterVolume}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                        style={{ width: '150px', accentColor: 'var(--color-primary)' }}
                    />
                </SettingsRow>

                <SettingsRow
                    label="Clear audio cache"
                    description="Remove all cached voice audio files"
                >
                    <button
                        onClick={handleClearCache}
                        className="btn-secondary"
                        disabled={clearing}
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {clearing ? <Loader2 size={16} className="spin-animation" /> : <Trash2 size={16} />}
                        {clearing ? 'Clearing...' : 'Clear'}
                    </button>
                </SettingsRow>
            </SettingsSection>

            {/* Version Info */}
            <div style={{
                textAlign: 'center',
                marginTop: '48px',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem'
            }}>
                KoeScroll v1.0.0 Beta
            </div>
        </div>
    );
};

// Helper Components
const SettingsSection: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div style={{ marginBottom: '32px' }}>
        <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--color-text-primary)'
        }}>
            {icon} {title}
        </h2>
        {children}
    </div>
);

const SettingsRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="glass-panel" style={{
        padding: '16px 20px',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        marginBottom: '8px'
    }}>
        <div>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</div>
            {description && (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {description}
                </div>
            )}
        </div>
        {children}
    </div>
);

export default Settings;

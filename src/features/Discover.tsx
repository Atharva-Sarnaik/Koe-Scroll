import React, { useState, useEffect } from 'react';
import { Search, Compass, Mic, Volume2, ImageOff } from 'lucide-react';
import { DISCOVER_ITEMS } from './mockDiscover';
import { recommendationService } from '../services/RecommendationService';

const MangaCover: React.FC<{
    src: string;
    title: string;
    genre: string;
    style?: React.CSSProperties;
    className?: string;
}> = ({ src, title, genre, style, className }) => {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div style={{
                ...style,
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid var(--color-border)',
                ...style // Allow overrides but keep fallback base
            }} className={className}>
                <ImageOff size={32} color="var(--color-text-secondary)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px', lineHeight: 1.2 }}>
                    {title}
                </div>
                <div style={{
                    fontSize: '0.75rem',
                    padding: '4px 12px',
                    borderRadius: '100px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'var(--color-text-secondary)'
                }}>
                    {genre}
                </div>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={title}
            onError={() => setError(true)}
            style={{
                ...style,
                objectFit: 'cover',
                width: '100%',
                height: '100%'
            }}
            className={className}
        />
    );
};

const Discover: React.FC = () => {
    const [search, setSearch] = useState('');
    const [activeVibe, setActiveVibe] = useState('All');

    const vibes = ['All', 'Cerebral', 'Cinematic', 'Energetic', 'Epic', 'Chill'];

    // Randomize Featured Hero on mount
    const featured = React.useMemo(() => {
        const index = Math.floor(Math.random() * DISCOVER_ITEMS.length);
        return DISCOVER_ITEMS[index];
    }, []);

    // Track featured manga view
    useEffect(() => {
        if (featured) {
            recommendationService.trackBrowse(featured.title);
        }
    }, [featured]);

    const filtered = DISCOVER_ITEMS.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
        const matchesVibe = activeVibe === 'All' || item.vibe === activeVibe;
        // Strict: Only show verified items with official covers
        const isVerified = item.source_verified;
        return matchesSearch && matchesVibe && isVerified;
    });

    return (
        <div className="container" style={{ padding: '0px 48px 80px 48px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ padding: '40px 0 32px 0' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 700 }}>Vibe Engine</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={18} color="#00D9FF" /> Find manga based on listening experience.
                </p>
            </div>

            {/* Featured Hero (Random Selection) */}
            <div className="glass-panel" style={{
                borderRadius: '32px',
                padding: '40px',
                marginBottom: '40px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 100%)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                gap: '40px',
                alignItems: 'center',
                minHeight: '300px'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem',
                        color: 'var(--color-primary)', marginBottom: '16px', fontWeight: 700
                    }}>
                        Featured Series
                    </div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1 }}>
                        {featured.title}
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '24px', maxWidth: '500px' }}>
                        {featured.description}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                        {featured.tags.map(tag => (
                            <span key={tag} style={{
                                padding: '6px 16px', borderRadius: '100px',
                                background: 'rgba(255,255,255,0.1)', fontSize: '0.9rem'
                            }}>{tag}</span>
                        ))}
                    </div>
                </div>

                <div style={{
                    width: '220px', height: '320px',
                    position: 'relative', // Context for absolute img
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    transform: 'rotate(3deg)',
                    border: '4px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden' // Ensure img/fallback stays inside
                }}>
                    <MangaCover
                        src={featured.official_cover_url}
                        title={featured.title}
                        genre={featured.genre}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{
                padding: '16px 24px', borderRadius: '16px',
                display: 'flex', alignItems: 'center', gap: '16px',
                marginBottom: '32px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
            }}>
                <Search size={20} color="var(--color-text-secondary)" />
                <input
                    type="text"
                    placeholder="Search by title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        background: 'transparent', border: 'none', color: 'var(--color-text-primary)',
                        fontSize: '1rem', width: '100%', outline: 'none'
                    }}
                />
            </div>

            {/* Vibe Filters */}
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '8px 0 24px 0', marginBottom: '8px' }}>
                {vibes.map(vibe => (
                    <button
                        key={vibe}
                        className={activeVibe === vibe ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setActiveVibe(vibe)}
                        style={{
                            padding: '10px 24px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {vibe}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {filtered.map(item => (
                    <div key={item.id} className="glass-panel card-hover" style={{
                        borderRadius: '24px',
                        overflow: 'hidden',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        display: 'flex', flexDirection: 'column',
                        cursor: 'pointer'
                    }}>
                        {/* Image Banner */}
                        <div style={{
                            height: '160px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <MangaCover
                                src={item.official_cover_url}
                                title={item.title}
                                genre={item.genre}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    // mimic previous background positioning
                                    objectPosition: 'center 20%'
                                }}
                            />
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(to bottom, transparent, var(--color-surface))'
                            }} />
                            <div style={{
                                position: 'absolute', bottom: '16px', left: '24px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                            }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{item.title}</h3>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{item.genre}</div>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Tags */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '8px',
                                    background: 'rgba(0, 217, 255, 0.1)', color: '#00D9FF',
                                    fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(0, 217, 255, 0.2)'
                                }}>
                                    {item.vibe} Vibe
                                </span>
                                {item.tags.map(tag => (
                                    <span key={tag} style={{
                                        padding: '4px 12px', borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)',
                                        fontSize: '0.8rem'
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                {item.description}
                            </p>

                            {/* Metrics */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                                marginTop: 'auto', paddingTop: '16px',
                                borderTop: '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Volume2 size={16} color="var(--color-text-secondary)" />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Dialogue</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.dialogueDensity}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Mic size={16} color="var(--color-text-secondary)" />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Voice Suitablity</div>
                                        <div style={{
                                            fontWeight: 600, fontSize: '0.9rem',
                                            color: item.voiceSuitability > 90 ? 'var(--color-success)' : 'var(--color-text-primary)'
                                        }}>
                                            {item.voiceSuitability}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Discover;

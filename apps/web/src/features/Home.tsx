import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Clock, ChevronRight } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { recommendationService } from '../services/RecommendationService';
import type { DiscoverItem } from '../services/RecommendationService';
import { PdfService } from '../services/PdfService';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { library } = useLibrary();
    const [recommendations, setRecommendations] = useState<DiscoverItem[]>([]);
    const [generatedCover, setGeneratedCover] = useState<string | null>(null);

    // 1. Get Last Read Manga (for Hero)
    const lastReadManga = useMemo(() => {
        if (!library || library.length === 0) return null;
        return [...library].sort((a, b) => (b.lastRead || 0) - (a.lastRead || 0))[0];
    }, [library]);

    // 2. Fetch Recommendations
    useEffect(() => {
        const libraryTitles = library.map(m => m.title);
        const recs = library.length > 0
            ? recommendationService.getRecommendations(libraryTitles)
            : recommendationService.getTrending();

        setRecommendations(recs);
    }, [library]);

    // 3. Generate Cover if needed
    useEffect(() => {
        const loadCover = async () => {
            // If we have a manga, but no official cover, and it has content...
            if (lastReadManga && !lastReadManga.cover && lastReadManga.chapters && lastReadManga.chapters[0]?.contentUrl) {
                const pdfUrl = lastReadManga.chapters[0].contentUrl;
                try {
                    const coverDataUrl = await PdfService.generateCover(pdfUrl);
                    if (coverDataUrl) {
                        setGeneratedCover(coverDataUrl);
                    }
                } catch (e) {
                    console.error("Home: Failed to generate cover", e);
                }
            } else {
                setGeneratedCover(null);
            }
        };
        loadCover();
    }, [lastReadManga]);

    // Fallback data
    const demoManga = {
        id: 'd7', // Jujutsu Kaisen ID from mockDiscover
        title: 'Jujutsu Kaisen',
        chapter: "Chapter 1: Ryomen Sukuna",
        progress: 0,
        coverUrl: '/covers/jjk28.png',
    };

    // Construct Hero Content
    const heroContent = lastReadManga ? {
        id: lastReadManga.id,
        title: lastReadManga.title,
        chapter: lastReadManga.chapters && lastReadManga.chapters.length > 0
            ? lastReadManga.chapters[lastReadManga.chapters.length - 1].title
            : 'Continue Reading',
        progress: lastReadManga.chapters && lastReadManga.chapters.length > 0
            ? (lastReadManga.chapters[0].progress || 0)
            : 0,
        // Use generated cover -> existing cover -> fallback
        coverUrl: generatedCover || (lastReadManga as any).cover || 'https://via.placeholder.com/400x600?text=No+Cover',
    } : demoManga;

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text-primary)' }}>

            {/* Hero Section */}
            <div
                className="animate-enter"
                style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%)',
                    borderRadius: '24px',
                    padding: '40px',
                    minHeight: '320px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '48px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
            >
                {/* Background Glow */}
                <div style={{
                    position: 'absolute',
                    top: -100, right: -100, width: '400px', height: '400px',
                    background: '#F59E0B',
                    filter: 'blur(150px)',
                    opacity: 0.1,
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#F59E0B',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.05em',
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        opacity: 0, // Initial state
                        animationDelay: '100ms'
                    }}
                        className="animate-enter">
                        <Clock size={16} />
                        {lastReadManga ? 'Pick Up Where You Left Off' : 'Start Your Journey'}
                    </div>

                    <h1
                        className="animate-enter"
                        style={{
                            fontSize: '3rem', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.1, textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            animationDelay: '200ms'
                        }}
                    >
                        {heroContent.title}
                    </h1>
                    <p
                        className="animate-enter"
                        style={{
                            fontSize: '1.2rem', color: 'var(--color-text-secondary)', margin: '0 0 32px 0',
                            animationDelay: '300ms'
                        }}
                    >
                        {heroContent.chapter}
                    </p>

                    <div
                        className="animate-enter"
                        style={{ display: 'flex', alignItems: 'center', gap: '24px', animationDelay: '400ms' }}
                    >
                        {lastReadManga && (
                            <div style={{ flex: 1, maxWidth: '300px' }}>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                                    <div style={{ width: `${Math.min(heroContent.progress, 100)}%`, height: '100%', background: '#F59E0B' }} />
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    {heroContent.progress > 0 ? `${heroContent.progress} Page(s) Read` : 'Ready to Start'}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (lastReadManga) {
                                    // Use the first chapter ID (since we typically import single-chapter PDFs)
                                    // Or find the last read chapter if tracking multiple
                                    const targetChapterId = lastReadManga.chapters && lastReadManga.chapters.length > 0
                                        ? lastReadManga.chapters[0].id
                                        : lastReadManga.id; // Fallback
                                    navigate(`/app/reader/${targetChapterId}`);
                                } else {
                                    navigate('/app/discover');
                                }
                            }}
                            style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: '#F59E0B', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)',
                                transition: 'transform 0.2s ease',
                                flexShrink: 0
                            }}
                            className="hover-scale"
                        >
                            <Play size={28} fill="#000" color="#000" style={{ marginLeft: '4px' }} />
                        </button>
                    </div>
                </div>

                {/* Cover Image */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingRight: '40px'
                }}>
                    <div style={{
                        width: '200px',
                        aspectRatio: '2/3',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        transform: 'rotateY(-15deg) rotateX(5deg)',
                        border: '2px solid rgba(255,255,255,0.1)',
                        background: '#222'
                    }}>
                        <img
                            src={heroContent.coverUrl}
                            alt={heroContent.title}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://cdn.myanimelist.net/images/manga/1/200021.jpg'; // Stylish fallback
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                    {library.length > 0 ? 'Recommended Based on Your Library' : 'Trending Now'}
                </h2>
                <button
                    onClick={() => navigate('/app/discover')}
                    style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                >
                    See All <ChevronRight size={16} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
                {recommendations.map((item, i) => (
                    <div
                        key={item.id}
                        className="manga-card animate-enter"
                        style={{
                            cursor: 'pointer',
                            animationDelay: `${150 + (i * 50)}ms`
                        }}
                        onClick={() => navigate('/app/discover')}
                    >
                        <div style={{
                            position: 'relative',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            aspectRatio: '2/3',
                            marginBottom: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                        }}>
                            <img
                                src={item.official_cover_url}
                                alt={item.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                            />
                            <div style={{
                                position: 'absolute', top: '12px', right: '12px',
                                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                                padding: '4px 8px', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                fontSize: '0.8rem', fontWeight: 600
                            }}>
                                <Star size={12} fill="#F59E0B" color="#F59E0B" />
                                {((item.voiceSuitability || 80) / 20).toFixed(1)}
                            </div>
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                            {item.genre}
                        </p>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes enter-blur {
                    0% {
                        opacity: 0;
                        transform: translateY(40px) scale(0.95);
                        filter: blur(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                        filter: blur(0);
                    }
                }

                .animate-enter {
                    animation: enter-blur 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    opacity: 0; /* Keep hidden before animation starts */
                }

                .hover-scale:hover { transform: scale(1.05); }
                .manga-card:hover img { transform: scale(1.05); }
            `}</style>
        </div>
    );
};

export default Home;

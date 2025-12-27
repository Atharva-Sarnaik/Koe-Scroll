import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Clock, Star, TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { recommendationService, type DiscoverItem } from '../services/RecommendationService';
import styles from './Home.module.css';


const Home: React.FC = () => {
    const navigate = useNavigate();
    const { library, isLoading } = useLibrary();

    // Get the most recently read manga for "Continue Reading"
    const continueReading = useMemo(() => {
        if (library.length === 0) return null;

        // Sort by lastRead timestamp (most recent first)
        const sorted = [...library].sort((a, b) => {
            const aTime = (a as any).lastRead || a.addedDate || 0;
            const bTime = (b as any).lastRead || b.addedDate || 0;
            return bTime - aTime;
        });

        const manga = sorted[0];
        if (!manga.chapters.length) return null;

        // Find the chapter with the most progress
        const currentChapter = manga.chapters.reduce((prev, curr) =>
            (curr.progress > (prev?.progress || 0)) ? curr : prev
            , manga.chapters[0]);

        const totalPages = (manga as any).totalPageCount || 100;
        const progressPercent = Math.round((currentChapter.progress / totalPages) * 100);

        return {
            manga,
            chapter: currentChapter,
            progress: Math.min(progressPercent, 99) // Cap at 99%
        };
    }, [library]);

    // Get smart recommendations
    const recommendations = useMemo((): DiscoverItem[] => {
        const libraryTitles = library.map(m => m.title);

        if (libraryTitles.length === 0 && recommendationService.getBrowseHistory().length === 0) {
            // No data - return trending
            return recommendationService.getTrending(6);
        }

        return recommendationService.getRecommendations(libraryTitles, 6);
    }, [library]);

    const hasPersonalizedRecs = library.length > 0 || recommendationService.getBrowseHistory().length > 0;

    // Handle card click - navigate to discover for more info
    const handleRecommendationClick = (item: DiscoverItem) => {
        recommendationService.trackBrowse(item.title);
        navigate('/app/discover');
    };

    if (isLoading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className={styles.loadingSpinner} />
            </div>
        );
    }

    return (
        <div className={styles.container}>

            {/* Header */}
            <header className={styles.welcomeSection}>
                <div>
                    <h2 className={styles.subHeader}>Welcome Back</h2>
                    <h1 className={styles.heading}>Ready to Read?</h1>
                </div>
            </header>

            {/* Hero: Continue Reading */}
            <section>
                <div className={styles.sectionTitle}>
                    <h3>Continue Reading</h3>
                </div>

                {continueReading ? (
                    <Link to={`/app/reader/${continueReading.chapter.id}`} style={{ textDecoration: 'none' }}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureBackground}>
                                <img src={continueReading.manga.coverImage} alt="Cover" />
                            </div>

                            <div className={styles.featureContent}>
                                <div className={styles.featureMeta}>
                                    <Clock size={16} />
                                    <span>Picked up where you left off</span>
                                </div>

                                <h3 className={styles.featureTitle}>{continueReading.manga.title}</h3>
                                <p className={styles.featureSubtitle}>
                                    Chapter {continueReading.chapter.number}: {continueReading.chapter.title}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${continueReading.progress}%` }} />
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                        {continueReading.progress}% Completed
                                    </span>
                                </div>
                            </div>

                            <div className={styles.playButton}>
                                <Play fill="#000" size={24} style={{ marginLeft: 4 }} color="#000" />
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className={styles.emptyState} style={{
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--border-radius-xl)',
                        padding: '48px',
                        textAlign: 'center',
                        border: '1px dashed var(--color-border)',
                        marginBottom: '56px'
                    }}>
                        <BookOpen size={48} color="var(--color-text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                            No manga yet
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
                            Import a manga to start reading with AI voices
                        </p>
                        <button
                            onClick={() => navigate('/app/add')}
                            style={{
                                background: 'var(--gradient-primary)',
                                color: '#000',
                                padding: '12px 28px',
                                borderRadius: 'var(--border-radius-full)',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Sparkles size={18} />
                            Import Manga
                        </button>
                    </div>
                )}
            </section>

            {/* Smart Recommendations */}
            <section>
                <div className={styles.sectionTitle}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {hasPersonalizedRecs ? (
                            <>
                                <Sparkles size={20} color="var(--color-primary)" />
                                Recommended for You
                            </>
                        ) : (
                            <>
                                <TrendingUp size={20} color="var(--color-primary)" />
                                Trending Now
                            </>
                        )}
                    </h3>
                    <span className={styles.seeAll} onClick={() => navigate('/app/discover')}>
                        See All
                    </span>
                </div>

                <div className={styles.grid}>
                    {recommendations.map((item, index) => (
                        <div
                            key={item.id}
                            className={styles.gridItem}
                            onClick={() => handleRecommendationClick(item)}
                            style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                        >
                            <div className={styles.coverImageWrapper}>
                                <img
                                    src={item.official_cover_url}
                                    alt={item.title}
                                    className={styles.coverImage}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/covers/placeholder.png';
                                    }}
                                />
                                <div className={styles.ratingBadge}>
                                    <Star size={10} fill="#F59E0B" color="#F59E0B" />
                                    {(item.voiceSuitability / 20).toFixed(1)}
                                </div>
                            </div>
                            <h4 className={styles.mangaTitle}>{item.title}</h4>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default Home;

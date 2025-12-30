import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, PlayCircle, Sun, Moon, BookOpen, Info, Volume2, Zap, Heart } from 'lucide-react';
import styles from './LandingPage.module.css';

// User provided manga covers - Sorted Layout
const COVERS = [
    // Top Corners - Visible and framing
    { src: '/covers/onepiece.png', rot: -15, top: '8%', left: '8%' },
    { src: '/covers/naruto.png', rot: 10, top: '8%', right: '8%' },

    // Middle Sides - brought screen-in
    { src: '/covers/jigokuraku.png', rot: 5, top: '42%', left: '4%' },
    { src: '/covers/tokyoghoul.png', rot: -5, top: '42%', right: '4%' },

    // Bottom Row (Left to Right) - Visible ring
    { src: '/covers/bluelock.png', rot: -12, bottom: '22%', left: '8%' },
    { src: '/covers/jjk28.png', rot: 8, bottom: '5%', left: '25%' },
    { src: '/covers/blackclover.png', rot: -8, bottom: '5%', right: '25%' },
    { src: '/covers/csm.png', rot: 12, bottom: '22%', right: '8%' },
];

import { useTheme } from '../hooks/useTheme';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, loading } = useAuth(); // Add useAuth
    const isDark = theme === 'dark';

    // Redirect to app if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate('/app');
        }
    }, [user, loading, navigate]);

    // Scroll progress state
    const [scrollProgress, setScrollProgress] = useState(0);

    // Scroll progress tracking
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer for animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                        observer.unobserve(entry.target); // Only animate once
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );

        const elements = document.querySelectorAll(`.${styles.animateOnScroll}`);
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    // Parallax effect for cards on scroll
    useEffect(() => {
        const handleParallax = () => {
            const scrollY = window.scrollY;
            const cards = document.querySelectorAll(`.${styles.card}`);

            cards.forEach((card, index) => {
                const speed = 0.03 + (index * 0.01);
                const yOffset = scrollY * speed;
                (card as HTMLElement).style.transform =
                    `translateY(${-yOffset}px) rotate(var(--rot))`;
            });
        };

        window.addEventListener('scroll', handleParallax, { passive: true });
        return () => window.removeEventListener('scroll', handleParallax);
    }, []);

    return (
        <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
            {/* Scroll Progress Bar */}
            <div
                className={styles.scrollProgress}
                style={{ width: `${scrollProgress}%` }}
            />

            {/* Gradient Orbs Background */}
            <div className={`${styles.gradientOrb} ${styles.orb1}`} />
            <div className={`${styles.gradientOrb} ${styles.orb2}`} />
            <div className={`${styles.gradientOrb} ${styles.orb3}`} />

            {/* Navigation */}
            <nav className={styles.nav}>
                <div className={styles.navContent}>
                    <div className={styles.logo}>
                        <img
                            src="/icon.png"
                            alt="KoeScroll Logo"
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6
                            }}
                        />
                        KoeScroll
                    </div>

                    <div className={styles.navLinks}>
                        <a href="#library" className={styles.navLink}>Library</a>
                        <a href="#recommended" className={styles.navLink}>Recommended</a>
                        <a href="#about" className={styles.navLink}>About</a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 8,
                                borderRadius: '50%',
                                transition: 'transform 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(180deg) scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1)'}
                        >
                            {isDark ? (
                                <Sun size={20} color="#fff" />
                            ) : (
                                <Moon size={20} color="#1d1d1f" />
                            )}
                        </button>

                        <div className={styles.authButtons}>
                            <button
                                className={styles.signupBtn}
                                onClick={() => navigate('/login')}
                            >
                                Sign in
                            </button>
                        </div>
                    </div>
                </div>
            </nav>


            {/* Hero Section */}
            <main className={styles.hero}>
                {/* Floating Background Cards */}
                <div className={styles.backgroundCards}>
                    {COVERS.map((cover, i) => (
                        <div
                            key={i}
                            className={styles.card}
                            style={{
                                top: cover.top,
                                left: cover.left,
                                right: cover.right,
                                bottom: cover.bottom,
                                // @ts-ignore
                                '--rot': `${cover.rot}deg`,
                            }}
                        >
                            <img
                                src={cover.src}
                                alt="Manga"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>

                <h1 className={styles.headline}>
                    Your next obsession <br />
                    starts here.
                </h1>

                <p className={styles.subheadline}>
                    Explore our curated selection of manga in a whole new way.
                    Experience immersive reading with AI-powered voice acting and dynamic visuals.
                </p>

                <div className={styles.ctaButtons}>
                    <Link to="/signup" className={styles.primaryCta}>
                        <span>Get Started</span>
                    </Link>

                    <Link to="/try-demo" className={styles.secondaryCta}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PlayCircle size={20} />
                            Try Demo
                        </div>
                    </Link>
                </div>
            </main>

            {/* How it Works Section */}
            <section className={styles.featuresSection}>
                <h2 className={styles.headline} style={{ fontSize: '2.8rem', opacity: 1, animation: 'none' }}>
                    Immersive Reading <br /> in 3 Steps.
                </h2>

                <div className={styles.featuresGrid}>
                    <div
                        className={`${styles.featureCard} ${styles.animateOnScroll}`}
                        style={{ transitionDelay: '0ms' }}
                    >
                        <div className={styles.featureIcon}>
                            <Sparkles size={24} />
                        </div>
                        <h3 className={styles.featureTitle}>1. Choose Your Manga</h3>
                        <p className={styles.featureDesc}>
                            Select from our curated library or import your own favorites.
                            KoeScroll supports all standard formats.
                        </p>
                    </div>

                    <div
                        className={`${styles.featureCard} ${styles.animateOnScroll}`}
                        style={{ transitionDelay: '150ms' }}
                    >
                        <div className={styles.featureIcon}>
                            <PlayCircle size={24} />
                        </div>
                        <h3 className={styles.featureTitle}>2. Activate AI Voices</h3>
                        <p className={styles.featureDesc}>
                            Our engine detects dialogue emotion and assigns distinct voices
                            to each character automatically.
                        </p>
                    </div>

                    <div
                        className={`${styles.featureCard} ${styles.animateOnScroll}`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        <div className={styles.featureIcon}>
                            <Sun size={24} />
                        </div>
                        <h3 className={styles.featureTitle}>3. Experience the Story</h3>
                        <p className={styles.featureDesc}>
                            Read with synchronized audio, visual waveforms, and dynamic
                            ambient effects that bring panels to life.
                        </p>
                    </div>
                </div>
            </section>

            {/* Library Preview Section */}
            <section id="library" className={styles.featuresSection} style={{ background: 'var(--color-surface)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                    <BookOpen size={28} color="var(--color-primary)" />
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Your Personal Library</h2>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0 auto 40px auto', fontSize: '1.1rem' }}>
                    Import your own manga or discover new favorites. Track your progress,
                    save your place, and pick up right where you left off.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, maxWidth: 800, margin: '0 auto' }}>
                    {[
                        { title: 'One Piece', progress: 80 },
                        { title: 'Naruto', progress: 45 },
                        { title: 'Jujutsu Kaisen', progress: 20 },
                    ].map((manga, i) => (
                        <div
                            key={i}
                            className={`${styles.libraryCard} ${styles.animateOnScroll}`}
                            style={{
                                transitionDelay: `${i * 150}ms`
                            }}
                        >
                            <div style={{
                                height: 140,
                                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(108,99,255,0.2))',
                                borderRadius: 12,
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <BookOpen size={32} color="var(--color-text-secondary)" />
                            </div>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>{manga.title}</div>
                            <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${manga.progress}%`,
                                    height: '100%',
                                    background: 'var(--gradient-primary)'
                                }} />
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 8 }}>
                                {manga.progress}% complete
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recommended Section */}
            <section id="recommended" className={styles.featuresSection} style={{ textAlign: 'center' }}>
                <div className={styles.animateOnScroll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                    <Heart size={28} color="#ff6b6b" />
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Staff Picks</h2>
                </div>
                <p className={styles.animateOnScroll} style={{ transitionDelay: '100ms', color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0 auto 40px auto', fontSize: '1.1rem' }}>
                    Curated manga perfect for the KoeScroll experience.
                    These series have dialogue-rich panels that shine with AI voice acting.
                </p>

                <div style={{ display: 'flex', gap: 24, paddingBottom: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                        { title: 'One Piece', vibe: 'Epic Adventure', voice: 'Clyde', color: '#e74c3c' },
                        { title: 'Death Note', vibe: 'Psychological', voice: 'Adam', color: '#9b59b6' },
                        { title: 'Chainsaw Man', vibe: 'Chaotic Energy', voice: 'Daniel', color: '#e67e22' },
                        { title: 'Spy x Family', vibe: 'Heartwarming', voice: 'Rachel', color: '#1abc9c' },
                    ].map((pick, i) => (
                        <div key={i} className={styles.animateOnScroll} style={{
                            transitionDelay: `${200 + (i * 100)}ms`,
                            minWidth: 220,
                            background: 'var(--color-surface)',
                            borderRadius: 20,
                            padding: 24,
                            border: '1px solid var(--color-border)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                background: pick.color
                            }} />
                            <div style={{
                                width: 48, height: 48,
                                borderRadius: 12,
                                background: `${pick.color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16,
                                margin: '0 auto 16px auto'
                            }}>
                                <Volume2 size={24} color={pick.color} />
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{pick.title}</div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 12
                            }}>
                                {pick.vibe}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* About Section */}
            <section id="about" className={styles.featuresSection} style={{ background: 'var(--color-surface)', textAlign: 'center' }}>
                <div className={styles.animateOnScroll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                    <Info size={28} color="var(--color-secondary)" />
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>About KoeScroll</h2>
                </div>

                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <p className={styles.animateOnScroll} style={{ transitionDelay: '100ms', color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 24 }}>
                        <strong style={{ color: 'var(--color-text-primary)' }}>KoeScroll</strong> (声スクロール) combines
                        cutting-edge AI voice synthesis with manga's visual storytelling. Our engine analyzes each panel,
                        detects dialogue, identifies characters, and generates unique voices in real-time.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginTop: 32 }}>
                        {[
                            { icon: <Zap size={20} />, stat: 'Dynamic', label: 'Voice Cast' },
                            { icon: <BookOpen size={20} />, stat: 'Real-time', label: 'Audio Generation' },
                            { icon: <Sparkles size={20} />, stat: 'Context Aware', label: 'Emotion Detection' },
                        ].map((item, i) => (
                            <div key={i} className={styles.animateOnScroll} style={{
                                transitionDelay: `${200 + (i * 100)}ms`,
                                background: 'var(--color-bg)',
                                borderRadius: 16,
                                padding: 24,
                                textAlign: 'center',
                                border: '1px solid var(--color-border)'
                            }}>
                                <div style={{
                                    color: 'var(--color-primary)',
                                    marginBottom: 12,
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}>
                                    {item.icon}
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>{item.stat}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className={styles.featuresSection} style={{ textAlign: 'center', paddingBottom: 80 }}>
                <h2 className={`${styles.headline} ${styles.animateOnScroll}`} style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 16, animation: 'none' }}>
                    Ready to experience manga<br />like never before?
                </h2>
                <p className={styles.animateOnScroll} style={{ transitionDelay: '100ms', color: 'var(--color-text-secondary)', marginBottom: 32, fontSize: '1.1rem' }}>
                    Join thousands of readers who've transformed their manga experience.
                </p>
                <div className={styles.animateOnScroll} style={{ transitionDelay: '200ms', display: 'inline-block' }}>
                    <Link to="/signup" className={styles.primaryCta} style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
                        <span>Get Started Free</span>
                    </Link>
                </div>
            </section>

            {/* Footer Credit */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="/icon.png" alt="Logo" style={{ width: 20, height: 20, borderRadius: 4, filter: 'grayscale(100%)', opacity: 0.7 }} />
                        <span>© 2025 KOESCROLL. NEURAL DESIGN BY <a href="https://www.linkedin.com/in/atharva-sarnaik-b9a2b627b/" target="_blank" rel="noopener noreferrer" className={styles.creditLink}>ATHARVA SARNAIK</a>.</span>
                    </div>
                    <div className={styles.footerLinks}>
                        <a href="#">PRIVACY</a>
                        <a href="#">TERMS</a>
                        <a href="#">X / NEURAL</a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;

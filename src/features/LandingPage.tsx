import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, PlayCircle, Sun, Moon } from 'lucide-react';
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
    const isDark = theme === 'dark';

    // Scroll progress state
    const [scrollProgress, setScrollProgress] = useState(0);

    // Feature cards ref for intersection observer
    const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    // Intersection Observer for feature cards
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                    }
                });
            },
            { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
        );

        featureRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

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
                        <div style={{
                            width: 24,
                            height: 24,
                            background: isDark ? '#fff' : '#1d1d1f',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sparkles size={14} color={isDark ? '#000' : 'white'} />
                        </div>
                        KoeScroll
                    </div>

                    <div className={styles.navLinks}>
                        <a href="#" className={styles.navLink}>Library</a>
                        <a href="#" className={styles.navLink}>Recommended</a>
                        <a href="#" className={styles.navLink}>About</a>
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

                    <Link to="/app/reader/demo" className={styles.secondaryCta}>
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
                        ref={(el) => { featureRefs.current[0] = el; }}
                        className={styles.featureCard}
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
                        ref={(el) => { featureRefs.current[1] = el; }}
                        className={styles.featureCard}
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
                        ref={(el) => { featureRefs.current[2] = el; }}
                        className={styles.featureCard}
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

        </div>
    );
};

export default LandingPage;

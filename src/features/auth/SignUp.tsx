import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import styles from './Auth.module.css';
import { useTheme } from '../../hooks/useTheme';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

// Google Icon SVG
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { signInWithGoogle, signUpWithEmail } = useAuth();
    const isDark = theme === 'dark';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await signUpWithEmail(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Navigate to app after signup
            navigate('/app');
        }
    };

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            // Redirect is handled by Supabase OAuth
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
            setGoogleLoading(false);
        }
    };

    return (
        <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
            <button className={styles.backBtn} onClick={() => navigate('/')}>
                <ArrowLeft size={20} />
                Back to Home
            </button>

            <div className={styles.themeToggleWrapper}>
                <ThemeToggle />
            </div>

            <div className={styles.card}>
                <div className={styles.logo}>
                    <div style={{ padding: 6, background: isDark ? '#fff' : '#000', borderRadius: 8, display: 'flex' }}>
                        <Sparkles size={18} color={isDark ? '#000' : '#fff'} />
                    </div>
                    KoeScroll
                </div>

                <div>
                    <h1 className={styles.title}>Create an account</h1>
                    <p className={styles.subtitle}>Start your immersive reading journey.</p>
                </div>

                {/* Google Button */}
                <button
                    type="button"
                    className={styles.googleBtn}
                    onClick={handleGoogleSignUp}
                    disabled={googleLoading}
                >
                    {googleLoading ? (
                        <Loader2 size={18} className="spin-animation" />
                    ) : (
                        <GoogleIcon />
                    )}
                    Continue with Google
                </button>

                <div className={styles.divider}>OR</div>

                {error && (
                    <div className={styles.error}>{error}</div>
                )}

                <form className={styles.form} onSubmit={handleSignUp}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin-animation" /> : 'Get Started'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Already have an account?
                    <Link to="/login" className={styles.link}>Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;

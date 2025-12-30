import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Chrome } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';
import ThemeToggle from '../../components/ThemeToggle';

const Login: React.FC = () => {
    const { signInWithGoogle, signInWithEmail } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.message || 'Failed to sign in with Google');
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await signInWithEmail(email, password);
            navigate('/app');
        } catch (err: any) {
            console.error('Login failed:', err);
            // Supabase specific error handling
            if (err.message === 'Invalid login credentials') {
                setError('Invalid email or password');
            } else {
                setError(err.message || 'Failed to sign in');
            }
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.themeToggleWrapper}>
                <ThemeToggle />
            </div>

            <button onClick={() => navigate('/')} className={styles.backBtn}>
                <ArrowLeft size={16} />
                Back to Home
            </button>

            <div className={styles.card}>
                <div className={styles.logo}>
                    <img
                        src="/icon.png"
                        alt="KoeScroll Logo"
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            marginBottom: 4,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                        }}
                    />
                    <span>KoeScroll</span>
                </div>

                <div>
                    <h1 className={styles.title}>Welcome back</h1>
                    <p className={styles.subtitle}>Sign in to continue your reading journey</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.form}>
                    <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email address</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Password</label>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className={styles.input}
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? <div className="loader small" /> : 'Log in'}
                        </button>
                    </form>

                    <div className={styles.divider}>
                        <span>Or continue with</span>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className={styles.googleBtn}
                    >
                        <Chrome size={20} />
                        Google
                    </button>
                </div>

                <div className={styles.footer}>
                    Don't have an account?
                    <Link to="/signup" className={styles.link}>Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;

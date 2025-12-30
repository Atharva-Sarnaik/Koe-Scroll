import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Chrome } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';
import ThemeToggle from '../../components/ThemeToggle';

const SignUp: React.FC = () => {
    const { signInWithGoogle, signUpWithEmail } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleGoogleSignUp = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
            console.error('Signup failed:', err);
            setError(err.message || 'Failed to sign up with Google');
            setLoading(false);
        }
    };

    const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await signUpWithEmail(email, password);
            setSuccessMessage('Account created! Please check your email/login.');
            setLoading(false);
            // Optionally navigate or wait for verify
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            console.error('Signup failed:', err);
            setError(err.message || 'Failed to create account');
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
                    <h1 className={styles.title}>Create account</h1>
                    <p className={styles.subtitle}>Join and experience manga like never before</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {successMessage && <div className={styles.success} style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--color-success)' }}>{successMessage}</div>}

                <div className={styles.form}>
                    <form onSubmit={handleEmailSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                placeholder="Create a password (min 6 chars)"
                                required
                                minLength={6}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                required
                                className={styles.input}
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? <div className="loader small" /> : 'Sign Up'}
                        </button>
                    </form>

                    <div className={styles.divider}>
                        <span>Or sign up with</span>
                    </div>

                    <button
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className={styles.googleBtn}
                    >
                        <Chrome size={20} />
                        Google
                    </button>
                </div>

                <div className={styles.footer}>
                    Already have an account?
                    <Link to="/login" className={styles.link}>Log in</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;

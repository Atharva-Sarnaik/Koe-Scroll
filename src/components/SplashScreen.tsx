import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for exit animation
        }, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: '#121212',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <div style={{
                            width: 80,
                            height: 80,
                            background: 'linear-gradient(135deg, #6C63FF, #00D9FF)',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 40px rgba(108, 99, 255, 0.4)',
                            marginBottom: 24
                        }}>
                            <Sparkles size={40} color="white" />
                        </div>

                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            letterSpacing: '-0.05em',
                            background: 'linear-gradient(to right, #fff, #aaa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: 8
                        }}>
                            KoeScroll
                        </h1>

                        <p style={{ color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                            Voice Activated Immersion
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        style={{ position: 'absolute', bottom: 60 }}
                    >
                        <div style={{ display: 'flex', gap: 4 }}>
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [4, 16, 4] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    style={{ width: 4, background: '#6C63FF', borderRadius: 2 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;

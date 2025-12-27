import React from 'react';
import { motion } from 'framer-motion';
import styles from './VoiceWaveform.module.css';

interface VoiceWaveformProps {
    isPlaying: boolean;
    color?: string; // Allow override for emotion colors later
}

const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ isPlaying, color }) => {
    if (!isPlaying) return null;

    // Variants for staggered animation
    const barVariants = {
        initial: { height: 4 },
        animate: (i: number) => ({
            height: [6, 24, 6],
            transition: {
                repeat: Infinity,
                duration: 0.8,
                ease: "easeInOut" as const,
                delay: i * 0.1, // Stagger effect
            },
        }),
    };

    return (
        <div className={styles.container}>
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    className={styles.bar}
                    custom={i}
                    variants={barVariants}
                    initial="initial"
                    animate="animate"
                    style={{ backgroundColor: color || 'var(--color-primary)' }}
                />
            ))}
        </div>
    );
};

export default VoiceWaveform;

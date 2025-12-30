import React, { useState } from 'react';
import { useReader } from '../context/ReaderContext';
import { X, Users, Mic } from 'lucide-react';
import styles from './VoiceControlPanel.module.css';
import { useNavigate } from 'react-router-dom';

const VoiceControlPanel: React.FC = () => {
    const { isVoicePanelOpen, setVoicePanelOpen } = useReader();
    const [speed, setSpeed] = useState(1.0);
    const [autoAdvance, setAutoAdvance] = useState(false);
    const navigate = useNavigate();

    // Close panel handler
    if (!isVoicePanelOpen) {
        // We keep it mounted but visually hidden for animation if desired, 
        // or return null but we want animation. 
        // For CSS modules animation, we usually need the container to exist.
        // However, overlay logic in module usually handles this.
    }

    return (
        <div
            className={`${styles.panelOverlay} ${isVoicePanelOpen ? styles.open : ''}`}
            onClick={() => setVoicePanelOpen(false)}
        >
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Voice Controls</h2>
                    <button className={styles.closeButton} onClick={() => setVoicePanelOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Playback</div>

                    <div className={styles.controlRow}>
                        <span>Speed ({speed}x)</span>
                        <div className={styles.sliderContainer}>
                            <span style={{ fontSize: '0.8rem' }}>0.5x</span>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className={styles.slider}
                            />
                            <span style={{ fontSize: '0.8rem' }}>2.0x</span>
                        </div>
                    </div>

                    <div className={styles.controlRow}>
                        <span>Auto-Advance Pages</span>
                        <div
                            className={`${styles.toggleSwitch} ${autoAdvance ? styles.active : ''}`}
                            onClick={() => setAutoAdvance(!autoAdvance)}
                        />
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Management</div>

                    <button
                        className={styles.controlRow}
                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: 'none', color: 'inherit', cursor: 'pointer' }}
                        onClick={() => {
                            setVoicePanelOpen(false); // Close panel before navigating
                            navigate('/reader/1/voices'); // Hardcoded ID for MVP demo
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Users size={20} color="var(--color-primary)" />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 600 }}>Character Voices</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Assign specific voices to characters</div>
                            </div>
                        </div>
                        <Mic size={16} color="var(--color-text-secondary)" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceControlPanel;

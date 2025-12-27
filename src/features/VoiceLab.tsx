import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Settings, Play, Plus, Trash2, Volume2, Pause, Loader2 } from 'lucide-react';
import { ElevenLabsClient } from '../services/ElevenLabsClient';
import { AudioCache } from '../services/AudioCache';
import { VoiceRegistry } from '../services/VoiceRegistry';
import { storageService } from '../services/StorageService';

interface DictionaryItem {
    id: number;
    original: string;
    phonetic: string;
}

const VoiceLab: React.FC = () => {
    const [speed, setSpeed] = useState(1.0);
    const [stability, setStability] = useState(50);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Error State
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Dictionary State
    const [dictionary, setDictionary] = useState<DictionaryItem[]>([]);
    const [loadingDict, setLoadingDict] = useState(true);

    // Playback State
    const [playingArchetype, setPlayingArchetype] = useState<string | null>(null);
    const [loadingArchetype, setLoadingArchetype] = useState<string | null>(null);

    // New Word Inputs
    const [newOriginal, setNewOriginal] = useState('');
    const [newPhonetic, setNewPhonetic] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const archetypes = [
        { id: 'hero', name: 'The Hero', desc: 'Bold, Determined, Young', color: '#FF5555', voiceType: 'Hero', sampleText: "I won't give up! My destiny is my own to forge." },
        { id: 'villain', name: 'The Villain', desc: 'Deep, Calculative, Smooth', color: '#A020F0', voiceType: 'Villain', sampleText: "You think you can stop me? How amusingly naive." },
        { id: 'narrator', name: 'The Narrator', desc: 'Calm, Omniscient, Steady', color: '#00D9FF', voiceType: 'Narrator', sampleText: "In a world where magic reigns supreme, one boy stood alone." },
    ];

    // Load Dictionary on Mount
    useEffect(() => {
        const loadDict = async () => {
            const saved = await storageService.loadDictionary();
            setDictionary(saved);
            setLoadingDict(false);
        };
        loadDict();
    }, []);

    // Save Dictionary when Changed (debounced slightly or manual save could be better, but effect is fine for small data)
    useEffect(() => {
        if (!loadingDict) {
            storageService.saveDictionary(dictionary);
        }
    }, [dictionary, loadingDict]);

    const handleAddWord = () => {
        if (!newOriginal.trim() || !newPhonetic.trim()) return;
        setDictionary(prev => [...prev, { id: Date.now(), original: newOriginal, phonetic: newPhonetic }]);
        setNewOriginal('');
        setNewPhonetic('');
        setShowAddForm(false);
    };

    const applyDictionary = (text: string): string => {
        let processed = text;
        dictionary.forEach(word => {
            // Simple replaceAll case-insensitive
            const regex = new RegExp(word.original, 'gi');
            processed = processed.replace(regex, word.phonetic);
        });
        return processed;
    };

    const playArchetypeSample = async (archId: string) => {
        // Stop current if playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis.cancel();

        if (playingArchetype === archId) {
            setPlayingArchetype(null);
            return;
        }

        const archetype = archetypes.find(a => a.id === archId);
        if (!archetype) return;

        setLoadingArchetype(archId);
        setErrorMessage(null);

        try {
            // 1. Get Voice ID
            const voiceId = VoiceRegistry.getVoice(archetype.voiceType);

            // 2. Pre-process Text with Dictionary
            const textToSpeak = applyDictionary(archetype.sampleText);

            // 3. Generate Cache Key
            const cacheKey = AudioCache.generateKey(textToSpeak, voiceId, stability, 0);

            // 4. Check Cache
            let audioBuffer = await AudioCache.getAudio(cacheKey);

            // 5. Fetch if missing
            if (!audioBuffer) {
                console.log(`[VoiceLab] Generating new audio for ${archetype.name}...`);
                try {
                    audioBuffer = await ElevenLabsClient.generateSpeech({
                        text: textToSpeak,
                        voiceId: voiceId,
                        stability: stability / 100, // Convert 0-100 to 0.0-1.0
                        style: 0 // Default style for now
                    });
                    await AudioCache.saveAudio(cacheKey, audioBuffer);
                } catch (apiError: any) {
                    console.warn("ElevenLabs failed, falling back to Browser TTS:", apiError);

                    // FALLBACK: Browser TTS
                    const utterance = new SpeechSynthesisUtterance(textToSpeak);
                    utterance.rate = speed;

                    // Simple Voice Selection Logic
                    const voices = window.speechSynthesis.getVoices();
                    const preferredVoice = voices.find(v =>
                        (archetype.id === 'hero' && v.name.includes('Male')) ||
                        (archetype.id === 'villain' && v.name.includes('Google')) ||
                        v.lang === 'en-US'
                    );
                    if (preferredVoice) utterance.voice = preferredVoice;

                    utterance.onend = () => setPlayingArchetype(null);
                    utterance.onerror = () => setPlayingArchetype(null);

                    window.speechSynthesis.speak(utterance);
                    setPlayingArchetype(archId);

                    if (apiError?.message?.includes('401')) {
                        setErrorMessage("API Blocked (401). Using Offline Browser Voices.");
                    } else {
                        setErrorMessage("Offline Mode: Using Browser Voices.");
                    }
                    return;
                }
            }

            // 6. Play Audio
            const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            // Apply client-side speed
            audio.playbackRate = speed;

            audio.onended = () => {
                setPlayingArchetype(null);
                URL.revokeObjectURL(url);
            };

            audioRef.current = audio;
            await audio.play();
            setPlayingArchetype(archId);

        } catch (error: any) {
            console.error("Playback failed:", error);
            setErrorMessage(error?.message || "Playback failed.");
        } finally {
            setLoadingArchetype(null);
        }
    };

    return (
        <div className="container" style={{ padding: '0px 48px 80px 48px', maxWidth: '1000px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ padding: '40px 0 32px 0' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 700 }}>Voice Lab</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={18} color="#00D9FF" /> Fine-tune your AI's brain and vocal performance.
                </p>
            </div>

            {errorMessage && (
                <div style={{
                    padding: '16px', borderRadius: '12px',
                    background: 'rgba(255, 165, 0, 0.1)', border: '1px solid #FFA500',
                    color: '#FFA500', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <Volume2 size={20} />
                    <div>
                        <strong>Notice:</strong> {errorMessage}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

                {/* Left Column: Archetypes */}
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Archetype Playground</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {archetypes.map(arch => (
                            <div key={arch.id} className="glass-panel" style={{
                                padding: '20px', borderRadius: '16px',
                                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: arch.color, opacity: 0.2,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Mic2 size={20} color={arch.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{arch.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{arch.desc}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => playArchetypeSample(arch.id)}
                                    disabled={loadingArchetype === arch.id}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: loadingArchetype === arch.id ? 'var(--color-surface)' : 'var(--color-primary)',
                                        border: loadingArchetype === arch.id ? '1px solid var(--color-border)' : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: 'white',
                                        transition: 'all 0.2s',
                                        opacity: loadingArchetype && loadingArchetype !== arch.id ? 0.5 : 1
                                    }}
                                >
                                    {loadingArchetype === arch.id ? (
                                        <Loader2 size={18} className="spin" color="var(--color-text-primary)" />
                                    ) : playingArchetype === arch.id ? (
                                        <Pause size={18} fill="currentColor" />
                                    ) : (
                                        <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Settings & Dictionary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Global Voice Settings */}
                    <div className="glass-panel" style={{
                        padding: '24px', borderRadius: '20px',
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Volume2 size={18} /> Global Parameters
                        </h3>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Narrator Speed (Playback)</span>
                                <span>{speed.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range" min="0.5" max="2.0" step="0.1"
                                value={speed} onChange={(e) => {
                                    const newSpeed = parseFloat(e.target.value);
                                    setSpeed(newSpeed);
                                    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
                                }}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Voice Stability</span>
                                <span>{stability}%</span>
                            </div>
                            <input
                                type="range" min="0" max="100" step="1"
                                value={stability} onChange={(e) => setStability(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                        </div>
                    </div>

                    {/* Pronunciation Dictionary */}
                    <div className="glass-panel" style={{
                        padding: '24px', borderRadius: '20px',
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        flex: 1, minHeight: '300px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Dictionary
                            </h3>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                style={{
                                    background: showAddForm ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '8px', padding: '6px', cursor: 'pointer',
                                    color: showAddForm ? 'white' : 'var(--color-text-primary)'
                                }}>
                                <Plus size={18} />
                            </button>
                        </div>

                        {showAddForm && (
                            <div style={{
                                marginBottom: '16px', padding: '12px',
                                background: 'rgba(255,255,255,0.05)', borderRadius: '12px'
                            }}>
                                <input
                                    placeholder="Original (e.g. Sowaka)"
                                    value={newOriginal}
                                    onChange={e => setNewOriginal(e.target.value)}
                                    style={{
                                        width: '100%', marginBottom: '8px', padding: '8px',
                                        borderRadius: '8px', border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg)', color: 'white'
                                    }}
                                />
                                <input
                                    placeholder="Phonetic (e.g. So-wah-ka)"
                                    value={newPhonetic}
                                    onChange={e => setNewPhonetic(e.target.value)}
                                    style={{
                                        width: '100%', marginBottom: '8px', padding: '8px',
                                        borderRadius: '8px', border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg)', color: 'white'
                                    }}
                                />
                                <button
                                    onClick={handleAddWord}
                                    style={{
                                        width: '100%', padding: '8px', borderRadius: '8px',
                                        background: 'var(--color-primary)', border: 'none', color: 'white', fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Add Word
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                            {dictionary.map(word => (
                                <div key={word.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{word.original}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>"{word.phonetic}"</div>
                                    </div>
                                    <button
                                        onClick={() => setDictionary(prev => prev.filter(w => w.id !== word.id))}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, color: '#FF5555' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {dictionary.length === 0 && !loadingDict && (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                    No custom pronunciations yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceLab;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReader } from '../context/ReaderContext';
import { VoiceMemory } from '../services/VoiceMemory';
import { ChevronLeft, User, Mic, Save, Sparkles } from 'lucide-react';

// Mock list of available voices (would come from ElevenLabs API)
const AVAILABLE_VOICES = [
    { id: '1', name: 'Rachel', tags: ['female', 'American', 'soft'] },
    { id: '2', name: 'Drew', tags: ['male', 'American', 'deep'] },
    { id: '3', name: 'Clyde', tags: ['male', 'deep', 'action'] },
    { id: '4', name: 'Mimi', tags: ['female', 'young', 'energetic'] },
];

const VoiceManager: React.FC = () => {
    const { chapter } = useReader();
    const navigate = useNavigate();
    // const { id } = useParams(); // Unused for now

    // Local state for assignments
    // In real app, this would sync with a Global Store or Backend
    const [assignments, setAssignments] = useState<Record<string, string>>({});

    // Extract unique characters from chapter text bubbles
    const characters = React.useMemo(() => {
        if (!chapter) return [];
        const set = new Set<string>();
        chapter.pages.forEach(p => {
            p.textBubbles.forEach(b => {
                if (b.characterName) set.add(b.characterName);
            });
        });
        return Array.from(set);
    }, [chapter]);

    useEffect(() => {
        // Check for suggestions from memory
        const initial: Record<string, string> = {};
        characters.forEach(char => {
            const suggested = VoiceMemory.suggestVoice(char);
            if (suggested) {
                initial[char] = suggested;
            }
        });
        setAssignments(prev => ({ ...prev, ...initial }));
    }, [characters]);

    const handleAssign = (char: string, voiceId: string) => {
        setAssignments(prev => ({ ...prev, [char]: voiceId }));
    };

    const handleSave = () => {
        // Save all assignments to VoiceMemory
        Object.entries(assignments).forEach(([char, voiceId]) => {
            VoiceMemory.saveVoice(char, voiceId, 'other', chapter?.title);
        });
        navigate(-1); // Go back to reader
    };

    if (!chapter) return <div className="container" style={{ padding: 20 }}>Loading...</div>;

    return (
        <div className="container" style={{ padding: '24px', maxWidth: '800px' }}>
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                <button onClick={() => navigate(-1)} style={{ color: 'white', marginRight: '16px' }}>
                    <ChevronLeft />
                </button>
                <h1>Character Voices</h1>
            </header>

            <div style={{ display: 'grid', gap: '16px' }}>
                {characters.map(char => {
                    const currentVoice = assignments[char];
                    // Check if this was a suggestion (simple check against memory again or just UI Logic)
                    const isSuggested = VoiceMemory.suggestVoice(char) === currentVoice;

                    return (
                        <div key={char} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: 48, height: 48, background: '#333', borderRadius: '50%', padding: '12px' }}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{char}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#aaa' }}>
                                        {currentVoice ? (
                                            <>
                                                <Mic size={14} />
                                                <span>{AVAILABLE_VOICES.find(v => v.id === currentVoice)?.name || 'Unknown Voice'}</span>
                                                {isSuggested && (
                                                    <span style={{
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        background: 'rgba(108, 99, 255, 0.2)', color: '#6C63FF',
                                                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem'
                                                    }}>
                                                        <Sparkles size={12} /> Memory Match
                                                    </span>
                                                )}
                                            </>
                                        ) : 'No voice assigned'}
                                    </div>
                                </div>
                            </div>

                            <select
                                value={currentVoice || ''}
                                onChange={(e) => handleAssign(char, e.target.value)}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    border: '1px solid #444',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="">Select Voice</option>
                                {AVAILABLE_VOICES.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.tags.join(', ')})</option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleSave}
                style={{
                    position: 'fixed', bottom: '32px', right: '32px',
                    background: 'var(--color-primary)', color: 'white',
                    padding: '16px 32px', borderRadius: '32px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '1.1rem', fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.4)'
                }}
            >
                <Save size={20} />
                Save & Continue
            </button>
        </div>
    );
};

export default VoiceManager;

import React, { useState } from 'react';
import { Search, Mic, Activity, Play, Clock, BarChart3, Database, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';

const Library: React.FC = () => {
    const { library, updateMangaMetadata } = useLibrary();
    const [search, setSearch] = useState('');
    const [expandedManga, setExpandedManga] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const startEditing = (e: React.MouseEvent, manga: any) => {
        e.stopPropagation();
        setEditingId(manga.id);
        setEditTitle(manga.title);
    };

    const saveTitle = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            updateMangaMetadata(id, {
                title: editTitle.trim(),
                titleSource: 'user',
                titleConfidence: 1.0
            });
        }
        setEditingId(null);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

    const filtered = library.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate Global Stats
    const importedCount = library.filter(m => m.id.startsWith('imported-')).length;
    const totalChapters = library.reduce((acc, m) => acc + m.chapters.length, 0);

    return (
        <div className="container" style={{ padding: '0px 48px 80px 48px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header Stats */}
            <div style={{ padding: '40px 0 24px 0' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 700 }}>Your Metashelf</h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} /> All your local imports, enhanced by AI.
                </p>
            </div>

            {/* Dashboard Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                <StatCard
                    icon={<Database size={24} color="#6C63FF" />}
                    label="Active Series"
                    value={library.length}
                    subtext={`${importedCount} Imported`}
                />
                <StatCard
                    icon={<BarChart3 size={24} color="#00D9FF" />}
                    label="Total Chapters"
                    value={totalChapters}
                    subtext="Ready to read"
                />
                <StatCard
                    icon={<Mic size={24} color="#FF5555" />}
                    label="Voice AI"
                    value="Active"
                    subtext="Processing enabled"
                />
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{
                padding: '16px 24px', borderRadius: '16px',
                display: 'flex', alignItems: 'center', gap: '16px',
                marginBottom: '32px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
            }}>
                <Search size={20} color="var(--color-text-secondary)" />
                <input
                    type="text"
                    placeholder="Search your library..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        background: 'transparent', border: 'none', color: 'var(--color-text-primary)',
                        fontSize: '1rem', width: '100%', outline: 'none'
                    }}
                />
            </div>

            {/* Premium List View */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filtered.map(item => {
                    const isExpanded = expandedManga === item.id;
                    const isEditing = editingId === item.id;
                    const lastReadChapter = item.chapters.find(c => (c.progress || 0) > 0) || item.chapters[0];

                    return (
                        <div key={item.id} className="glass-panel" style={{
                            borderRadius: '24px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            transition: 'all 0.3s ease',
                            overflow: 'hidden'
                        }}>
                            {/* Main Card Content */}
                            <div
                                onClick={() => !isEditing && setExpandedManga(isExpanded ? null : item.id)}
                                style={{
                                    padding: '24px',
                                    display: 'flex',
                                    gap: '24px',
                                    cursor: isEditing ? 'default' : 'pointer',
                                    alignItems: 'center'
                                }}
                            >
                                {/* Cover */}
                                <div style={{
                                    width: '80px', height: '110px',
                                    borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                                    background: '#222',
                                    backgroundImage: `url(${item.coverImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}>
                                    {/* <img src={item.coverImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
                                    {/* Background Image used instead for better fit handling */}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveTitle(e, item.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    autoFocus
                                                    style={{
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: '1px solid var(--color-primary)',
                                                        color: 'white',
                                                        fontSize: '1.25rem',
                                                        fontWeight: 600,
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        width: '300px'
                                                    }}
                                                />
                                                <button onClick={(e) => saveTitle(e, item.id)} style={{ background: 'var(--color-success)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>
                                                    <Check size={16} color="white" />
                                                </button>
                                                <button onClick={cancelEditing} style={{ background: 'var(--color-error)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>
                                                    <X size={16} color="white" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{item.title}</h3>
                                                <button
                                                    className="hover-scale"
                                                    onClick={(e) => startEditing(e, item)}
                                                    title="Edit Title"
                                                    style={{
                                                        background: 'transparent', border: 'none',
                                                        color: 'var(--color-text-secondary)',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center'
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '4px 12px',
                                                    background: 'rgba(255,255,255,0.05)', borderRadius: '100px',
                                                    color: 'var(--color-text-secondary)'
                                                }}>
                                                    {item.id.startsWith('imported') ? 'PDF Import' : 'Official'}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                                        <StatItem icon={<Clock size={14} />} label="Added" value={new Date(item.addedDate).toLocaleDateString()} />
                                        <StatItem icon={<Database size={14} />} label="Chapters" value={item.chapters.length} />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>

                                    {/* Resume Button */}
                                    <button
                                        className="btn-primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Navigation handled by Link inside
                                        }}
                                        style={{
                                            background: 'var(--color-primary)',
                                            border: 'none',
                                            borderRadius: '100px',
                                            padding: 0 // resetting padding for Link
                                        }}
                                    >
                                        <Link to={`/app/reader/${lastReadChapter.id}`} style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 24px',
                                            color: 'white',
                                            textDecoration: 'none',
                                            fontWeight: 600
                                        }}>
                                            <Play size={16} fill="currentColor" /> Resume
                                        </Link>
                                    </button>

                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        {isExpanded ? 'Hide Chapters' : 'View Chapters'}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Chapter List */}
                            {isExpanded && (
                                <div style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    padding: '24px',
                                }}>
                                    <h4 style={{
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text-secondary)',
                                        marginBottom: '16px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontWeight: 600
                                    }}>
                                        Detected Chapters ({item.chapters.length})
                                    </h4>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                                        {item.chapters.map((ch) => {
                                            const chProgress = ch.progress || 0;
                                            return (
                                                <Link
                                                    key={ch.id}
                                                    to={`/app/reader/${ch.id}`}
                                                    className="hover-bright"
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '16px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '12px',
                                                        textDecoration: 'none',
                                                        color: 'white',
                                                        transition: 'background 0.2s',
                                                        border: '1px solid transparent'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '4px' }}>
                                                            {ch.title || `Chapter ${ch.number}`}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                            {ch.pages.length} Pages
                                                        </div>
                                                    </div>

                                                    {chProgress > 0 && (
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            background: 'var(--color-primary)',
                                                            color: 'white'
                                                        }}>
                                                            Page {chProgress + 1}
                                                        </div>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No imports found matching "{search}"
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, subtext: string }> = ({ icon, label, value, subtext }) => (
    <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '24px',
        borderRadius: '24px',
        display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
        <div style={{ marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
        <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{subtext}</div>
        </div>
    </div>
);

const StatItem: React.FC<{ icon: React.ReactNode, label: string, value: any, highlight?: boolean }> = ({ icon, label, value, highlight }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {icon} {label}
        </span>
        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: highlight ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
            {value}
        </span>
    </div>
);

export default Library;

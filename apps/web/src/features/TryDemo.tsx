import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { DEMO_MANGA, downloadDemoPDF } from '../services/DemoService';
import { useLibrary } from '../context/LibraryContext';
import { PdfService } from '../services/PdfService';

const TryDemo: React.FC = () => {
    const navigate = useNavigate();
    const { addToLibrary, getMangaById, removeFromLibrary, isLoading } = useLibrary();
    const addManga = addToLibrary;

    const [status, setStatus] = useState<'ready' | 'downloading' | 'processing' | 'done' | 'error'>('ready');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    const handleStartDemo = async () => {
        if (isLoading) return; // Wait for library to load

        setStatus('downloading');
        setProgress(0);
        setError('');

        try {
            // Check if demo already exists in library
            const existingManga = getMangaById(DEMO_MANGA.id);
            const isInvalidVideo = existingManga?.chapters?.[0]?.sourceType !== 'pdf';

            if (existingManga && !isInvalidVideo && existingManga.chapters[0].contentUrl) {
                // Valid demo exists, go to reader
                console.log("Demo valid, navigating...", existingManga);
                navigate(`/app/reader/demo-ch1`);
                return;
            }

            if (existingManga && (isInvalidVideo || !existingManga.chapters[0].contentUrl)) {
                console.log('Found invalid demo data, purging...');
                await removeFromLibrary(DEMO_MANGA.id);
                localStorage.removeItem('demo-loaded');
            }

            // Download the PDF from GitHub
            const pdfBuffer = await downloadDemoPDF((p) => setProgress(p));

            setStatus('processing');
            setProgress(0);

            // Process the PDF to extract pages
            const pages = await PdfService.extractPages(pdfBuffer);

            // Add to library
            // Note: extractPages returns Page[] but we need Chapters structure if adhering to Manga interface.
            // But TryDemo was creating a Manga object. Let's adapt it.
            // We'll create a single chapter for the demo.

            await addManga({
                id: DEMO_MANGA.id,
                title: DEMO_MANGA.title,
                coverImage: DEMO_MANGA.coverUrl, // Mapping coverUrl to coverImage
                chapterId: 'demo-ch1', // Adding missing required field or adapting?
                // Wait, addToLibrary expects Manga object.
                // Let's reset the object to match Manga interface
                chapters: [{
                    id: 'demo-ch1',
                    mangaId: DEMO_MANGA.id,
                    title: 'Chapter 1',
                    number: 1,
                    pages: pages,
                    progress: 0,
                    sourceType: 'pdf',
                    contentUrl: DEMO_MANGA.pdfUrl
                }],
                addedDate: Date.now(),
                isDemo: true
            } as any); // Casting as any to bypass strict checks if interface mismatch persists temporarily, but trying to match logic.

            // Actually, LibraryContext exposes `addToLibrary` but I imported `useLibrary`.
            // Let's fix the destructuring first: const { addToLibrary } = useLibrary();

            // Mark demo as loaded
            localStorage.setItem('demo-loaded', 'true');

            setStatus('done');

            // Navigate to reader after short delay
            setTimeout(() => {
                navigate(`/app/reader/demo-ch1`);
            }, 1500);

        } catch (err: any) {
            console.error('Demo load failed:', err);
            setError(err.message || 'Failed to load demo');
            setStatus('error');
        }
    };

    // Auto-start on mount, retry when loading finishes
    useEffect(() => {
        if (!isLoading) {
            handleStartDemo();
        }
    }, [isLoading]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}>
                {/* Logo */}
                <div style={{
                    width: 64,
                    height: 64,
                    background: 'var(--gradient-primary)',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 32px',
                    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
                }}>
                    <Sparkles size={32} color="#000" />
                </div>

                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>
                    {status === 'ready' && 'Preparing Demo...'}
                    {status === 'downloading' && 'Downloading One Piece Vol. 1'}
                    {status === 'processing' && 'Processing Pages...'}
                    {status === 'done' && 'Ready to Read!'}
                    {status === 'error' && 'Something went wrong'}
                </h1>

                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '40px' }}>
                    {status === 'downloading' && `${progress}% complete - Please wait...`}
                    {status === 'processing' && 'Extracting manga pages...'}
                    {status === 'done' && 'Redirecting to reader...'}
                    {status === 'error' && error}
                </p>

                {/* Progress Bar */}
                {(status === 'downloading') && (
                    <div style={{
                        height: 8,
                        background: 'var(--color-border)',
                        borderRadius: 4,
                        overflow: 'hidden',
                        marginBottom: '40px'
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'var(--gradient-primary)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                )}

                {/* Status Icon */}
                <div style={{ marginBottom: '32px' }}>
                    {status === 'downloading' && (
                        <Download size={48} style={{ color: 'var(--color-primary)', animation: 'pulse 1s infinite' }} />
                    )}
                    {status === 'processing' && (
                        <Loader2 size={48} className="spin-animation" style={{ color: 'var(--color-primary)' }} />
                    )}
                    {status === 'done' && (
                        <CheckCircle size={48} style={{ color: 'var(--color-success)' }} />
                    )}
                    {status === 'error' && (
                        <AlertCircle size={48} style={{ color: '#ef4444' }} />
                    )}
                </div>

                {/* Error retry button */}
                {status === 'error' && (
                    <button
                        onClick={handleStartDemo}
                        className="btn-primary"
                        style={{ padding: '12px 32px' }}
                    >
                        Try Again
                    </button>
                )}

                {/* Back button */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        marginTop: '24px',
                        fontSize: '0.9rem'
                    }}
                >
                    ← Back to Home
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default TryDemo;

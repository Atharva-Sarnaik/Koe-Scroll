import React, { useRef, useState } from 'react';
import { Upload, Plus, Loader2, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { pdfService } from '../services/PdfService';
import type { Manga, Chapter, Page } from '../types/manga';

const AddManga: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToLibrary, removeFromLibrary, library } = useLibrary();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Filter for imported items
    const importedManga = library.filter(m => m.id.startsWith('imported-'));

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        let title = file.name.replace('.pdf', '');

        // Check for duplicate (Check filename first, might rename later)
        const existing = importedManga.find(m => m.title === title || m.id === `imported-${title}`);
        if (existing) {
            if (confirm(`"${title}" is already in your library. Do you want to open it instead?`)) {
                navigate(`/app/reader/${existing.chapters[0].id}`);
                return;
            }
            return;
        }

        setIsProcessing(true);
        setStatusMessage('Reading file...');

        try {
            if (file.type === 'application/pdf') {
                const fileUrl = URL.createObjectURL(file);

                // 1. Load PDF
                const numPages = await pdfService.loadDocument(fileUrl);
                const mangaId = `imported-${Date.now()}`;

                // 2. Analyze Cover (Page 1)
                setStatusMessage('Analyzing Cover with AI...');
                let coverImage = 'https://via.placeholder.com/300x450?text=PDF';
                let isCoverDetected = false;
                let detectedTitle = null;
                let coverConfidence = 0;

                // Dynamic import service
                const { geminiService } = await import('../services/GeminiService');

                try {
                    const canvas = document.createElement('canvas');
                    await pdfService.renderPageToCanvas(1, canvas, 1.0);
                    coverImage = canvas.toDataURL('image/png');

                    const analysis = await geminiService.analyzeCover(coverImage);
                    console.log("[AddManga] Cover Analysis Result:", analysis);

                    if (analysis.isCover) {
                        isCoverDetected = true;
                        coverConfidence = analysis.confidence || 0;
                        // Lower threshold to 0.4 to catch more cases, user can always rename later
                        if (analysis.title && analysis.confidence > 0.4) {
                            detectedTitle = analysis.title;
                            title = analysis.title;
                        }
                    }
                } catch (e) {
                    console.warn("Cover analysis failed", e);
                }

                // 3. Detect Chapters (Scan all pages)
                setStatusMessage('Scanning for chapters (this may take a moment)...');

                let detectedChapters: { chapter_number: number; start_page: number; end_page: number }[] = [];
                const BATCH_SIZE = 15; // Send 15 pages at a time to avoid huge payloads

                try {
                    // Skip page 1 (cover)
                    for (let i = 2; i <= numPages; i += BATCH_SIZE) {
                        const batchImages: { pageIndex: number; base64: string }[] = [];
                        const end = Math.min(i + BATCH_SIZE - 1, numPages);

                        setStatusMessage(`Scanning pages ${i}-${end} of ${numPages}...`);

                        for (let p = i; p <= end; p++) {
                            const canvas = document.createElement('canvas');
                            // Low res for structure analysis is fine
                            await pdfService.renderPageToCanvas(p, canvas, 0.5);
                            batchImages.push({
                                pageIndex: p, // 1-based index matching PDF
                                base64: canvas.toDataURL('image/jpeg', 0.7)
                            });
                        }

                        // Send batch
                        // Pass total pages for context
                        const result = await geminiService.detectChapters(batchImages, numPages);

                        if (result.chapters && result.chapters.length > 0) {
                            detectedChapters = [...detectedChapters, ...result.chapters];
                        }
                    }

                    // Deduplicate and Sort
                    detectedChapters = detectedChapters
                        .filter((v, i, a) => a.findIndex(t => t.start_page === v.start_page) === i)
                        .sort((a, b) => a.start_page - b.start_page);

                } catch (e) {
                    console.error("Chapter scanning failed", e);
                }

                // 4. Construct Final Chapters
                let finalChapters: Chapter[] = [];

                // FALLBACK LOGIC (Mandatory if no chapters detected OR suspicious single chapter in large file)
                // If we have 200 pages and only find 1 chapter, detection likely failed for subsequent markers.
                // Threshold: > 60 pages implies at least 2-3 chapters typically.
                const shouldUseFallback = detectedChapters.length === 0 || (numPages > 60 && detectedChapters.length === 1);

                if (shouldUseFallback) {
                    console.log(`[AddManga] Fallback Triggered. Detected: ${detectedChapters.length}, Pages: ${numPages}`);

                    // Clear any partial detection (e.g. just Chapter 1)
                    detectedChapters = [];

                    // Fallback Rule: round(total_pages / 20)
                    let estimatedCount = Math.round(numPages / 20);
                    if (estimatedCount < 1) estimatedCount = 1;

                    const pagesPerChapter = Math.floor(numPages / estimatedCount);
                    console.log(`Fallback: Creating ${estimatedCount} chapters (~${pagesPerChapter} pages each)`);

                    for (let i = 0; i < estimatedCount; i++) {
                        const start = (i * pagesPerChapter) + 1; // 1-based
                        // Ensure last chapter goes to end
                        const end = (i === estimatedCount - 1) ? numPages : (start + pagesPerChapter - 1);

                        detectedChapters.push({
                            chapter_number: i + 1,
                            start_page: start,
                            end_page: end
                        });
                    }
                } else {
                    // Logic for detected chapters
                    // We need to fill gaps.
                    // Rule: Chapter N end = Chapter N+1 start - 1
                    for (let i = 0; i < detectedChapters.length; i++) {
                        const current = detectedChapters[i];
                        const next = detectedChapters[i + 1];

                        if (next) {
                            current.end_page = next.start_page - 1;
                        } else {
                            current.end_page = numPages;
                        }

                        // Sanity check
                        if (current.end_page < current.start_page) {
                            current.end_page = current.start_page;
                        }
                    }
                }

                // Generate Chapter Objects
                finalChapters = detectedChapters.map(ch => {
                    const chId = `ch-${mangaId}-${ch.chapter_number}`;
                    const chPages: Page[] = [];

                    for (let p = ch.start_page; p <= ch.end_page; p++) {
                        chPages.push({
                            id: `page-${mangaId}-${p}`,
                            chapterId: chId,
                            pageNumber: p,
                            imageUrl: '',
                            textBubbles: [],
                            isCover: (p === 1 && isCoverDetected),
                            excludeFromScript: (p === 1 && isCoverDetected)
                        });
                    }

                    return {
                        id: chId,
                        title: `Chapter ${ch.chapter_number}`,
                        mangaId: mangaId,
                        number: ch.chapter_number,
                        pages: chPages,
                        sourceType: 'pdf',
                        contentUrl: fileUrl, // All share same PDF
                        progress: 0
                    };
                });

                // Clean filename fallback
                const cleanFilename = (name: string) => {
                    // Remove extension
                    let clean = name.replace(/\.pdf$/i, '');
                    // Remove leading IDs (e.g. "12345-Title")
                    clean = clean.replace(/^\d+[-_.]\s*/, '');
                    // Replace separators with spaces
                    clean = clean.replace(/[-_]/g, ' ');
                    return clean.trim();
                };

                const fallbackTitle = cleanFilename(file.name);
                let finalTitle = detectedTitle || fallbackTitle;
                const titleSource = detectedTitle ? 'cover' : 'filename';
                const titleConfidence = detectedTitle ? coverConfidence : 0.5;

                // Metadata
                const newManga: Manga = {
                    id: mangaId,
                    title: finalTitle,
                    coverImage: coverImage,
                    author: 'Unknown',
                    description: `Imported PDF • ${finalChapters.length} Chapters Detected`,
                    chapters: finalChapters,
                    addedDate: Date.now(),
                    titleSource,
                    titleConfidence,
                    totalPageCount: numPages // Store exact PDF page count
                };

                await addToLibrary(newManga, file);
                setStatusMessage(`Imported "${newManga.title}" (${titleSource}) with ${finalChapters.length} chapters!`);

                setTimeout(() => {
                    navigate(`/app/reader/${finalChapters[0].id}`);
                }, 1500);

            } else {
                alert('Only PDF files are supported currently.');
                setIsProcessing(false);
            }
        } catch (error) {
            console.error(error);
            setStatusMessage('Import failed: ' + (error as any).message);
            setIsProcessing(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, mangaId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to remove this manga from your library?')) {
            await removeFromLibrary(mangaId);
        }
    };

    return (
        <div className="container" style={{ padding: '24px 40px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Split Layout: Upload (Top) -> List (Bottom) */}

            <div className="glass-panel" style={{
                padding: '40px',
                borderRadius: '32px',
                textAlign: 'center',
                border: '2px dashed var(--color-border)',
                marginBottom: '40px',
                background: 'var(--color-surface)'
            }}>
                <div style={{
                    width: 60, height: 60,
                    background: 'var(--color-surface-elevated)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px auto'
                }}>
                    {isProcessing ? (
                        <Loader2 size={24} className="start-animation" color="var(--color-primary)" />
                    ) : (
                        <Upload size={24} color="var(--color-primary)" />
                    )}
                </div>

                <h1 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>{isProcessing ? 'Importing Manga...' : 'Import New Manga'}</h1>

                {isProcessing ? (
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>{statusMessage}</p>
                ) : (
                    <>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                            Support for .pdf files. AI processing happens automatically.
                        </p>

                        <input
                            type="file"
                            accept=".pdf"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />

                        <button
                            className="btn-primary"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <Plus size={18} />
                            Select PDF File
                        </button>
                    </>
                )}
            </div>

            {/* Imported List Section */}
            {importedManga.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={20} color="var(--color-primary)" />
                        Your Imports
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px'
                    }}>
                        {importedManga.map(manga => {
                            const chapter = manga.chapters[0]; // Assuming single chapter for imports usually
                            const progress = chapter?.progress || 0;

                            // FIX: Calculate total pages from all chapters OR use saved total
                            const totalPages = manga.totalPageCount || manga.chapters.reduce((acc, ch) => acc + (ch.pages?.length || 0), 0) || 1;

                            // Adjust progress to be relative to TOTAL manga (approximate if not tracking global progress)
                            // Ideally, we'd grab the last read chapter and add its progress to previous chapters' lengths.
                            // But for now, let's keep it simple: just show page count.

                            const percentage = Math.round((progress / totalPages) * 100);

                            return (
                                <div key={manga.id} className="glass-panel" style={{
                                    padding: '20px',
                                    borderRadius: '16px',
                                    display: 'flex', gap: '16px',
                                    alignItems: 'center',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                    onClick={() => navigate(`/app/reader/${chapter.id}`)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        const btn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                                        if (btn) btn.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        const btn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                                        if (btn) btn.style.opacity = '0';
                                    }}
                                >

                                    {/* Thumbnail (Use generated cover or placeholder) */}
                                    <div style={{
                                        width: '60px', height: '80px',
                                        borderRadius: '8px',
                                        background: 'var(--color-surface-elevated)',
                                        backgroundImage: `url(${manga.coverImage})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        flexShrink: 0
                                    }} />

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            marginBottom: '4px',
                                            whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
                                        }}>
                                            {manga.title}
                                        </h3>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                                            <Clock size={12} />
                                            <span>
                                                {progress > 0 ? `Page ${progress + 1} of ${totalPages}` : 'Not started'}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${percentage}%`,
                                                height: '100%',
                                                background: 'var(--color-primary)',
                                                borderRadius: '2px'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => handleDelete(e, manga.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            background: 'rgba(0,0,0,0.5)',
                                            color: '#ff4444',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            opacity: 0,
                                            transition: 'opacity 0.2s'
                                        }}
                                        title="Remove from library"
                                    >
                                        &times;
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddManga;

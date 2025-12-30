import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useReader } from '../context/ReaderContext';
import VoiceWaveform from '../components/VoiceWaveform';
import styles from './Reader.module.css';
import { AudioEngine } from '../features/AudioEngine';
import BottomControlBar from '../components/BottomControlBar';
import VoiceControlPanel from '../components/VoiceControlPanel';
import { pdfService } from '../services/PdfService';
import { useLibrary } from '../context/LibraryContext';

const Reader: React.FC = () => {
    const {
        chapter,
        pages, // Get pages
        currentPageIndex,
        activeBubbleId,
        setActiveBubbleId,
        isPlaying,
        setIsPlaying,

        scale,
        setScale,
        position,
        setPosition,
        viewMode,
        loadChapter,
        nextPage,
        prevPage
    } = useReader();

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const { isLoading: isLibraryLoading } = useLibrary();

    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        if (id && !isLibraryLoading) {
            loadChapter(id);
        }
    }, [id, isLibraryLoading]);

    // If no chapter loaded, show loading or empty state
    // MOVED: This check must be AFTER all hooks to avoid "Rendered fewer hooks than expected" error
    /* 
    if (!chapter) {
        return <div className={styles.container}>Loading Chapter...</div>;
    } 
    */

    const currentPage = pages[currentPageIndex];

    // Simple key navigation
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                nextPage();
            } else if (e.key === 'ArrowLeft') {
                prevPage();
            } else if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                // Toggle active audio
                // We rely on AudioEngine's internal tracking, but we also update React state if needed?
                // Actually AudioEngine togglePause returns true if running, false if suspended.
                // But setIsPlaying tracks the "active source" existence, not playback state explicitly.
                // However, for UI feedback, maybe we want to keep isPlaying true even if suspended?
                // Use VoiceWaveform for feedback? VoiceWaveform only animates if isPlaying is true.
                // If we suspend, we might want to stop animation?
                // Let's just toggle audio.
                await AudioEngine.togglePause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextPage, prevPage]);

    // --- Zoom & Pan Handlers ---
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY * -0.01;
            const newScale = Math.min(Math.max(1, scale + delta), 4); // Clamp between 1x and 4x
            setScale(newScale);

            // Reset position if zooming out to 1
            if (newScale === 1) {
                setPosition({ x: 0, y: 0 });
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            e.preventDefault(); // Prevent text selection
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current && scale > 1) {
            const deltaX = e.clientX - lastMousePos.current.x;
            const deltaY = e.clientY - lastMousePos.current.y;

            setPosition({
                x: position.x + deltaX,
                y: position.y + deltaY
            });

            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    // --- Touch Handlers (Mobile) ---
    const lastTouchDistance = useRef<number | null>(null);

    const getTouchDistance = (e: React.TouchEvent) => {
        if (e.touches.length < 2) return 0;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch Start
            lastTouchDistance.current = getTouchDistance(e);
        } else if (e.touches.length === 1 && scale > 1) {
            // Pan Start
            isDragging.current = true;
            lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch Zoom
            const dist = getTouchDistance(e);
            if (lastTouchDistance.current && dist > 0) {
                const delta = dist - lastTouchDistance.current;
                const sensitivity = 0.005;
                const newScale = Math.min(Math.max(1, scale + delta * sensitivity), 4);
                setScale(newScale);
                lastTouchDistance.current = dist;

                if (newScale === 1) setPosition({ x: 0, y: 0 });
            }
        } else if (e.touches.length === 1 && isDragging.current && scale > 1) {
            // Pan
            const touch = e.touches[0];
            const deltaX = touch.clientX - lastMousePos.current.x;
            const deltaY = touch.clientY - lastMousePos.current.y;

            setPosition({
                x: position.x + deltaX,
                y: position.y + deltaY
            });

            lastMousePos.current = { x: touch.clientX, y: touch.clientY };
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        lastTouchDistance.current = null;
    };

    const handleBubbleClick = async (bubbleId: string, text: string, voiceId?: string) => {
        console.log("Bubble clicked:", bubbleId);

        // Stop any current playback
        if (activeBubbleId === bubbleId && isPlaying) {
            AudioEngine.stop();
            setIsPlaying(false);
            setActiveBubbleId(null);
            return;
        }

        setActiveBubbleId(bubbleId);
        setIsPlaying(true);

        // Play Audio via Engine
        await AudioEngine.playDialogue(text, voiceId);

        // Reset state when done
        setIsPlaying(false);
    };



    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Effect to render PDF page when current page changes
    // Automated Voice Pipeline State
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [pageScript, setPageScript] = React.useState<any[]>([]);

    useEffect(() => {
        // Reset script on page change to prevent stale audio
        setPageScript([]);
        setIsProcessing(false);
        AudioEngine.stop();
    }, [currentPageIndex]);

    useEffect(() => {
        if (chapter?.sourceType === 'pdf' && canvasRef.current && currentPage) {
            // Sync voices when chapter loads (fire and forget or await if critical)
            // Using chapter title as a proxy for Manga Title for now
            if (chapter.title) {
                import('../services/VoiceMemory').then(m => m.VoiceMemory.syncVoices(chapter.title));
            }

            const processPage = async () => {
                try {
                    // 1. Render PDF (Always happen so user sees the page)
                    if (chapter.contentUrl) {
                        console.log(`[Reader] Rendering PDF Page ${currentPageIndex + 1} from ${chapter.contentUrl}`);
                        try {
                            await pdfService.loadDocument(chapter.contentUrl);
                            await pdfService.renderPageToCanvas(currentPageIndex + 1, canvasRef.current!);
                            console.log(`[Reader] Render Success`);
                        } catch (renderErr) {
                            console.error(`[Reader] Render Failed:`, renderErr);
                        }
                    } else {
                        console.error("[Reader] No contentUrl for PDF chapter!", chapter);
                    }

                    // 2. Automated Voice Pipeline (Gated by isPlaying)
                    // Only start analysis if user has clicked "Play"
                    if (isPlaying) {
                        // A. If script is missing, fetch it (Lazy Load)
                        if (pageScript.length === 0 && !isProcessing) {
                            setIsProcessing(true);

                            // Small delay to ensure canvas is painted
                            await new Promise(r => setTimeout(r, 100));

                            const dataUrl = canvasRef.current!.toDataURL('image/png');
                            const script = await import('../services/GeminiService').then(m => m.geminiService.analyzePage(dataUrl));

                            setPageScript(script);
                            console.log("Loaded Page Script:", script);
                            setIsProcessing(false);

                            // Play immediately after generating
                            if (script.length > 0) {
                                AudioEngine.playScript(script, (line) => {
                                    console.log("Playing line:", line);
                                });
                            }
                        }
                        // B. If script exists but engine stopped, assume resume/restart
                        // (Simple restart for now, full resume requires engine state tracking)
                        else if (pageScript.length > 0 && !AudioEngine.getIsPlaying()) {
                            AudioEngine.playScript(pageScript, (line) => {
                                console.log("Playing line:", line);
                            });
                        }
                    } else {
                        // If isPlaying is false, stop audio
                        AudioEngine.stop();
                    }

                } catch (e) {
                    console.error("Page Processing Error", e);
                    setIsProcessing(false);
                }
            };
            processPage();
        }
    }, [currentPageIndex, chapter, scale, currentPage, isPlaying]); // Added isPlaying dependency
    // Note: If we want high quality zoom, we should re-render with higher scale prop when zooming, 
    // OR just render at high enough resolution (e.g. 2x) initially and let CSS transform handle it.
    // CSS transform is faster. Let's render at generic high res.

    // --- Helper to render a single page ---
    const renderPage = (page: typeof currentPage, isVertical = false) => {
        if (!page || !chapter) return null;

        return (
            <div
                key={isVertical ? `pdf-page-${page.pageNumber}` : page.id}
                className={styles.pageWrapper}
                style={!isVertical ? {
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
                    transformOrigin: 'center center'
                } : { marginBottom: '20px' }}
            >
                {chapter.sourceType === 'pdf' ? (
                    <canvas
                        ref={!isVertical ? canvasRef : undefined}
                        className={styles.pageImage}
                    />
                ) : (
                    <img
                        src={page.imageUrl}
                        alt={`Page ${page.pageNumber}`}
                        className={styles.pageImage}
                        draggable={false}
                    />
                )}

                {/* Overlays (Text Bubbles) */}
                {chapter.sourceType !== 'pdf' && page.textBubbles?.map((bubble) => {
                    const isActive = activeBubbleId === bubble.id;
                    const emotion = bubble.emotion || 'normal';

                    return (
                        <div
                            key={bubble.id}
                            className={styles.bubbleOverlay}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleBubbleClick(bubble.id, bubble.text, bubble.voiceId);
                            }}
                            data-active={isActive}
                            data-emotion={emotion}
                            style={{
                                top: `${bubble.y}%`,
                                left: `${bubble.x}%`,
                                width: `${bubble.width}%`,
                                height: `${bubble.height}%`
                            }}
                            title={bubble.text}
                        >
                            {isActive && (
                                <div className={styles.waveformWrapper}>
                                    <VoiceWaveform isPlaying={isPlaying} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- Render Vertical Mode ---
    if (!chapter) return <div className={styles.container}>Loading Chapter...</div>;

    if (viewMode === 'vertical') {
        return (
            <div className={styles.verticalContainer}>
                {chapter.pages.map(page => renderPage(page, true))}
                {/* Controls Overlay */}
                <BottomControlBar />
                <VoiceControlPanel />
            </div>
        );
    }

    // --- Render Single Page Mode (Default) ---
    return (
        <div
            className={styles.container}
            data-script-length={pageScript.length} // Debug / Linter fix
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            ref={containerRef}
            style={{ cursor: scale > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'default' }}
        >
            {/* Debug Upload Controls */}


            {currentPage && renderPage(currentPage)}


            {/* Reader Controls */}
            <BottomControlBar />
            <VoiceControlPanel />

            {/* Page Info Overlay */}
            <div style={{ position: 'absolute', bottom: 100, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 12, pointerEvents: 'none' }}>
                Page {currentPageIndex + 1} / {pages.length || '?'}
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div className={styles.spinner} style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>AI Analyzing Scene...</span>
                </div>
            )}
        </div>
    );
};

export default Reader;

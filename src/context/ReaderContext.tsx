import React, { createContext, useContext, useState } from 'react';
import type { Chapter, Manga, Page } from '../types/manga';
import { MOCK_CHAPTER } from '../features/mockManga';
import { pdfService } from '../services/PdfService';
import { useLibrary } from './LibraryContext';

interface ReaderState {
    chapter: Chapter | null;
    pages: Page[];
    currentPageIndex: number;
    scale: number;
    isVoicePanelOpen: boolean;
    isPlaying: boolean;
    activeBubbleId: string | null;
    customImage: string | null;
    position: { x: number; y: number };
    viewMode: 'single' | 'vertical';
    manga: Manga | null;
}

interface ReaderContextType extends ReaderState {
    loadChapter: (chapterId: string) => void;
    nextPage: () => void;
    prevPage: () => void;
    setScale: (scale: number) => void;
    setPosition: (position: { x: number; y: number }) => void;
    setViewMode: (mode: 'single' | 'vertical') => void;
    setVoicePanelOpen: (isOpen: boolean) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setActiveBubbleId: (id: string | null) => void;
    setCustomImage: (url: string | null) => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { getChapterById, updateReadingProgress } = useLibrary();

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [pages, setPages] = useState<Page[]>([]);
    const [manga, setManga] = useState<Manga | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState<'single' | 'vertical'>('single');
    const [activeBubbleId, setActiveBubbleId] = useState<string | null>(null);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const [isVoicePanelOpen, setVoicePanelOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Load Chapter Logic
    const loadChapter = async (chapterId: string) => {
        // 1. Try to find in Library first
        const libraryMatch = getChapterById(chapterId);

        if (libraryMatch) {
            console.log("Loading chapter from library", libraryMatch.chapter.title);
            setChapter(libraryMatch.chapter);
            setManga(libraryMatch.manga);

            // FIX: Use Global Manga Pages if available
            // Flatten all pages from all chapters to create a continuous reading experience
            if (libraryMatch.manga && libraryMatch.manga.chapters && libraryMatch.manga.chapters.length > 0) {
                const allPages = libraryMatch.manga.chapters.flatMap(c => c.pages);
                setPages(allPages);

                // Find global index matching the start of this chapter
                // We use the ID of the first page of the requested chapter
                if (libraryMatch.chapter.pages.length > 0) {
                    const startPageId = libraryMatch.chapter.pages[0].id;
                    const globalIndex = allPages.findIndex(p => p.id === startPageId);
                    setCurrentPageIndex(globalIndex >= 0 ? globalIndex : 0);
                } else {
                    setCurrentPageIndex(0);
                }
            } else {
                // Fallback for single chapter or odd data
                setPages(libraryMatch.chapter.pages);
                setCurrentPageIndex(libraryMatch.chapter.progress || 0);
            }
            return;
        }

        // 2. Fallback to Demo/Mock
        if (chapterId === 'demo') {
            const pdfUrl = '/One-Piece-Volume-1.pdf';
            try {
                // Load PDF to get accurate page count
                const numPages = await pdfService.loadDocument(pdfUrl);

                // Generate placeholder pages
                const generatedPages: Page[] = Array.from({ length: numPages }, (_, i) => ({
                    id: `page-${i + 1}`,
                    chapterId: chapterId,
                    pageNumber: i + 1,
                    imageUrl: '',
                    textBubbles: []
                }));

                const pdfChapter: Chapter = {
                    id: chapterId,
                    mangaId: 'one-piece',
                    title: 'One Piece Vol. 1',
                    sourceType: 'pdf',
                    contentUrl: pdfUrl,
                    pages: generatedPages,
                    number: 1,
                    progress: 0
                };

                setChapter(pdfChapter);
                // Mock Manga Structure
                const mockManga: Manga = {
                    id: 'one-piece',
                    title: 'One Piece',
                    coverImage: '',
                    chapters: [pdfChapter],
                    addedDate: Date.now()
                };
                setManga(mockManga);
                setPages(generatedPages);
                setCurrentPageIndex(0);
            } catch (error) {
                console.error("Failed to load PDF metadata", error);
                setChapter(MOCK_CHAPTER);
                setPages(MOCK_CHAPTER.pages);
            }
        } else {
            // Default mock load for other IDs
            console.log("Loading standard chapter", chapterId);
            setChapter(MOCK_CHAPTER);
            setManga(null);
            setPages(MOCK_CHAPTER.pages);
            setCurrentPageIndex(0);
        }
    };

    // Helper to sync progress - tricky with continuous view
    const syncProgress = (newIndex: number) => {
        if (!pages[newIndex]) return;

        const currentPage = pages[newIndex];
        // If we have access to the chapter ID from the page, update that chapter's progress
        if (currentPage.chapterId && manga) {
            // Check if we need to verify chapter existence in manga
            // Just fire update
            if (manga.id) {
                updateReadingProgress(manga.id, currentPage.chapterId, newIndex);
            }
        }
    };

    const nextPage = () => {
        if (currentPageIndex < pages.length - 1) {
            const nextIndex = currentPageIndex + 1;
            setCurrentPageIndex(nextIndex);
            syncProgress(nextIndex);

            setActiveBubbleId(null);
            setCustomImage(null);
            setScale(1);
            setPosition({ x: 0, y: 0 });

            // Check if we crossed chapter boundary to update URL (optional, silent update)
            const nextPageObj = pages[nextIndex];
            if (nextPageObj && chapter && nextPageObj.chapterId !== chapter.id) {
                // We moved to a new chapter
                const newCh = manga?.chapters.find(c => c.id === nextPageObj.chapterId);
                if (newCh) {
                    setChapter(newCh);
                    console.log(`[Reader] Seamless transition to ${newCh.title}`);
                    if (window.history.pushState) {
                        const newUrl = window.location.href.replace(`/${chapter.id}`, `/${newCh.id}`);
                        window.history.pushState({ path: newUrl }, '', newUrl);
                    }
                }
            }
        }
    };

    const prevPage = () => {
        if (currentPageIndex > 0) {
            const prevIndex = currentPageIndex - 1;
            setCurrentPageIndex(prevIndex);
            syncProgress(prevIndex);

            setActiveBubbleId(null);
            setCustomImage(null);
            setScale(1);
            setPosition({ x: 0, y: 0 });

            // Check if we crossed back to previous chapter
            const prevPageObj = pages[prevIndex];
            if (prevPageObj && chapter && prevPageObj.chapterId !== chapter.id) {
                const newCh = manga?.chapters.find(c => c.id === prevPageObj.chapterId);
                if (newCh) {
                    setChapter(newCh);
                    console.log(`[Reader] Seamless transition back to ${newCh.title}`);
                    if (window.history.pushState) {
                        const newUrl = window.location.href.replace(`/${chapter.id}`, `/${newCh.id}`);
                        window.history.pushState({ path: newUrl }, '', newUrl);
                    }
                }
            }
        }
    };

    return (
        <ReaderContext.Provider
            value={{
                chapter,
                manga,
                pages,
                currentPageIndex,
                scale,
                position,
                viewMode,
                isVoicePanelOpen,
                isPlaying,
                activeBubbleId,
                customImage,
                loadChapter,
                nextPage,
                prevPage,
                setScale,
                setPosition,
                setViewMode,
                setVoicePanelOpen,
                setIsPlaying,
                setActiveBubbleId,
                setCustomImage
            }}
        >
            {children}
        </ReaderContext.Provider>
    );
};

export const useReader = () => {
    const context = useContext(ReaderContext);
    if (context === undefined) {
        throw new Error('useReader must be used within a ReaderProvider');
    }
    return context;
};

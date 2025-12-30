import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Manga, Chapter } from '../types/manga';
import { storageService } from '../services/StorageService';

// Define the Library Content
interface LibraryContextType {
    library: Manga[];
    isLoading: boolean;
    addToLibrary: (manga: Manga, file?: File) => Promise<void>;
    getMangaById: (id: string) => Manga | undefined;
    getChapterById: (chapterId: string) => { manga: Manga, chapter: Chapter } | undefined;
    refreshLibrary: () => Promise<void>;
    updateReadingProgress: (mangaId: string, chapterId: string, pageIndex: number) => void;
    removeFromLibrary: (mangaId: string) => Promise<void>;
    updateMangaMetadata: (mangaId: string, updates: Partial<Manga>) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [library, setLibrary] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const savedLibrary = await storageService.loadLibrary();

                // Hydrate the content URLs for PDFs
                const hydratedLibrary = await Promise.all(savedLibrary.map(async (manga) => {
                    console.log(`[Library] Hydrating manga: ${manga.id}`);
                    const updatedChapters = await Promise.all(manga.chapters.map(async (chapter) => {
                        // FORCE PDF type for imported items to prevent render errors
                        const isImported = manga.id.startsWith('imported-');
                        const isPdf = isImported || chapter.sourceType === 'pdf';

                        if (isPdf) {
                            // Ensure metadata is correct
                            const chWithPdfType = { ...chapter, sourceType: 'pdf' } as Chapter;

                            // Check if we have the file blob
                            const blob = await storageService.getFile(manga.id);
                            if (blob) {
                                console.log(`[Library] Found blob for manga ${manga.id}, size: ${blob.size}`);
                                // Create a fresh ObjectURL for this session
                                const newUrl = URL.createObjectURL(blob);
                                return { ...chWithPdfType, contentUrl: newUrl };
                            } else {
                                console.warn(`[Library] MISSING BLOB for manga ${manga.id}`);
                                return chWithPdfType;
                            }
                        }
                        return chapter;
                    }));
                    return { ...manga, chapters: updatedChapters };
                }));

                console.log("[Library] Final Hydrated Library:", hydratedLibrary);

                // If empty, maybe add mock data? Or keep empty? 
                // Let's keep empty for "User Library" but we could merge with "Discover" mocks later.
                // For now, if empty, we just have empty library.

                // MERGE WITH MOCK DATA FOR DEMO PURPOSES IF EMPTY (Optional)
                if (hydratedLibrary.length === 0) {
                    /* 
                    const { mockManga } = await import('../features/mockManga');
                    setLibrary(mockManga);
                    */
                    setLibrary([]);
                } else {
                    setLibrary(hydratedLibrary);
                }

            } catch (err) {
                console.error("Failed to load library", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Save changes whenever library updates
    // Note: We don't save blobs here, only metadata. Blobs are saved explicitly in addToLibrary.
    useEffect(() => {
        if (!isLoading) {
            // We need to strip the objectURLs before saving metadata, 
            // because objectURLs are session-specific and useless to store stringified.
            // However, strictly speaking, storageService could handle cleaning?
            // Or we just store them and ignore them on load (since we regen them).
            // Storing them is fine, they just won't work after reload until hydrated.
            storageService.saveLibrary(library);
        }
    }, [library, isLoading]);

    const addToLibrary = async (newManga: Manga, file?: File) => {
        // 1. If there's a file, save it to blob storage
        if (file) {
            await storageService.saveFile(newManga.id, file);

            // Generate a session URL immediately for the UI
            const sessionUrl = URL.createObjectURL(file);

            // Update the chapter contentUrl with this session URL
            newManga.chapters = newManga.chapters.map(ch => ({
                ...ch,
                contentUrl: sessionUrl
            }));
        }

        // 2. Update State (Metadata)
        setLibrary(prev => {
            // Check if already exists to avoid duplicates
            if (prev.find(m => m.id === newManga.id)) return prev;
            return [...prev, newManga];
        });
    };

    const getMangaById = (id: string) => {
        return library.find(m => m.id === id);
    };

    const getChapterById = (chapterId: string) => {
        for (const manga of library) {
            if (manga.chapters) {
                const chapter = manga.chapters.find((c: Chapter) => c.id === chapterId);
                if (chapter) {
                    return { manga, chapter };
                }
            }
        }
        return undefined;
    };

    const refreshLibrary = async () => {
        // Re-run load logic if needed
        const saved = await storageService.loadLibrary();
        setLibrary(saved);
    };

    const updateReadingProgress = (mangaId: string, chapterId: string, pageIndex: number) => {
        setLibrary(prev => prev.map(manga => {
            if (manga.id === mangaId) {
                return {
                    ...manga,
                    // Update main manga last read
                    lastRead: Date.now(),
                    chapters: manga.chapters.map(ch => {
                        if (ch.id === chapterId) {
                            return { ...ch, progress: pageIndex };
                        }
                        return ch;
                    })
                };
            }
            return manga;
        }));
    };

    const removeFromLibrary = async (mangaId: string) => {
        // 1. Remove file blob if exists
        await storageService.removeFile(mangaId);

        // 2. Update State
        setLibrary(prev => prev.filter(m => m.id !== mangaId));
    };

    const updateMangaMetadata = (mangaId: string, updates: Partial<Manga>) => {
        setLibrary(prev => prev.map(m => {
            if (m.id === mangaId) {
                return { ...m, ...updates };
            }
            return m;
        }));
    };

    return (
        <LibraryContext.Provider value={{ library, isLoading, addToLibrary, getMangaById, getChapterById, refreshLibrary, updateReadingProgress, removeFromLibrary, updateMangaMetadata }}>
            {children}
        </LibraryContext.Provider>
    );
};

export const useLibrary = () => {
    const context = useContext(LibraryContext);
    if (context === undefined) {
        throw new Error('useLibrary must be used within a LibraryProvider');
    }
    return context;
};

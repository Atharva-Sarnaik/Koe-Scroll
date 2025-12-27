import type { Manga, Chapter, Page } from '../types/manga';

// Mock IDs
const MANGA_ID = 'manga-1';
const CHAPTER_ID = 'chapter-1';

export const MOCK_MANGA: Manga = {
    id: MANGA_ID,
    title: "Solo Leveling (Demo)",
    coverImage: "https://upload.wikimedia.org/wikipedia/en/9/9c/Solo_Leveling_Webtoon_cover.png",
    author: "Chugong",
    description: "A world where hunters awaken with magical powers to battle monsters. Jinwoo, the weakest hunter, finds a way, to level up.",
    chapters: [], // We will populate this later or below to avoid circular dependency
    addedDate: Date.now()
};

// ... (after MOCK_CHAPTER definition) ...

// Circular dependency resolution or just re-assign
// For simplicity in this file, we can just define MOCK_CHAPTER first or assign it here.
// But `Manga` is used above.
// Let's just fix the order or assignment.


const PAGES: Page[] = [
    {
        id: 'page-1',
        chapterId: CHAPTER_ID,
        pageNumber: 1,
        imageUrl: "https://via.placeholder.com/800x1200/121212/333333?text=Page+1", // Placeholder for now
        textBubbles: [
            {
                id: 'b1',
                text: "Arise...",
                characterName: "Sung Jinwoo",
                x: 50,
                y: 40,
                width: 30,
                height: 10,
                order: 1,
                emotion: 'whisper',
                voiceId: '2EiwWnXFnvU5JabPnv8n' // Clyde (Deep/Male)
            },
            {
                id: 'b2',
                text: "What is happening?!",
                characterName: "Soldier",
                x: 20,
                y: 70,
                width: 25,
                height: 10,
                order: 2,
                emotion: 'action',
                voiceId: '29vD33N1CtxCmqQRPOHJ' // Drew (News/Male)
            }
        ]
    },
    {
        id: 'page-2',
        chapterId: CHAPTER_ID,
        pageNumber: 2,
        imageUrl: "https://via.placeholder.com/800x1200/121212/333333?text=Page+2",
        textBubbles: [
            {
                id: 'b3',
                text: "I cannot believe my eyes.",
                characterName: "Commander",
                x: 50,
                y: 20,
                width: 40,
                height: 15,
                order: 1,
                emotion: 'emotional',
                voiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel (Female)
            }
        ]
    }
];

// Export constants for potential external use or testing
// Export constants for potential external use or testing
export const MOCK_LIBRARY_ITEMS = [
    {
        id: '1',
        title: 'Solo Leveling',
        image: 'https://upload.wikimedia.org/wikipedia/en/9/9c/Solo_Leveling_Webtoon_cover.png',
        genre: 'Action',
        stats: {
            pagesProcessed: 142,
            listeningMinutes: 340,
            voiceConsistency: 92, // %
            lastActive: '2h ago',
            voicesAssigned: 12,
            totalCharacters: 13
        }
    },
    {
        id: '2',
        title: 'Demon Slayer',
        image: 'https://upload.wikimedia.org/wikipedia/en/0/09/Demon_Slayer_-_Kimetsu_no_Yaiba%2C_volume_1.jpg',
        genre: 'Adventure',
        stats: {
            pagesProcessed: 56,
            listeningMinutes: 120,
            voiceConsistency: 85,
            lastActive: '1d ago',
            voicesAssigned: 8,
            totalCharacters: 10
        }
    },
    {
        id: '3',
        title: 'Jujutsu Kaisen',
        image: 'https://upload.wikimedia.org/wikipedia/en/4/46/Jujutsu_kaisen_cover_volume_1.jpg',
        genre: 'Supernatural',
        stats: {
            pagesProcessed: 0,
            listeningMinutes: 0,
            voiceConsistency: 0,
            lastActive: 'Never',
            voicesAssigned: 0,
            totalCharacters: 0
        }
    },
    {
        id: '4',
        title: 'Chainsaw Man',
        image: 'https://upload.wikimedia.org/wikipedia/en/6/6b/Chainsaw_Man_vol_1.jpg',
        genre: 'Horror',
        stats: {
            pagesProcessed: 89,
            listeningMinutes: 180,
            voiceConsistency: 78,
            lastActive: '3d ago',
            voicesAssigned: 6,
            totalCharacters: 8
        }
    },
    {
        id: '5',
        title: 'One Piece',
        image: 'https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg',
        genre: 'Adventure',
        stats: {
            pagesProcessed: 1042,
            listeningMinutes: 2400,
            voiceConsistency: 98,
            lastActive: '1w ago',
            voicesAssigned: 45,
            totalCharacters: 50
        }
    },
    {
        id: '6',
        title: 'Spy x Family',
        image: 'https://upload.wikimedia.org/wikipedia/en/f/f3/Spy_x_Family_vol_1.jpg',
        genre: 'Comedy',
        stats: {
            pagesProcessed: 24,
            listeningMinutes: 45,
            voiceConsistency: 100,
            lastActive: '2w ago',
            voicesAssigned: 4,
            totalCharacters: 4
        }
    },
];

export const MOCK_CHAPTER: Chapter = {
    id: CHAPTER_ID,
    mangaId: MANGA_ID,
    title: "I'm the only one who levels up",
    number: 1,
    pages: PAGES,
    progress: 0
};

// Assignment after definition
MOCK_MANGA.chapters = [MOCK_CHAPTER];

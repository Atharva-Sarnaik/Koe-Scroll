import { DISCOVER_ITEMS } from '../features/mockDiscover';

export interface DiscoverItem {
    id: string;
    title: string;
    official_cover_url: string;
    cover_type: string;
    source_verified: boolean;
    genre: string;
    vibe: string;
    dialogueDensity: string;
    voiceSuitability: number;
    description: string;
    tags: string[];
}

const BROWSE_HISTORY_KEY = 'koe_browse_history';
const MAX_HISTORY = 20;

/**
 * RecommendationService - Generates personalized manga recommendations
 * based on user's library and browse history
 */
class RecommendationService {

    /**
     * Get browse history from localStorage
     */
    getBrowseHistory(): string[] {
        try {
            const history = localStorage.getItem(BROWSE_HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    }

    /**
     * Track a manga as browsed/viewed
     */
    trackBrowse(title: string): void {
        const history = this.getBrowseHistory();

        // Remove if already exists (to move to front)
        const filtered = history.filter(t => t.toLowerCase() !== title.toLowerCase());

        // Add to front
        filtered.unshift(title);

        // Keep max history
        const trimmed = filtered.slice(0, MAX_HISTORY);

        localStorage.setItem(BROWSE_HISTORY_KEY, JSON.stringify(trimmed));
    }

    /**
     * Find discover items matching a title (fuzzy match)
     */
    findMatchingDiscoverItem(title: string): DiscoverItem | undefined {
        const normalized = title.toLowerCase().trim();

        return DISCOVER_ITEMS.find(item => {
            const itemTitle = item.title.toLowerCase();
            // Exact match or partial match
            return itemTitle === normalized ||
                itemTitle.includes(normalized) ||
                normalized.includes(itemTitle);
        }) as DiscoverItem | undefined;
    }

    /**
     * Get genres and vibes from user's library titles
     */
    extractUserPreferences(libraryTitles: string[]): { genres: Set<string>; vibes: Set<string>; tags: Set<string> } {
        const genres = new Set<string>();
        const vibes = new Set<string>();
        const tags = new Set<string>();

        for (const title of libraryTitles) {
            const match = this.findMatchingDiscoverItem(title);
            if (match) {
                genres.add(match.genre);
                vibes.add(match.vibe);
                match.tags.forEach(tag => tags.add(tag));
            }
        }

        return { genres, vibes, tags };
    }

    /**
     * Get smart recommendations based on library and browse history
     */
    getRecommendations(libraryTitles: string[], limit: number = 8): DiscoverItem[] {
        // Combine library titles with browse history
        const browseHistory = this.getBrowseHistory();
        const allUserTitles = [...new Set([...libraryTitles, ...browseHistory])];

        // Extract preferences
        const { genres, vibes, tags } = this.extractUserPreferences(allUserTitles);

        console.log('[Recommendations] User preferences:', { genres: [...genres], vibes: [...vibes], tags: [...tags] });

        // Score each discover item
        const scored = (DISCOVER_ITEMS as DiscoverItem[])
            .filter(item => {
                // Exclude items user already has in library or recently browsed
                const alreadyHas = allUserTitles.some(t =>
                    t.toLowerCase() === item.title.toLowerCase()
                );
                return !alreadyHas && item.source_verified;
            })
            .map(item => {
                let score = 0;

                // Genre match: +3 points
                if (genres.has(item.genre)) score += 3;

                // Vibe match: +2 points
                if (vibes.has(item.vibe)) score += 2;

                // Tag matches: +1 point each
                item.tags.forEach(tag => {
                    if (tags.has(tag)) score += 1;
                });

                // Voice suitability bonus
                if (item.voiceSuitability >= 90) score += 1;

                return { item, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        console.log('[Recommendations] Top scored:', scored.map(s => ({ title: s.item.title, score: s.score })));

        return scored.map(s => s.item);
    }

    /**
     * Get trending/popular items (fallback when no preferences)
     */
    getTrending(limit: number = 8): DiscoverItem[] {
        return (DISCOVER_ITEMS as DiscoverItem[])
            .filter(item => item.source_verified)
            .sort((a, b) => b.voiceSuitability - a.voiceSuitability)
            .slice(0, limit);
    }

    /**
     * Clear browse history
     */
    clearHistory(): void {
        localStorage.removeItem(BROWSE_HISTORY_KEY);
    }
}

export const recommendationService = new RecommendationService();

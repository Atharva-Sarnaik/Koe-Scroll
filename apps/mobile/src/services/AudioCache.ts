import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = FileSystem.cacheDirectory + 'audio_cache/';

export const AudioCache = {
    /**
     * Initializes cache directory
     */
    async init() {
        const info = await FileSystem.getInfoAsync(CACHE_DIR);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
        }
    },

    /**
     * Generates a unique key for the audio segment.
     */
    generateKey(text: string, voiceId: string, stability: number, style: number): string {
        const cleanText = text.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return `audio_v1_${voiceId}_${stability}_${style}_${cleanText}.mp3`;
    },

    /**
     * Retrieves cached audio URI if available.
     */
    async getAudio(key: string): Promise<string | null> {
        try {
            await this.init();
            const fileUri = CACHE_DIR + key;
            const info = await FileSystem.getInfoAsync(fileUri);
            if (info.exists) {
                console.log(`[AudioCache] Hit: ${key}`);
                return fileUri;
            }
        } catch (e) {
            console.warn('[AudioCache] Read failed', e);
        }
        return null;
    },

    /**
     * Saves audio data (Base64 string) to cache.
     * Note: expo-file-system writes strings (utf8 or base64).
     */
    async saveAudio(key: string, base64Data: string): Promise<string | null> {
        try {
            await this.init();
            const fileUri = CACHE_DIR + key;
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                encoding: FileSystem.EncodingType.Base64
            });
            // console.log(`[AudioCache] Saved: ${key}`);
            return fileUri;
        } catch (e) {
            console.warn('[AudioCache] Write failed', e);
            return null;
        }
    },

    /**
     * Clears the entire audio cache.
     */
    async clear(): Promise<void> {
        try {
            await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
        } catch (e) {
            console.warn('[AudioCache] Clear failed', e);
        }
    }
};

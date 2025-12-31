import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PDF_DIR = FileSystem.documentDirectory + 'mangas/';
const COVERS_DIR = FileSystem.documentDirectory + 'covers/';
const PROGRESS_KEY_PREFIX = 'pdf_progress_';

export interface LocalManga {
    id: string;
    title: string;
    uri: string;
    fileName: string;
    lastModified: number;
    currentPage: number;
    totalPages: number;
}

export const PdfStorageService = {
    // 1. Ensure directory exists
    async init() {
        const dirInfo = await FileSystem.getInfoAsync(PDF_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(PDF_DIR, { intermediates: true });
        }

        const coverDirInfo = await FileSystem.getInfoAsync(COVERS_DIR);
        if (!coverDirInfo.exists) {
            await FileSystem.makeDirectoryAsync(COVERS_DIR, { intermediates: true });
        }
    },

    // 2. Pick and Import PDF
    async importPdf(): Promise<LocalManga | null> {
        try {
            await this.init();

            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (result.canceled) return null;

            const file = result.assets[0];
            const newUri = PDF_DIR + file.name;

            // Copy to permanent storage
            await FileSystem.copyAsync({
                from: file.uri,
                to: newUri
            });

            return {
                id: Date.now().toString(),
                title: file.name.replace('.pdf', ''),
                uri: newUri,
                fileName: file.name,
                lastModified: Date.now(),
                currentPage: 1,
                totalPages: 0
            };

        } catch (error) {
            console.error('Error importing PDF:', error);
            return null;
        }
    },

    // 3. List Saved PDFs
    async getAllPdfs(): Promise<LocalManga[]> {
        await this.init();
        try {
            console.log('Reading directory:', PDF_DIR);
            const files = await FileSystem.readDirectoryAsync(PDF_DIR);

            const pdfs: LocalManga[] = await Promise.all(
                files.map(async (fileName) => {
                    const uri = PDF_DIR + fileName;
                    const info = await FileSystem.getInfoAsync(uri);

                    const coverUri = COVERS_DIR + fileName.replace('.pdf', '') + '.jpg';
                    const coverInfo = await FileSystem.getInfoAsync(coverUri);

                    // Fetch progress
                    const progressJson = await AsyncStorage.getItem(PROGRESS_KEY_PREFIX + fileName);
                    const progress = progressJson ? JSON.parse(progressJson) : { page: 1, total: 0 };

                    return {
                        id: fileName, // Use filename as ID for now
                        title: fileName.replace('.pdf', ''),
                        uri: uri,
                        cover: coverInfo.exists ? { uri: coverUri } : null,
                        fileName: fileName,
                        size: info.exists ? info.size : 0,
                        addedDate: new Date().toLocaleDateString(),
                        lastModified: info.exists ? (info.modificationTime || 0) : 0,
                        currentPage: progress.page || 1,
                        totalPages: progress.total || 0
                    };
                })
            );

            return pdfs.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error('Error listing PDFs:', error);
            return [];
        }
    },

    // 4. Save Progress
    async saveProgress(fileName: string, page: number, total: number) {
        try {
            const data = JSON.stringify({ page, total });
            await AsyncStorage.setItem(PROGRESS_KEY_PREFIX + fileName, data);

            // Also update the file modification time? 
            // FileSystem doesn't easily allow "touch", but we can rely on save event order.
            // Or we store a separate "lastRead" in AsyncStorage to sort by.
            // For now, sorting by file mod time is okay, scanning files is fast enough.
        } catch (e) {
            console.error('Error saving progress:', e);
        }
    },

    // 5. Delete PDF & Cover
    async deletePdf(fileName: string) {
        try {
            const uri = PDF_DIR + fileName;
            await FileSystem.deleteAsync(uri, { idempotent: true });

            const coverUri = COVERS_DIR + fileName.replace('.pdf', '') + '.jpg';
            await FileSystem.deleteAsync(coverUri, { idempotent: true });

            await AsyncStorage.removeItem(PROGRESS_KEY_PREFIX + fileName);

            return true;
        } catch (error) {
            console.error('Error deleting PDF:', error);
            return false;
        }
    }
};

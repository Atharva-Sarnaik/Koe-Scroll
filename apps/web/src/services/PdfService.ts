import * as pdfjsLib from 'pdfjs-dist';

// Point to the worker file in public folder or CDN
// Use Vite's ?url import to load the worker file from node_modules
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export class PdfService {
    private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

    async loadDocument(url: string): Promise<number> {
        try {
            const loadingTask = pdfjsLib.getDocument(url);
            this.pdfDoc = await loadingTask.promise;
            return this.pdfDoc.numPages;
        } catch (error) {
            console.error('[PdfService] Failed to load PDF', error);
            throw error;
        }
    }

    private activeRenderTasks = new Map<HTMLCanvasElement, any>();

    async renderPageToCanvas(pageNumber: number, canvas: HTMLCanvasElement, scale = 1.5) {
        if (!this.pdfDoc) throw new Error('PDF not loaded');

        // Cancel previous render ON THIS CANVAS if active
        const existingTask = this.activeRenderTasks.get(canvas);
        if (existingTask) {
            try {
                // console.log('[PdfService] Cancelling existing render task for canvas');
                existingTask.cancel();
            } catch (e) { /* ignore */ }
            this.activeRenderTasks.delete(canvas);
        }

        const page = await this.pdfDoc.getPage(pageNumber);

        // Calculate viewport
        const viewport = page.getViewport({ scale });

        // Context
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        // Store render task
        const renderTask = page.render(renderContext as any);
        this.activeRenderTasks.set(canvas, renderTask);

        try {
            await renderTask.promise;
        } catch (error: any) {
            if (error.name === 'RenderingCancelledException') {
                // Ignore cancellation
                return;
            }
            // throw error; // Suppress render errors for now
        } finally {
            // Only remove if it relies on THIS task (race condition check)
            if (this.activeRenderTasks.get(canvas) === renderTask) {
                this.activeRenderTasks.delete(canvas);
            }
        }
    }

    static async extractPages(pdfBuffer: ArrayBuffer): Promise<any[]> {
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;
        const pages = [];

        for (let i = 1; i <= pageCount; i++) {
            pages.push({
                id: `page-${i}`,
                chapterId: 'ch-1',
                pageNumber: i - 1, // 0-indexed for app
                imageUrl: '', // Will be rendered on demand or filled
                contentUrl: '' // Used for blobs
            });
        }

        return pages;
    }

    /**
     * Generates a cover image (Data URL) from the first page of the PDF
     */
    static async generateCover(url: string, scale = 1.0): Promise<string> {
        try {
            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error('Context unavailable');

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            } as any).promise;

            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (error) {
            console.error('[PdfService] Failed to generate cover', error);
            return '';
        }
    }
}

export const pdfService = new PdfService();

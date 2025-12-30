// Demo manga configuration - hosted on GitHub Releases
export const DEMO_MANGA = {
    id: 'demo-one-piece-vol1',
    title: 'One Piece - Volume 1',
    description: 'The epic adventure begins! Follow Monkey D. Luffy as he sets out to become King of the Pirates.',
    coverUrl: '/covers/onepiece.png',
    pdfUrl: '/One-Piece-Volume-1.pdf',
    genre: 'Action / Adventure',
    author: 'Eiichiro Oda',
    pageCount: 200, // Approximate
    isDemo: true
};

// Download and process the demo PDF
export async function downloadDemoPDF(
    onProgress?: (progress: number) => void
): Promise<ArrayBuffer> {
    const response = await fetch(DEMO_MANGA.pdfUrl);

    if (!response.ok) {
        throw new Error(`Failed to download demo PDF: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Failed to get response reader');
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        received += value.length;

        if (onProgress && total > 0) {
            onProgress(Math.round((received / total) * 100));
        }
    }

    // Combine chunks into single ArrayBuffer
    const combined = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
    }

    return combined.buffer;
}

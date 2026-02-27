import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker from local static file via blob URL
// This bypasses any CDN fallback or module resolution issues in pdfjs-dist v5
let _workerInitialized = false;
async function ensureWorker() {
    if (_workerInitialized) return;
    try {
        const res = await fetch('/pdf.worker.min.mjs');
        const blob = await res.blob();
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
    } catch {
        // Fallback: point directly to local static URL
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
    _workerInitialized = true;
}


/**
 * Load a PDF file and render each page to a canvas, returning canvas elements
 * @param {File} file
 * @returns {Promise<HTMLCanvasElement[]>}
 */
export async function renderPDFToCanvases(file) {
    await ensureWorker();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const canvases = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        canvases.push(canvas);
    }

    return canvases;
}

/**
 * Convert canvas elements to Gemini-compatible image parts
 * @param {HTMLCanvasElement[]} canvases
 * @returns {object[]}
 */
export function canvasesToImageParts(canvases) {
    return canvases.map((canvas) => {
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        return { inlineData: { data: base64, mimeType: 'image/jpeg' } };
    });
}

/**
 * Convert an image File to a Gemini-compatible image part
 * @param {File} file
 * @returns {Promise<object>}
 */
export async function imageFileToImagePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({ inlineData: { data: base64, mimeType: file.type } });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Get page thumbnails (smaller canvases) for UI preview
 * @param {File} file
 * @returns {Promise<{dataUrl: string, index: number}[]>}
 */
export async function getPDFThumbnails(file) {
    await ensureWorker();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const thumbnails = [];

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        thumbnails.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.7), index: i });
    }

    return { thumbnails, numPages: pdf.numPages };
}

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// ── PDF worker (reuse the same init pattern as pdfLoader) ──────────────────
let _workerInitialized = false;
async function ensureWorker() {
  if (_workerInitialized) return;
  try {
    const res = await fetch('/pdf.worker.min.mjs');
    const blob = await res.blob();
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
  _workerInitialized = true;
}

/**
 * Extract plain text (or JSON string) from a model file.
 * Supported: .json, .txt, .md, .doc, .docx, .pdf
 * Returns: { success: boolean, text: string, error?: string }
 */
export async function extractModelText(file) {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop();

  try {
    // ── Plain text / JSON / Markdown ───────────────────────────────────────
    if (['json', 'txt', 'md', 'csv'].includes(ext)) {
      const text = await file.text();
      return { success: true, text };
    }

    // ── DOCX / DOC ─────────────────────────────────────────────────────────
    if (['docx', 'doc'].includes(ext)) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { success: true, text: result.value };
    }

    // ── PDF ────────────────────────────────────────────────────────────────
    if (ext === 'pdf') {
      await ensureWorker();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return { success: true, text: fullText.trim() };
    }

    return { success: false, text: '', error: `Unsupported model file format: .${ext}` };
  } catch (err) {
    return { success: false, text: '', error: err.message || 'Failed to read model file.' };
  }
}

export const MODEL_ACCEPTED_TYPES =
  '.json,.txt,.md,.csv,.doc,.docx,.pdf,application/json,text/plain,text/markdown,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf';

export const MODEL_FORMATS = ['JSON', 'TXT', 'DOC', 'DOCX', 'PDF', 'MD', 'CSV'];

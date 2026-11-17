import { createRequire } from 'module';
import { createWorker, type Worker } from 'tesseract.js';
import { MIN_USABLE_TEXT_CHARS } from './constants';

const require = createRequire(import.meta.url);

export type OcrChannel = 'pdf_text' | 'tesseract_ocr' | 'hybrid' | 'unreadable';

export interface PageTextResult {
  pageNumber: number;
  text: string;
  readable: boolean;
}

export interface DocumentTextResult {
  fullText: string;
  pages: PageTextResult[];
  channel: OcrChannel;
  warnings: string[];
}

type PdfParser = {
  getText: () => Promise<{ text?: string; total?: number; pages?: Array<{ text?: string }> }>;
  getScreenshot: (opts?: {
    scale?: number;
    first?: number;
    imageBuffer?: boolean;
    imageDataUrl?: boolean;
  }) => Promise<{ pages?: Array<{ data?: Buffer | Uint8Array; pageNumber?: number }> }>;
  destroy: () => Promise<void>;
};

function isImageMime(mimeType: string): boolean {
  const m = mimeType.toLowerCase();
  return m === 'image/jpeg' || m === 'image/jpg' || m === 'image/png' || m === 'image/webp';
}

function isPdfMime(mimeType: string): boolean {
  return mimeType.toLowerCase() === 'application/pdf';
}

function createPdfParser(buffer: Buffer): PdfParser {
  const mod = require('pdf-parse') as {
    PDFParse: new (opts: { data: Uint8Array }) => PdfParser;
  };
  return new mod.PDFParse({ data: new Uint8Array(buffer) });
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const parser = createPdfParser(buffer);
  try {
    const parsed = await parser.getText();
    const pageCount =
      typeof parsed.total === 'number' && parsed.total > 0
        ? parsed.total
        : Array.isArray(parsed.pages) && parsed.pages.length > 0
          ? parsed.pages.length
          : 1;
    const textFromPages =
      Array.isArray(parsed.pages) && parsed.pages.length > 0
        ? parsed.pages.map((p) => p.text || '').join('\f')
        : parsed.text || '';
    return {
      text: textFromPages.replace(/\r/g, '').trim(),
      pageCount,
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function ocrImageBuffer(buffer: Buffer, worker: Worker): Promise<string> {
  const result = await worker.recognize(buffer);
  return (result.data.text || '').replace(/\r/g, '').trim();
}

async function createOcrWorker(): Promise<Worker> {
  const worker = await createWorker('eng');
  // Favor accuracy for certificates / forms
  await worker.setParameters({
    tessedit_pageseg_mode: '3',
    preserve_interword_spaces: '1',
  } as Record<string, string>);
  return worker;
}

function splitIntoPseudoPages(text: string, pageCount: number): PageTextResult[] {
  if (pageCount <= 1) {
    return [
      {
        pageNumber: 1,
        text,
        readable: text.replace(/\s+/g, '').length >= MIN_USABLE_TEXT_CHARS,
      },
    ];
  }

  const formFeedPages = text.split('\f').map((p) => p.trim()).filter(Boolean);
  if (formFeedPages.length >= 2) {
    return formFeedPages.map((pageText, idx) => ({
      pageNumber: idx + 1,
      text: pageText,
      readable: pageText.replace(/\s+/g, '').length >= 20,
    }));
  }

  const approx = Math.ceil(text.length / pageCount) || 1;
  const pages: PageTextResult[] = [];
  for (let i = 0; i < pageCount; i += 1) {
    const chunk = text.slice(i * approx, (i + 1) * approx).trim();
    pages.push({
      pageNumber: i + 1,
      text: chunk,
      readable: chunk.replace(/\s+/g, '').length >= 20,
    });
  }
  return pages;
}

async function ocrPdfPagesAsImages(
  buffer: Buffer,
  pageCount: number,
  warnings: string[]
): Promise<PageTextResult[]> {
  const maxPages = Math.min(Math.max(pageCount, 1), 5);
  const parser = createPdfParser(buffer);
  const worker = await createOcrWorker();
  try {
    const shot = await parser.getScreenshot({
      scale: 2,
      first: maxPages,
      imageBuffer: true,
      imageDataUrl: false,
    });
    const pages: PageTextResult[] = [];
    const shotPages = Array.isArray(shot.pages) ? shot.pages : [];
    for (let i = 0; i < shotPages.length; i += 1) {
      const page = shotPages[i];
      const raw = page?.data;
      if (!raw) {
        pages.push({ pageNumber: i + 1, text: '', readable: false });
        continue;
      }
      const imgBuf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
      const text = await ocrImageBuffer(imgBuf, worker);
      pages.push({
        pageNumber: typeof page.pageNumber === 'number' ? page.pageNumber : i + 1,
        text,
        readable: text.replace(/\s+/g, '').length >= 20,
      });
    }
    if (pageCount > maxPages) {
      warnings.push(
        `OCR processed the first ${maxPages} PDF pages of ${pageCount}. Upload remaining pages as images if needed.`
      );
    }
    return pages.length > 0
      ? pages
      : [{ pageNumber: 1, text: '', readable: false }];
  } catch (err: unknown) {
    warnings.push(
      err instanceof Error
        ? `Scanned PDF OCR failed: ${err.message}`
        : 'Scanned PDF OCR failed.'
    );
    return [{ pageNumber: 1, text: '', readable: false }];
  } finally {
    await worker.terminate().catch(() => undefined);
    await parser.destroy().catch(() => undefined);
  }
}

export async function extractDocumentText(params: {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<DocumentTextResult> {
  const warnings: string[] = [];
  const mime = params.mimeType.toLowerCase();

  if (isImageMime(mime)) {
    const worker = await createOcrWorker();
    try {
      const text = await ocrImageBuffer(params.fileBuffer, worker);
      const readable = text.replace(/\s+/g, '').length >= MIN_USABLE_TEXT_CHARS;
      if (!readable) {
        warnings.push(
          'Image OCR produced little usable text. Use a clearer, upright photo of the full document.'
        );
      }
      return {
        fullText: text,
        pages: [{ pageNumber: 1, text, readable }],
        channel: readable ? 'tesseract_ocr' : 'unreadable',
        warnings,
      };
    } finally {
      await worker.terminate();
    }
  }

  if (isPdfMime(mime)) {
    try {
      const { text, pageCount } = await extractPdfText(params.fileBuffer);
      const textPages = splitIntoPseudoPages(text, pageCount);
      const usable = text.replace(/\s+/g, '').length >= MIN_USABLE_TEXT_CHARS;

      if (!usable) {
        warnings.push(
          'PDF has little selectable text — running image OCR on rendered pages.'
        );
        const ocrPages = await ocrPdfPagesAsImages(params.fileBuffer, pageCount, warnings);
        const fullText = ocrPages.map((p) => p.text).join('\n\n').trim();
        const readable = fullText.replace(/\s+/g, '').length >= MIN_USABLE_TEXT_CHARS;
        if (!readable) {
          warnings.push(
            'Could not read this scanned PDF clearly. Try uploading JPG/PNG photos of each page.'
          );
        }
        return {
          fullText,
          pages: ocrPages,
          channel: readable ? 'hybrid' : 'unreadable',
          warnings,
        };
      }

      const unread = textPages.filter((p) => !p.readable);
      if (unread.length > 0) {
        warnings.push(
          `Some PDF pages had weak text signal: ${unread.map((p) => p.pageNumber).join(', ')}.`
        );
      }

      return {
        fullText: text,
        pages: textPages,
        channel: 'pdf_text',
        warnings,
      };
    } catch (err: unknown) {
      warnings.push(
        err instanceof Error
          ? `PDF extraction failed: ${err.message}`
          : 'PDF extraction failed.'
      );
      // Last resort: try screenshot OCR
      const ocrPages = await ocrPdfPagesAsImages(params.fileBuffer, 1, warnings);
      const fullText = ocrPages.map((p) => p.text).join('\n\n').trim();
      const readable = fullText.replace(/\s+/g, '').length >= MIN_USABLE_TEXT_CHARS;
      return {
        fullText,
        pages: ocrPages,
        channel: readable ? 'hybrid' : 'unreadable',
        warnings,
      };
    }
  }

  warnings.push(`Unsupported MIME type for TradeSquare OCR: ${params.mimeType}`);
  return {
    fullText: '',
    pages: [{ pageNumber: 1, text: '', readable: false }],
    channel: 'unreadable',
    warnings,
  };
}

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const BASE_UPLOAD_DIR = '/tmp/tradesquare-compliance-files';
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_DOCUMENT_MIMES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
};

function sanitizeBusinessFolder(businessId: string): string {
  return businessId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function ensureBusinessDir(businessId: string): string {
  const safeFolder = sanitizeBusinessFolder(businessId);
  const dir = path.join(BASE_UPLOAD_DIR, safeFolder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export interface StoredFileDescriptor {
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  contentHash: string;
}

export function validateAndSaveBase64Document(params: {
  businessId: string;
  base64Content: string;
  mimeType: string;
  fileName: string;
}): StoredFileDescriptor {
  const normalizedMime = params.mimeType.trim().toLowerCase();
  const ext = ALLOWED_DOCUMENT_MIMES[normalizedMime];
  if (!ext) {
    throw new Error('Unsupported file type. Only PDF, JPG, JPEG, and PNG documents are permitted.');
  }

  const cleanBase64 = params.base64Content.replace(/^data:[^;]+;base64,/, '').trim();
  if (!cleanBase64 || cleanBase64.length < 16) {
    throw new Error('Uploaded file content is empty or unreadable.');
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length === 0) {
    throw new Error('Uploaded file could not be decoded.');
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds the 8 MB maximum size limit.');
  }

  // Basic magic-byte validation for integrity
  if (ext === '.pdf') {
    const header = buffer.subarray(0, 4).toString('utf8');
    if (header !== '%PDF') {
      throw new Error('File extension/type is PDF, but the uploaded file does not appear to be a valid PDF.');
    }
  } else if (ext === '.png') {
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      throw new Error('File type is PNG, but the file header is invalid.');
    }
  } else if (ext === '.jpg') {
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
      throw new Error('File type is JPEG, but the file header is invalid.');
    }
  }

  const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const dir = ensureBusinessDir(params.businessId);
  const storageKey = `${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(dir, storageKey);
  fs.writeFileSync(fullPath, buffer);

  return {
    storageKey,
    mimeType: normalizedMime === 'image/jpg' ? 'image/jpeg' : normalizedMime,
    fileSizeBytes: buffer.length,
    contentHash,
  };
}

export function readStoredDocumentBuffer(businessId: string, storageKey: string): Buffer | null {
  const safeFolder = sanitizeBusinessFolder(businessId);
  const safeFile = path.basename(storageKey);
  const fullPath = path.join(BASE_UPLOAD_DIR, safeFolder, safeFile);
  if (!fullPath.startsWith(path.join(BASE_UPLOAD_DIR, safeFolder))) {
    return null;
  }
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath);
}

export function deleteStoredDocumentFile(businessId: string, storageKey?: string): void {
  if (!storageKey) return;
  const safeFolder = sanitizeBusinessFolder(businessId);
  const safeFile = path.basename(storageKey);
  const fullPath = path.join(BASE_UPLOAD_DIR, safeFolder, safeFile);
  if (fullPath.startsWith(path.join(BASE_UPLOAD_DIR, safeFolder)) && fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch {
      // Ignore cleanup failures
    }
  }
}

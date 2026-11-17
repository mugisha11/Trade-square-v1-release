import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const BASE_DIR = '/tmp/tradesquare-business-media';
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;

export type BusinessMediaKind = 'logo' | 'cover';

const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function sanitizeBusinessFolder(businessId: string): string {
  return businessId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function ensureBusinessDir(businessId: string): string {
  const dir = path.join(BASE_DIR, sanitizeBusinessFolder(businessId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export interface SavedBusinessMedia {
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  publicUrl: string;
}

function validateMagicBytes(ext: string, buffer: Buffer): void {
  if (ext === '.png') {
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      throw new Error('Invalid PNG file.');
    }
  } else if (ext === '.jpg') {
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
      throw new Error('Invalid JPEG file.');
    }
  } else if (ext === '.webp') {
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    if (riff !== 'RIFF' || webp !== 'WEBP') {
      throw new Error('Invalid WebP file.');
    }
  }
}

export function saveBusinessMedia(params: {
  businessId: string;
  kind: BusinessMediaKind;
  base64Content: string;
  mimeType: string;
}): SavedBusinessMedia {
  const normalizedMime = params.mimeType.trim().toLowerCase();
  const ext = ALLOWED_MIMES[normalizedMime];
  if (!ext) {
    throw new Error('Unsupported image type. Use JPG, PNG, or WebP.');
  }

  const cleanBase64 = params.base64Content.replace(/^data:[^;]+;base64,/, '').trim();
  if (!cleanBase64 || cleanBase64.length < 16) {
    throw new Error('Image content is empty or unreadable.');
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length === 0) {
    throw new Error('Image could not be decoded.');
  }

  const maxBytes = params.kind === 'cover' ? MAX_COVER_BYTES : MAX_LOGO_BYTES;
  if (buffer.length > maxBytes) {
    throw new Error(
      params.kind === 'cover'
        ? 'Cover photo must be 5 MB or smaller.'
        : 'Logo must be 2 MB or smaller.'
    );
  }

  validateMagicBytes(ext, buffer);

  const dir = ensureBusinessDir(params.businessId);
  for (const existing of fs.readdirSync(dir)) {
    if (existing.startsWith(`${params.kind}.`)) {
      try {
        fs.unlinkSync(path.join(dir, existing));
      } catch {
        // ignore
      }
    }
  }

  const mimeType = normalizedMime === 'image/jpg' ? 'image/jpeg' : normalizedMime;
  const storageKey = `${params.kind}${ext}`;
  fs.writeFileSync(path.join(dir, storageKey), buffer);

  return {
    storageKey,
    mimeType,
    fileSizeBytes: buffer.length,
    publicUrl: `/api/business/${params.businessId}/media/${params.kind}?v=${crypto.randomBytes(4).toString('hex')}`,
  };
}

export function readBusinessMedia(
  businessId: string,
  kind: BusinessMediaKind
): { buffer: Buffer; mimeType: string } | null {
  const dir = path.join(BASE_DIR, sanitizeBusinessFolder(businessId));
  if (!fs.existsSync(dir)) return null;

  const match = fs.readdirSync(dir).find((f) => f.startsWith(`${kind}.`));
  if (!match) return null;

  const fullPath = path.join(dir, match);
  if (!fullPath.startsWith(dir)) return null;
  if (!fs.existsSync(fullPath)) return null;

  const ext = path.extname(match).toLowerCase();
  const mimeType =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  return { buffer: fs.readFileSync(fullPath), mimeType };
}

export function deleteBusinessMedia(businessId: string, kind: BusinessMediaKind): void {
  const dir = path.join(BASE_DIR, sanitizeBusinessFolder(businessId));
  if (!fs.existsSync(dir)) return;
  for (const existing of fs.readdirSync(dir)) {
    if (existing.startsWith(`${kind}.`)) {
      try {
        fs.unlinkSync(path.join(dir, existing));
      } catch {
        // ignore
      }
    }
  }
}

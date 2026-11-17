export type ParsedDocDate = {
  raw: string;
  /** YYYY-MM-DD in calendar terms (no timezone shift). */
  iso: string;
  year: number;
  month: number;
  day: number;
};

function isValidYmd(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/**
 * Parse document dates without Date.parse() slash ambiguity.
 * Prefers explicit Y/M/D when year is first.
 */
export function parseDocumentDate(rawInput: string): ParsedDocDate | null {
  const raw = rawInput.trim();
  if (!raw) return null;

  // 2026/04/29 or 2026-04-29 (year first — unambiguous)
  let m = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!isValidYmd(year, month, day)) return null;
    return {
      raw,
      iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      year,
      month,
      day,
    };
  }

  // 29 April 2026 / 29 Apr 2026
  m = raw.match(
    /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})$/i
  );
  if (m) {
    const day = Number(m[1]);
    const month = MONTHS[m[2].toLowerCase().slice(0, 3)] || MONTHS[m[2].toLowerCase()];
    const year = Number(m[3]);
    if (!month || !isValidYmd(year, month, day)) return null;
    return {
      raw,
      iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      year,
      month,
      day,
    };
  }

  // April 29, 2026
  m = raw.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})$/i
  );
  if (m) {
    const month = MONTHS[m[1].toLowerCase().slice(0, 3)] || MONTHS[m[1].toLowerCase()];
    const day = Number(m[2]);
    const year = Number(m[3]);
    if (!month || !isValidYmd(year, month, day)) return null;
    return {
      raw,
      iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      year,
      month,
      day,
    };
  }

  // Ambiguous numeric d/m/y or m/d/y — only accept when day > 12 (forces day-first)
  // or when both <= 12, refuse (needs_review) rather than guess.
  m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const year = Number(m[3]);
    if (a > 12 && b >= 1 && b <= 12) {
      // DD/MM/YYYY
      if (!isValidYmd(year, b, a)) return null;
      return {
        raw,
        iso: `${year}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`,
        year,
        month: b,
        day: a,
      };
    }
    if (b > 12 && a >= 1 && a <= 12) {
      // MM/DD/YYYY
      if (!isValidYmd(year, a, b)) return null;
      return {
        raw,
        iso: `${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`,
        year,
        month: a,
        day: b,
      };
    }
    // Ambiguous — do not guess
    return null;
  }

  // 2-digit year — too risky
  return null;
}

function todayUtcYmd(now = new Date()): { year: number; month: number; day: number; iso: string } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  return {
    year,
    month,
    day,
    iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

function toOrdinal(d: ParsedDocDate): number {
  return d.year * 10000 + d.month * 100 + d.day;
}

export type ExpiryAssessment =
  | { status: 'invalid_or_unparsed' }
  | { status: 'not_applicable' }
  | { status: 'ok'; iso: string; raw: string }
  | { status: 'expiring_soon'; iso: string; raw: string; daysRemaining: number }
  | { status: 'expired'; iso: string; raw: string; daysPast: number };

/**
 * Only call this for dates that were explicitly labeled as expiry/validity end.
 */
export function assessExpiryDate(
  raw: string | undefined,
  opts?: { now?: Date; soonDays?: number }
): ExpiryAssessment {
  if (!raw || !raw.trim()) return { status: 'not_applicable' };
  const parsed = parseDocumentDate(raw);
  if (!parsed) return { status: 'invalid_or_unparsed' };

  const today = todayUtcYmd(opts?.now);
  const soonDays = opts?.soonDays ?? 30;
  const todayOrd = today.year * 10000 + today.month * 100 + today.day;
  const expOrd = toOrdinal(parsed);
  const diffDays = Math.round(
    (Date.UTC(parsed.year, parsed.month - 1, parsed.day) -
      Date.UTC(today.year, today.month - 1, today.day)) /
      (1000 * 60 * 60 * 24)
  );

  if (expOrd < todayOrd) {
    return {
      status: 'expired',
      iso: parsed.iso,
      raw: parsed.raw,
      daysPast: Math.abs(diffDays),
    };
  }
  if (diffDays <= soonDays) {
    return {
      status: 'expiring_soon',
      iso: parsed.iso,
      raw: parsed.raw,
      daysRemaining: diffDays,
    };
  }
  return { status: 'ok', iso: parsed.iso, raw: parsed.raw };
}

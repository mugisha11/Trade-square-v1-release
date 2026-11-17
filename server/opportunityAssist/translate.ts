/**
 * TradeSquare localisation helpers for opportunity content.
 * English ↔ Kinyarwanda phrase/lexicon translation for common trade wording.
 * Architecture supports French and Kiswahili dictionaries without changing callers.
 */

export type AssistLanguage = 'English' | 'Kinyarwanda' | 'French' | 'Kiswahili';

type Dict = Array<{ from: RegExp; to: string }>;

const EN_TO_RW: Dict = [
  { from: /\bRequest for\b/gi, to: 'Icyifuzo cyo guhabwa' },
  { from: /\bSupply of\b/gi, to: 'Gutanga' },
  { from: /\bService request\b/gi, to: 'Icyifuzo cy’ubukorera' },
  { from: /\bProcurement\b/gi, to: 'Gutunga ibikoresho' },
  { from: /\bPartnership\b/gi, to: 'Ubufatanye' },
  { from: /\bDistribution\b/gi, to: 'Kwagura / kugabura' },
  { from: /\bdelivery\b/gi, to: 'gutanga' },
  { from: /\bdeadline\b/gi, to: 'umunsi wa nyuma' },
  { from: /\bquantity\b/gi, to: 'ingano' },
  { from: /\bbudget\b/gi, to: 'ingengo y’imari' },
  { from: /\bprice\b/gi, to: 'igiciro' },
  { from: /\bpayment terms\b/gi, to: 'amasezerano y’ubwishyu' },
  { from: /\blooking for\b/gi, to: 'ndashaka' },
  { from: /\bwe need\b/gi, to: 'dukeneye' },
  { from: /\bwe offer\b/gi, to: 'dutanga' },
  { from: /\bas soon as possible\b/gi, to: 'vuba bishoboka' },
  { from: /\bwithin\b/gi, to: 'mu' },
  { from: /\bdays\b/gi, to: 'iminsi' },
  { from: /\bweeks\b/gi, to: 'ibyumweru' },
  { from: /\bmonths\b/gi, to: 'amezi' },
  { from: /\bRwanda\b/g, to: 'u Rwanda' },
  { from: /\bKigali\b/g, to: 'Kigali' },
  { from: /\bEast Africa\b/gi, to: 'Afurika y’Iburasirazuba' },
  { from: /\bsuppliers?\b/gi, to: 'abatanga ibicuruzwa' },
  { from: /\bbuyers?\b/gi, to: 'abaguzi' },
];

const RW_TO_EN: Dict = [
  { from: /\bdukeneye\b/gi, to: 'we need' },
  { from: /\bndashaka\b/gi, to: 'looking for' },
  { from: /\bdutanga\b/gi, to: 'we offer' },
  { from: /\bigiciro\b/gi, to: 'price' },
  { from: /\bingano\b/gi, to: 'quantity' },
  { from: /\bumunsi wa nyuma\b/gi, to: 'deadline' },
  { from: /\bvuba bishoboka\b/gi, to: 'as soon as possible' },
  { from: /\bu Rwanda\b/gi, to: 'Rwanda' },
  { from: /\bAfurika y[’']Iburasirazuba\b/gi, to: 'East Africa' },
  { from: /\babaguzi\b/gi, to: 'buyers' },
  { from: /\babatanga ibicuruzwa\b/gi, to: 'suppliers' },
];

/** Placeholders for future expansion — same applyDictionary pipeline. */
const EN_TO_FR: Dict = [
  { from: /\bRequest for\b/gi, to: 'Demande de' },
  { from: /\bSupply of\b/gi, to: 'Fourniture de' },
  { from: /\blooking for\b/gi, to: 'à la recherche de' },
  { from: /\bwe need\b/gi, to: 'nous avons besoin de' },
  { from: /\bwe offer\b/gi, to: 'nous proposons' },
  { from: /\bdeadline\b/gi, to: 'date limite' },
  { from: /\bdelivery\b/gi, to: 'livraison' },
];

const EN_TO_SW: Dict = [
  { from: /\bRequest for\b/gi, to: 'Ombi la' },
  { from: /\bSupply of\b/gi, to: 'Ugavi wa' },
  { from: /\blooking for\b/gi, to: 'inattafuta' },
  { from: /\bwe need\b/gi, to: 'tunahitaji' },
  { from: /\bwe offer\b/gi, to: 'tunatoa' },
  { from: /\bdeadline\b/gi, to: 'muda wa mwisho' },
  { from: /\bdelivery\b/gi, to: 'utoaji' },
];

function applyDictionary(text: string, dict: Dict): string {
  let out = text;
  for (const rule of dict) {
    out = out.replace(rule.from, rule.to);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function detectLikelySource(text: string): AssistLanguage {
  if (/[àâäéèêëïîôùûüç]/i.test(text) || /\b(nous|demande|livraison)\b/i.test(text)) {
    return 'French';
  }
  if (/\b(tunahitaji|tunatoa|muda wa mwisho|ugavi)\b/i.test(text)) return 'Kiswahili';
  if (
    /\b(dukeneye|ndashaka|dutanga|igiciro|ingano|u Rwanda|iminsi|amezi)\b/i.test(text)
  ) {
    return 'Kinyarwanda';
  }
  return 'English';
}

function dictionaryFor(from: AssistLanguage, to: AssistLanguage): Dict | null {
  if (from === 'English' && to === 'Kinyarwanda') return EN_TO_RW;
  if (from === 'Kinyarwanda' && to === 'English') return RW_TO_EN;
  if (from === 'English' && to === 'French') return EN_TO_FR;
  if (from === 'English' && to === 'Kiswahili') return EN_TO_SW;
  // Via English when needed
  if (from === 'Kinyarwanda' && to === 'French') return null;
  return null;
}

export function translateOpportunityText(params: {
  title?: string;
  description?: string;
  targetLanguage: string;
}): {
  translatedTitle: string;
  translatedDescription: string;
  qualityNotes: string[];
} {
  const target = (params.targetLanguage || 'English') as AssistLanguage;
  const title = (params.title || '').trim();
  const description = (params.description || '').trim();
  const source = detectLikelySource(`${title} ${description}`);
  const notes: string[] = [];

  if (source === target) {
    notes.push(`Content already appears to be in ${target}. No changes applied.`);
    return { translatedTitle: title, translatedDescription: description, qualityNotes: notes };
  }

  const dict = dictionaryFor(source, target);
  if (!dict) {
    // Two-step via English when possible
    if (source === 'Kinyarwanda' && target !== 'English') {
      const viaEnTitle = applyDictionary(title, RW_TO_EN);
      const viaEnDesc = applyDictionary(description, RW_TO_EN);
      const second = dictionaryFor('English', target);
      if (second) {
        notes.push(`Translated Kinyarwanda → English → ${target} using TradeSquare trade lexicon.`);
        return {
          translatedTitle: applyDictionary(viaEnTitle, second),
          translatedDescription: applyDictionary(viaEnDesc, second),
          qualityNotes: notes,
        };
      }
    }
    notes.push(
      `Direct ${source} → ${target} lexicon is not fully available yet. Showing source text; expand dictionaries to improve coverage.`,
    );
    return { translatedTitle: title, translatedDescription: description, qualityNotes: notes };
  }

  notes.push(
    `TradeSquare lexicon translation (${source} → ${target}). Review commercial meaning before accepting — this is not a full neural MT engine.`,
  );

  return {
    translatedTitle: title ? applyDictionary(title, dict) : '',
    translatedDescription: description ? applyDictionary(description, dict) : '',
    qualityNotes: notes,
  };
}

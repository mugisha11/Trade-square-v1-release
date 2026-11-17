import {
  CATEGORY_RULES,
  CERT_RULES,
  CURRENCY_ALIASES,
  LOCATION_KEYWORDS,
  UNIT_ALIASES,
} from './constants';

export interface OpportunityDraftInput {
  type?: string;
  productOrService?: string;
  description?: string;
  industry?: string;
  quantity?: string;
  unit?: string;
  quantityAndSpecs?: string;
  destinationMarket?: string;
  originLocation?: string;
  deliveryTimeline?: string;
  deadline?: string;
  technicalSpecs?: string;
  qualityRequirements?: string;
  requiredCertifications?: string;
  budgetOrPrice?: string;
  currency?: string;
  paymentTerms?: string;
  capacity?: string;
  moq?: string;
}

export interface ExtractedSuggestion {
  productOrService?: string;
  description?: string;
  industry?: string;
  suggestedCategory?: string;
  quantityAndSpecs?: string;
  quantity?: string;
  unit?: string;
  destinationMarket?: string;
  originLocation?: string;
  deliveryTimeline?: string;
  deadline?: string;
  technicalSpecs?: string;
  qualityRequirements?: string;
  requiredCertifications?: string;
  budgetOrPrice?: string;
  currency?: string;
  paymentTerms?: string;
  capacity?: string;
  moq?: string;
}

function cleanSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function titleCasePhrase(text: string): string {
  const cleaned = cleanSpace(text);
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function extractQuantityAndUnit(text: string): { quantity?: string; unit?: string } {
  const patterns = [
    /(\d[\d,]*(?:\.\d+)?)\s*(metric\s*tons?|tonnes?|mts?|kilograms?|kgs?|litres?|liters?|pieces?|pcs?|units?|cartons?|bags|sacks|containers?|teus?|pallets?|hours?|hrs?|days?|months?)\b/i,
    /\b(about|approx\.?|approximately|around)?\s*(\d[\d,]*(?:\.\d+)?)\s*(mt|t|kg|l|pcs?)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const qty = (match[2] && /^\d/.test(match[2]) ? match[2] : match[1])?.replace(/,/g, '');
    const unitRaw = match[3] || match[2];
    if (!qty || !unitRaw || !/^\d/.test(qty)) continue;
    let unit = unitRaw;
    for (const alias of UNIT_ALIASES) {
      if (alias.pattern.test(unitRaw)) {
        unit = alias.unit;
        break;
      }
    }
    return { quantity: qty, unit };
  }
  return {};
}

export function extractBudget(text: string): { budgetOrPrice?: string; currency?: string } {
  const money =
    text.match(
      /\b(?:budget|price|cost|value|offer(?:ed)?\s*at|up\s*to|around|approx(?:imately)?)\s*(?:of\s*)?(USD|RWF|EUR|KES|UGX|TZS|\$|US\$)\s*([\d,]+(?:\.\d+)?)\b/i,
    ) ||
    text.match(/\b(USD|RWF|EUR|KES|UGX|TZS)\s*([\d,]+(?:\.\d+)?)\b/i) ||
    text.match(/\$\s*([\d,]+(?:\.\d+)?)\b/);

  if (!money) {
    for (const alias of CURRENCY_ALIASES) {
      if (alias.pattern.test(text)) return { currency: alias.currency };
    }
    return {};
  }

  const amount = (money[2] || money[1] || '').replace(/,/g, '');
  if (!amount || !/^\d/.test(amount)) return {};
  // Ignore tiny numbers that are likely quantities mistaken as money without currency context
  if (!money[0].match(/USD|RWF|EUR|KES|UGX|TZS|\$/i) && Number(amount) < 100) {
    return {};
  }

  let currency: string | undefined;
  const currencyHint = money[0];
  for (const alias of CURRENCY_ALIASES) {
    if (alias.pattern.test(currencyHint) || alias.pattern.test(text)) {
      currency = alias.currency;
      break;
    }
  }
  return { budgetOrPrice: amount, currency };
}

export function extractLocations(text: string): {
  originLocation?: string;
  destinationMarket?: string;
} {
  const deliveryMatch =
    text.match(/\bfor\s+([A-Za-z][A-Za-z-]{2,30})\s+deliver(?:y|ed|ies)?\b/i) ||
    text.match(/\bdeliver(?:y|ed|ies)?\s+(?:to\s+)?([A-Za-z][A-Za-z-]{2,30})\b/i) ||
    text.match(/\b(?:ship(?:ping)?|destination)\s+(?:to\s+)?([A-Za-z][A-Za-z-]{2,30})\b/i);
  const originMatch = text.match(
    /\b(?:from|origin(?:ating)?\s*(?:in|from)?|based\s+in|located\s+in)\s+([A-Za-z][A-Za-z-]{2,30})\b/i,
  );

  const foundLabels = LOCATION_KEYWORDS.filter((l) => l.pattern.test(text)).map((l) => l.label);
  let destinationMarket: string | undefined;
  let originLocation: string | undefined;

  if (deliveryMatch?.[1]) {
    const candidate = cleanSpace(deliveryMatch[1]);
    if (candidate && !/^(the|our|a|an|within|by|to)\b/i.test(candidate)) {
      const known = LOCATION_KEYWORDS.find((l) => l.pattern.test(candidate));
      destinationMarket = known?.label ?? titleCasePhrase(candidate);
    }
  }
  if (originMatch?.[1]) {
    const candidate = cleanSpace(originMatch[1]);
    const known = LOCATION_KEYWORDS.find((l) => l.pattern.test(candidate));
    originLocation = known?.label ?? titleCasePhrase(candidate);
  }

  if (!destinationMarket && foundLabels.length) {
    // Prefer destination when delivery language is present
    if (/\b(deliver|ship|destination|for\s+\w+\s+deliver)/i.test(text)) {
      destinationMarket = foundLabels.join(', ');
    } else if (foundLabels.length > 1) {
      destinationMarket = foundLabels.join(', ');
    }
  }
  if (!originLocation && foundLabels.length === 1 && !destinationMarket) {
    if (!/\b(deliver|ship|destination)\b/i.test(text)) {
      originLocation = foundLabels[0];
    }
  }

  return { originLocation, destinationMarket };
}

export function extractTimeline(text: string): {
  deliveryTimeline?: string;
  deadline?: string;
} {
  const within = text.match(
    /\b(?:within|in|over)\s+(\d+)\s*(days?|weeks?|months?)\b/i,
  );
  const byDate = text.match(
    /\b(?:by|before|deadline|closing|until)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s*\d{4})?)/i,
  );
  const asap = /\b(asap|as soon as possible|immediately|urgent)\b/i.test(text);

  const result: { deliveryTimeline?: string; deadline?: string } = {};
  if (within) {
    result.deliveryTimeline = `Within ${within[1]} ${within[2].toLowerCase()}`;
  } else if (asap) {
    result.deliveryTimeline = 'As soon as possible';
  }
  if (byDate?.[1]) {
    result.deadline = byDate[1];
  }
  return result;
}

export function extractPaymentTerms(text: string): string | undefined {
  const patterns = [
    /\b(LC\s*at\s*sight|letter\s*of\s*credit|L\/C)\b/i,
    /\b(\d{1,2}%\s*advance[^.,;]{0,40})/i,
    /\b(net\s*\d{1,2}|CAD|cash\s*against\s*documents|TT\s*in\s*advance|telegraphic\s*transfer)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanSpace(match[1]);
  }
  return undefined;
}

export function extractMoqOrCapacity(text: string): { moq?: string; capacity?: string } {
  const moq = text.match(/\b(?:MOQ|minimum\s*order(?:\s*quantity)?)\s*(?:of|:)?\s*([^\n.,;]{2,40})/i);
  const capacity = text.match(
    /\b(?:capacity|can\s*supply|able\s*to\s*supply|production)\s*(?:of|:)?\s*([^\n.,;]{2,50})/i,
  );
  return {
    moq: moq?.[1] ? cleanSpace(moq[1]) : undefined,
    capacity: capacity?.[1] ? cleanSpace(capacity[1]) : undefined,
  };
}

export function suggestCategory(text: string): string | undefined {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return undefined;
}

export function suggestCertifications(text: string): { value?: string; notes: string[] } {
  const hits: string[] = [];
  const notes: string[] = [];
  for (const rule of CERT_RULES) {
    if (rule.pattern.test(text)) {
      hits.push(rule.suggestion);
      notes.push(rule.reason);
    }
  }
  if (!hits.length) return { notes: [] };
  return {
    value: hits.slice(0, 3).join('; '),
    notes: notes.slice(0, 3),
  };
}

export function extractTechnicalHints(text: string): {
  technicalSpecs?: string;
  qualityRequirements?: string;
} {
  const techBits: string[] = [];
  const qualityBits: string[] = [];

  const grade = text.match(/\b(grade\s*[A-Z0-9-]+|food[- ]grade|industrial[- ]grade|export[- ]grade)\b/i);
  if (grade?.[1]) techBits.push(grade[1]);

  const dims = text.match(/\b(\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|")(?:\s*[x×]\s*\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|")?){0,2})\b/i);
  if (dims?.[1]) techBits.push(dims[1]);

  const standards = text.match(/\b(ISO\s*\d+[\w:-]*|HACCP|S[- ]Mark|CE\s*mark|ASTM\s*[\w.-]+)\b/gi);
  if (standards?.length) qualityBits.push(...standards.slice(0, 4));

  const moisture = text.match(/\bmoisture\s*(?:content)?\s*(?:of|:)?\s*[\d.]+%?/i);
  if (moisture?.[0]) techBits.push(cleanSpace(moisture[0]));

  return {
    technicalSpecs: techBits.length ? techBits.join('; ') : undefined,
    qualityRequirements: qualityBits.length ? qualityBits.join('; ') : undefined,
  };
}

function inferTitle(text: string, type?: string): string | undefined {
  const needOffer =
    text.match(
      /\b(?:looking\s+for|need(?:ed)?|require(?:d|ments?)?|seeking|want(?:ed)?|sourcing|buy(?:ing)?|purchase)\s+(.{8,80}?)(?:\.|,| for | to | within | by | from |$)/i,
    ) ||
    text.match(
      /\b(?:offer(?:ing)?|supply(?:ing)?|sell(?:ing)?|available|provide|export(?:ing)?)\s+(.{8,80}?)(?:\.|,| for | to | within | by | from |$)/i,
    );

  if (needOffer?.[1]) {
    const phrase = cleanSpace(needOffer[1]);
    if (phrase.length >= 6) {
      const prefix =
        type === 'Supplier Offer' || type === 'Export Opportunity'
          ? 'Supply of'
          : type === 'Service Request'
            ? 'Service request:'
            : type === 'Partnership'
              ? 'Partnership:'
              : type === 'Distribution'
                ? 'Distribution:'
                : 'Request for';
      return `${prefix} ${titleCasePhrase(phrase)}`.slice(0, 120);
    }
  }

  const firstSentence = cleanSpace(text.split(/[.!?]/)[0] || '');
  if (firstSentence.length >= 12 && firstSentence.length <= 100) {
    return titleCasePhrase(firstSentence);
  }
  return undefined;
}

function polishDescription(text: string): string {
  let d = cleanSpace(text);
  if (!d) return d;
  if (!/[.!?]$/.test(d)) d += '.';
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/**
 * Extract only values evidenced in the text. Never invent quantities, prices, or deadlines.
 */
export function extractFromNaturalLanguage(
  naturalLanguage: string,
  current: OpportunityDraftInput = {},
): {
  suggestion: ExtractedSuggestion;
  clarificationQuestions: string[];
  missingInformation: string[];
  qualityNotes: string[];
} {
  const text = cleanSpace(naturalLanguage);
  const suggestion: ExtractedSuggestion = {};
  const qualityNotes: string[] = [];
  const missingInformation: string[] = [];
  const clarificationQuestions: string[] = [];

  const qty = extractQuantityAndUnit(text);
  const budget = extractBudget(text);
  const locations = extractLocations(text);
  const timeline = extractTimeline(text);
  const payment = extractPaymentTerms(text);
  const moqCap = extractMoqOrCapacity(text);
  const tech = extractTechnicalHints(text);
  const category = suggestCategory(text);
  const certs = suggestCertifications(text);
  const title = inferTitle(text, current.type);

  if (title && !current.productOrService?.trim()) suggestion.productOrService = title;
  suggestion.description = polishDescription(text);

  if (category) {
    suggestion.suggestedCategory = category;
    if (!current.industry?.trim()) suggestion.industry = category;
  }

  if (qty.quantity) suggestion.quantity = qty.quantity;
  if (qty.unit) suggestion.unit = qty.unit;
  if (qty.quantity || qty.unit) {
    suggestion.quantityAndSpecs = [qty.quantity, qty.unit].filter(Boolean).join(' ');
  }

  if (budget.budgetOrPrice) suggestion.budgetOrPrice = budget.budgetOrPrice;
  if (budget.currency) suggestion.currency = budget.currency;
  if (locations.destinationMarket) suggestion.destinationMarket = locations.destinationMarket;
  if (locations.originLocation) suggestion.originLocation = locations.originLocation;
  if (timeline.deliveryTimeline) suggestion.deliveryTimeline = timeline.deliveryTimeline;
  if (timeline.deadline) suggestion.deadline = timeline.deadline;
  if (payment) suggestion.paymentTerms = payment;
  if (moqCap.moq) suggestion.moq = moqCap.moq;
  if (moqCap.capacity) suggestion.capacity = moqCap.capacity;
  if (tech.technicalSpecs) suggestion.technicalSpecs = tech.technicalSpecs;
  if (tech.qualityRequirements) suggestion.qualityRequirements = tech.qualityRequirements;
  if (certs.value) {
    suggestion.requiredCertifications = certs.value;
    qualityNotes.push(...certs.notes);
  }

  const merged = { ...current, ...suggestion };
  if (!merged.quantity && !merged.quantityAndSpecs) {
    missingInformation.push('Quantity and unit of measurement');
    clarificationQuestions.push('What quantity do you need or can you supply, and in which unit?');
  }
  if (!merged.destinationMarket && !merged.originLocation) {
    missingInformation.push('Location or target market');
    clarificationQuestions.push('Where should delivery happen, or which markets are you targeting?');
  }
  if (!merged.deliveryTimeline && !merged.deadline) {
    missingInformation.push('Timeline or closing deadline');
    clarificationQuestions.push('What is the delivery timeline or response deadline?');
  }
  if (!merged.industry && !category) {
    missingInformation.push('Product / service category');
    clarificationQuestions.push('Which product or service category best fits this opportunity?');
  }
  if (!merged.technicalSpecs && !merged.qualityRequirements) {
    clarificationQuestions.push(
      'Are there technical grades, dimensions, or quality standards counterparties must meet?',
    );
  }

  qualityNotes.push(
    'TradeSquare Opportunity Intelligence extracted only details found in your text. Accept or edit each suggestion before publishing.',
  );

  return { suggestion, clarificationQuestions, missingInformation, qualityNotes };
}

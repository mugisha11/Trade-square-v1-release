import type { ExtractedSuggestion, OpportunityDraftInput } from './extract';
import { extractFromNaturalLanguage, suggestCategory } from './extract';

function cleanSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function improveTitle(title: string, type?: string): string {
  let t = cleanSpace(title);
  if (!t) return t;
  t = t.replace(/^(untitled draft|new opportunity|opportunity)\s*:?\s*/i, '');
  if (t.length < 4) return title;

  const alreadyPrefixed =
    /^(request for|supply of|service request|partnership|distribution|tender|export)\b/i.test(t);
  if (!alreadyPrefixed) {
    if (type === 'Supplier Offer' || type === 'Export Opportunity') {
      if (!/^supply\b/i.test(t)) t = `Supply of ${t}`;
    } else if (type === 'Service Request') {
      if (!/^service\b/i.test(t)) t = `Service request: ${t}`;
    } else if (type === 'Procurement') {
      if (!/^tender|procurement|rfq\b/i.test(t)) t = `Procurement: ${t}`;
    } else if (!/^(looking|need|request|seeking|buy)/i.test(t)) {
      t = `Request for ${t}`;
    }
  }

  return t.charAt(0).toUpperCase() + t.slice(1);
}

function improveDescription(description: string): string {
  let d = cleanSpace(description);
  if (!d) return d;

  // Light professional polish only — do not add commercial facts.
  d = d
    .replace(/\bi wanna\b/gi, 'I want to')
    .replace(/\bgonna\b/gi, 'going to')
    .replace(/\basap\b/gi, 'as soon as possible')
    .replace(/\bpls\b/gi, 'please')
    .replace(/\bplz\b/gi, 'please')
    .replace(/\bu\b/gi, 'you')
    .replace(/\s+/g, ' ')
    .trim();

  if (!/[.!?]$/.test(d)) d += '.';
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export function improveOpportunity(
  current: OpportunityDraftInput,
  naturalLanguage?: string,
): {
  suggestion: ExtractedSuggestion;
  clarificationQuestions: string[];
  missingInformation: string[];
  qualityNotes: string[];
} {
  const suggestion: ExtractedSuggestion = {};
  const sourceText = cleanSpace(naturalLanguage || '') || cleanSpace(current.description || '');

  if (current.productOrService?.trim()) {
    suggestion.productOrService = improveTitle(current.productOrService, current.type);
  } else if (sourceText) {
    const extracted = extractFromNaturalLanguage(sourceText, current);
    if (extracted.suggestion.productOrService) {
      suggestion.productOrService = extracted.suggestion.productOrService;
    }
  }

  if (current.description?.trim()) {
    suggestion.description = improveDescription(current.description);
  } else if (sourceText) {
    suggestion.description = improveDescription(sourceText);
  }

  const categorySource = `${current.productOrService || ''} ${current.description || ''} ${sourceText}`;
  const category = suggestCategory(categorySource);
  if (category && !current.industry?.trim()) {
    suggestion.industry = category;
    suggestion.suggestedCategory = category;
  } else if (category) {
    suggestion.suggestedCategory = category;
  }

  return {
    suggestion,
    clarificationQuestions: [],
    missingInformation: [],
    qualityNotes: [
      'Wording was clarified without adding quantities, prices, certifications, or deadlines that were not already present.',
    ],
  };
}

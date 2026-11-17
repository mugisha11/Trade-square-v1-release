import { TS_OPP_MODEL_ID, TS_OPP_MODEL_LABEL } from './constants';
import {
  extractFromNaturalLanguage,
  type ExtractedSuggestion,
  type OpportunityDraftInput,
} from './extract';
import { improveOpportunity } from './improve';
import { reviewOpportunityQuality, type QualityReviewResult } from './quality';
import { translateOpportunityText } from './translate';

export type OpportunityAssistMode = 'extract' | 'improve' | 'quality' | 'translate';

export interface OpportunityAssistRequest {
  mode: OpportunityAssistMode | string;
  naturalLanguage?: string;
  opportunity?: OpportunityDraftInput;
  targetLanguage?: string;
}

export interface OpportunityAssistResponse {
  modelId: string;
  modelLabel: string;
  mode: string;
  suggestion: ExtractedSuggestion;
  clarificationQuestions: string[];
  missingInformation: string[];
  qualityNotes: string[];
  qualityReview: QualityReviewResult | null;
  translatedTitle: string;
  translatedDescription: string;
}

/**
 * TradeSquare Opportunity Intelligence v1
 * Local structured extraction, quality review and lexicon translation.
 * Does not call Gemini or any external LLM.
 */
export function runTradeSquareOpportunityAssist(
  input: OpportunityAssistRequest,
): OpportunityAssistResponse {
  const mode = (input.mode || 'extract').toLowerCase();
  const opportunity = input.opportunity ?? {};
  const naturalLanguage = (input.naturalLanguage || '').trim();

  if (mode === 'quality') {
    const result = reviewOpportunityQuality(opportunity);
    return {
      modelId: TS_OPP_MODEL_ID,
      modelLabel: TS_OPP_MODEL_LABEL,
      mode: 'quality',
      suggestion: result.suggestion,
      clarificationQuestions: result.clarificationQuestions,
      missingInformation: result.missingInformation,
      qualityNotes: result.qualityNotes,
      qualityReview: result.qualityReview,
      translatedTitle: '',
      translatedDescription: '',
    };
  }

  if (mode === 'improve') {
    const result = improveOpportunity(opportunity, naturalLanguage);
    return {
      modelId: TS_OPP_MODEL_ID,
      modelLabel: TS_OPP_MODEL_LABEL,
      mode: 'improve',
      suggestion: result.suggestion,
      clarificationQuestions: result.clarificationQuestions,
      missingInformation: result.missingInformation,
      qualityNotes: result.qualityNotes,
      qualityReview: null,
      translatedTitle: '',
      translatedDescription: '',
    };
  }

  if (mode === 'translate') {
    const translated = translateOpportunityText({
      title: opportunity.productOrService,
      description: opportunity.description || naturalLanguage,
      targetLanguage: input.targetLanguage || 'English',
    });
    return {
      modelId: TS_OPP_MODEL_ID,
      modelLabel: TS_OPP_MODEL_LABEL,
      mode: 'translate',
      suggestion: {},
      clarificationQuestions: [],
      missingInformation: [],
      qualityNotes: translated.qualityNotes,
      qualityReview: null,
      translatedTitle: translated.translatedTitle,
      translatedDescription: translated.translatedDescription,
    };
  }

  // Default: extract
  const source =
    naturalLanguage ||
    [opportunity.productOrService, opportunity.description].filter(Boolean).join('. ');
  const result = extractFromNaturalLanguage(source, opportunity);
  return {
    modelId: TS_OPP_MODEL_ID,
    modelLabel: TS_OPP_MODEL_LABEL,
    mode: 'extract',
    suggestion: result.suggestion,
    clarificationQuestions: result.clarificationQuestions,
    missingInformation: result.missingInformation,
    qualityNotes: result.qualityNotes,
    qualityReview: null,
    translatedTitle: '',
    translatedDescription: '',
  };
}

export { TS_OPP_MODEL_ID, TS_OPP_MODEL_LABEL };

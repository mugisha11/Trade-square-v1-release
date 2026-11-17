import type { OpportunityDraftInput } from './extract';
import { suggestCertifications } from './extract';

export interface QualityReviewResult {
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: Array<{ title: string; reason: string }>;
  readyToPublish: boolean;
}

function filled(value?: string): boolean {
  return Boolean(value && value.trim() && value.trim() !== 'Untitled draft');
}

const MANDATORY_BY_TYPE: Record<string, Array<{ key: keyof OpportunityDraftInput; label: string }>> = {
  'Buyer Request': [
    { key: 'productOrService', label: 'Opportunity title' },
    { key: 'description', label: 'Description' },
    { key: 'industry', label: 'Category' },
    { key: 'quantity', label: 'Quantity' },
  ],
  'Service Request': [
    { key: 'productOrService', label: 'Opportunity title' },
    { key: 'description', label: 'Description' },
    { key: 'industry', label: 'Category' },
  ],
  Procurement: [
    { key: 'productOrService', label: 'Opportunity title' },
    { key: 'description', label: 'Description' },
    { key: 'industry', label: 'Category' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'deadline', label: 'Submission deadline' },
  ],
  'Supplier Offer': [
    { key: 'productOrService', label: 'Opportunity title' },
    { key: 'description', label: 'Description' },
    { key: 'industry', label: 'Category' },
  ],
  'Export Opportunity': [
    { key: 'productOrService', label: 'Opportunity title' },
    { key: 'description', label: 'Description' },
    { key: 'industry', label: 'Category' },
    { key: 'destinationMarket', label: 'Target export markets' },
  ],
  Distribution: [
    { key: 'productOrService', label: 'Opportunity title' },
    { key: 'description', label: 'Description' },
    { key: 'industry', label: 'Category' },
    { key: 'destinationMarket', label: 'Target territories' },
  ],
  Partnership: [
    { key: 'productOrService', label: 'Opportunity title' },
    { key: 'description', label: 'Description' },
    { key: 'industry', label: 'Category' },
  ],
};

export function reviewOpportunityQuality(current: OpportunityDraftInput): {
  qualityReview: QualityReviewResult;
  clarificationQuestions: string[];
  missingInformation: string[];
  qualityNotes: string[];
  suggestion: Record<string, never>;
} {
  const type = current.type || 'Buyer Request';
  const mandatory = MANDATORY_BY_TYPE[type] || MANDATORY_BY_TYPE['Buyer Request'];
  const strengths: string[] = [];
  const gaps: string[] = [];
  const recommendations: Array<{ title: string; reason: string }> = [];
  const missingInformation: string[] = [];
  const clarificationQuestions: string[] = [];
  const qualityNotes: string[] = [];

  for (const field of mandatory) {
    const value = current[field.key];
    if (typeof value === 'string' && filled(value)) {
      strengths.push(`${field.label} is provided.`);
    } else if (field.key === 'quantity' && filled(current.quantityAndSpecs)) {
      strengths.push('Quantity details appear in the specs summary.');
    } else {
      gaps.push(`Missing ${field.label.toLowerCase()}.`);
      missingInformation.push(field.label);
      clarificationQuestions.push(`Please provide ${field.label.toLowerCase()}.`);
    }
  }

  if (filled(current.description) && (current.description?.trim().length || 0) >= 40) {
    strengths.push('Description has enough detail for counterparties to understand the intent.');
  } else if (filled(current.description)) {
    gaps.push('Description is short; more commercial context would attract better responses.');
    recommendations.push({
      title: 'Expand the description',
      reason: 'Buyers and suppliers respond more when scope, use-case and constraints are clear.',
    });
  }

  if (filled(current.destinationMarket) || filled(current.originLocation)) {
    strengths.push('Location or market focus is stated.');
  } else {
    gaps.push('No delivery destination or target market is specified.');
    recommendations.push({
      title: 'Add location or market',
      reason: 'Matching depends heavily on where goods or services must be fulfilled.',
    });
    clarificationQuestions.push('Which city, country or regional market does this opportunity cover?');
  }

  if (filled(current.deliveryTimeline) || filled(current.deadline)) {
    strengths.push('A timeline or deadline is present.');
  } else {
    gaps.push('No delivery timeline or closing deadline.');
    recommendations.push({
      title: 'Add a timeline',
      reason: 'Deadlines help serious counterparties prioritise and respond.',
    });
  }

  if (
    filled(current.technicalSpecs) ||
    filled(current.qualityRequirements) ||
    filled(current.requiredCertifications)
  ) {
    strengths.push('Quality, technical or certification expectations are mentioned.');
  } else {
    recommendations.push({
      title: 'Clarify quality requirements',
      reason: 'Specs and standards reduce unsuitable responses without inventing requirements.',
    });
  }

  const hay = `${current.productOrService || ''} ${current.description || ''} ${current.industry || ''}`;
  const certs = suggestCertifications(hay);
  if (certs.value && !filled(current.requiredCertifications)) {
    recommendations.push({
      title: 'Consider relevant certifications',
      reason: certs.notes[0] || 'Sector keywords suggest certifications counterparties often ask for.',
    });
    qualityNotes.push(`Suggested certifications (review only): ${certs.value}`);
  }

  // Conflicting signals — only when both sides of a conflict are present in text
  if (
    /\b(buy|purchase|need|looking for)\b/i.test(hay) &&
    /\b(selling|we offer|available for sale)\b/i.test(hay) &&
    (type === 'Buyer Request' || type === 'Supplier Offer')
  ) {
    gaps.push('Description mixes buying and selling language; confirm the opportunity type.');
    recommendations.push({
      title: 'Resolve demand vs supply wording',
      reason: 'Mixed intent confuses matching and may attract the wrong counterparties.',
    });
  }

  const readyToPublish = missingInformation.length === 0 && filled(current.description);

  const summary = readyToPublish
    ? 'Core commercial fields look complete enough to publish. Review recommendations to improve response quality.'
    : 'This listing is not yet complete for reliable matching. Address the gaps before publishing.';

  if (!readyToPublish) {
    qualityNotes.push('No fake quality score is assigned — readiness is based only on missing required commercial fields.');
  }

  return {
    suggestion: {},
    qualityReview: {
      summary,
      strengths,
      gaps,
      recommendations,
      readyToPublish,
    },
    clarificationQuestions,
    missingInformation,
    qualityNotes,
  };
}

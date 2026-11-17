import type {
  BusinessRequirementsProfile,
  ChecklistItem,
  DocumentAiExtraction,
  DocumentDiscrepancy,
  DocumentExtractedField,
  DocumentProfileProposal,
  UploadedDocumentRecord,
} from '../../src/types/compliance';
import { REGULATORY_RULES } from './regulatoryRules';
import { resolveExtractionProfile, type ExtractionProfile } from './extractionProfiles';

function normalizeComparable(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function namesLikelyMatch(a: string, b: string): boolean {
  const left = normalizeComparable(a);
  const right = normalizeComparable(b);
  if (!left || !right) return true;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

export function findSuggestedChecklistRule(params: {
  profile: ExtractionProfile;
  detectedType: string;
  checklist: ChecklistItem[];
}): { ruleId?: string; ruleName?: string; supports: string[] } {
  const hay = `${params.detectedType} ${params.profile.family}`.toLowerCase();
  const fromCatalog = REGULATORY_RULES.find((r) =>
    params.profile.suggestedRuleIds.includes(r.id)
  );
  const fromChecklist =
    params.checklist.find((c) => params.profile.suggestedRuleIds.includes(c.ruleId)) ||
    params.checklist.find((c) => {
      const name = c.documentName.toLowerCase();
      return params.profile.matchKeywords.some((kw) => name.includes(kw) || hay.includes(kw));
    });

  const supports = params.checklist
    .filter((c) => {
      const name = c.documentName.toLowerCase();
      return (
        params.profile.suggestedRuleIds.includes(c.ruleId) ||
        params.profile.matchKeywords.some((kw) => name.includes(kw))
      );
    })
    .map((c) => c.documentName)
    .slice(0, 5);

  return {
    ruleId: fromChecklist?.ruleId || fromCatalog?.id,
    ruleName: fromChecklist?.documentName || fromCatalog?.documentName,
    supports,
  };
}

export function buildDiscrepancies(params: {
  fields: DocumentExtractedField[];
  businessName: string;
  document: UploadedDocumentRecord;
  extractedBusinessName?: string;
}): DocumentDiscrepancy[] {
  const discrepancies: DocumentDiscrepancy[] = [];
  const extractedName =
    params.extractedBusinessName ||
    params.fields.find((f) => f.key === 'business_name' || f.key === 'taxpayer_name' || f.key === 'licence_holder')
      ?.value;

  if (extractedName && params.businessName && !namesLikelyMatch(extractedName, params.businessName)) {
    discrepancies.push({
      fieldKey: 'business_name',
      label: 'Business name',
      extractedValue: extractedName,
      existingValue: params.businessName,
      severity: 'critical',
      message:
        'Business name mismatch: The uploaded document contains a different registered name from your current TradeSquare business profile. Please review before saving.',
    });
  }

  const extractedRef = params.fields.find(
    (f) => f.mapsTo === 'document.referenceNumber' && f.value.trim()
  )?.value;
  if (
    extractedRef &&
    params.document.referenceNumber &&
    normalizeComparable(extractedRef) !== normalizeComparable(params.document.referenceNumber)
  ) {
    discrepancies.push({
      fieldKey: 'reference_number',
      label: 'Reference number',
      extractedValue: extractedRef,
      existingValue: params.document.referenceNumber,
      severity: 'warning',
      message:
        'Reference number differs from the value already saved on this document record.',
    });
  }

  return discrepancies;
}

export function buildProfileProposals(params: {
  fields: DocumentExtractedField[];
  businessName: string;
  businessCountry: string;
  businessCity: string;
  businessIndustry: string;
  profile: BusinessRequirementsProfile;
}): DocumentProfileProposal[] {
  const proposals: DocumentProfileProposal[] = [];

  for (const field of params.fields) {
    if (!field.value.trim() || field.confidence === 'unreadable' || field.confidence === 'missing') {
      continue;
    }
    if (field.mapsTo === 'business.name') {
      const existing = params.businessName;
      proposals.push({
        target: 'business',
        field: 'name',
        label: 'Business name',
        proposedValue: field.value.trim(),
        existingValue: existing || undefined,
        sourceFieldKey: field.key,
        overwritePolicy: existing ? 'requires_confirmation' : 'fill_if_empty',
      });
    }
    if (field.mapsTo === 'business.country' || field.key === 'issuing_country') {
      const existing = params.businessCountry;
      if (!existing || !namesLikelyMatch(existing, field.value)) {
        proposals.push({
          target: 'business',
          field: 'country',
          label: 'Country',
          proposedValue: field.value.trim(),
          existingValue: existing || undefined,
          sourceFieldKey: field.key,
          overwritePolicy: existing ? 'requires_confirmation' : 'fill_if_empty',
        });
      }
    }
    if (field.mapsTo === 'business.city' && field.key === 'registered_address') {
      const cityGuess = field.value.split(',')[0]?.trim();
      if (cityGuess) {
        proposals.push({
          target: 'business',
          field: 'city',
          label: 'City / registered location',
          proposedValue: cityGuess,
          existingValue: params.businessCity || undefined,
          sourceFieldKey: field.key,
          overwritePolicy: params.businessCity ? 'requires_confirmation' : 'fill_if_empty',
        });
      }
    }
    if (field.mapsTo === 'profile.legalStructure' && field.value.trim()) {
      proposals.push({
        target: 'profile',
        field: 'legalStructureNote',
        label: 'Legal structure (from document)',
        proposedValue: field.value.trim(),
        existingValue: params.profile.legalStructure,
        sourceFieldKey: field.key,
        overwritePolicy: 'requires_confirmation',
      });
    }
    if (field.mapsTo?.startsWith('experience.')) {
      proposals.push({
        target: 'experience',
        field: field.mapsTo.replace('experience.', ''),
        label: field.label,
        proposedValue: field.value.trim(),
        sourceFieldKey: field.key,
        overwritePolicy: 'requires_confirmation',
      });
    }
  }

  // Deduplicate by target+field keeping first
  const seen = new Set<string>();
  return proposals.filter((p) => {
    const key = `${p.target}:${p.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapDocumentFieldsFromExtraction(
  extraction: DocumentAiExtraction,
  acceptedFieldKeys: string[]
): Partial<UploadedDocumentRecord> {
  const accepted = new Set(acceptedFieldKeys);
  const byMap = new Map<string, string>();

  for (const field of extraction.fields) {
    if (!accepted.has(field.key)) continue;
    if (!field.value.trim()) continue;
    if (field.confidence === 'unreadable' || field.confidence === 'missing') continue;
    if (!field.mapsTo?.startsWith('document.')) continue;
    byMap.set(field.mapsTo, field.value.trim());
  }

  const patch: Partial<UploadedDocumentRecord> = {};
  if (accepted.has('__title__') || byMap.has('document.title')) {
    patch.title = byMap.get('document.title') || extraction.extractedTitle;
  }
  if (accepted.has('__type__') || byMap.has('document.documentType')) {
    patch.documentType =
      byMap.get('document.documentType') || extraction.detectedDocumentType;
  }
  if (byMap.has('document.issuingAuthority') || extraction.extractedIssuingAuthority) {
    if (accepted.has('issuing_authority') || accepted.has('__authority__')) {
      patch.issuingAuthority =
        byMap.get('document.issuingAuthority') || extraction.extractedIssuingAuthority;
    }
  }
  if (byMap.has('document.referenceNumber') && [...accepted].some((k) =>
    ['registration_number', 'tin', 'certificate_number', 'document_number', 'licence_number', 'contract_reference', 'reference_number'].includes(k)
  )) {
    patch.referenceNumber = byMap.get('document.referenceNumber');
  }
  if (byMap.has('document.issueDate') && (accepted.has('issue_date') || accepted.has('completion_date'))) {
    patch.issueDate = byMap.get('document.issueDate');
  }
  if (byMap.has('document.expiryDate') && accepted.has('expiry_date')) {
    patch.expiryDate = byMap.get('document.expiryDate');
  }
  if (byMap.has('document.relatedProductOrScope')) {
    patch.relatedProductOrScope = byMap.get('document.relatedProductOrScope');
  }
  if (byMap.has('document.countryOfIssue') || (extraction.issuingCountry && accepted.has('issuing_country'))) {
    patch.countryOfIssue =
      byMap.get('document.countryOfIssue') || extraction.issuingCountry;
  }

  // Fallback flat fields when structured fields empty but user accepted summary fields
  if (!patch.title && extraction.extractedTitle) patch.title = extraction.extractedTitle;
  if (!patch.documentType && extraction.detectedDocumentType) {
    patch.documentType = extraction.detectedDocumentType;
  }
  if (!patch.issuingAuthority && extraction.extractedIssuingAuthority) {
    patch.issuingAuthority = extraction.extractedIssuingAuthority;
  }
  if (!patch.referenceNumber && extraction.extractedReferenceNumber) {
    patch.referenceNumber = extraction.extractedReferenceNumber;
  }
  if (!patch.issueDate && extraction.extractedIssueDate) {
    patch.issueDate = extraction.extractedIssueDate;
  }
  if (!patch.expiryDate && extraction.extractedExpiryDate) {
    patch.expiryDate = extraction.extractedExpiryDate;
  }
  if (!patch.relatedProductOrScope && extraction.relatedBusinessOrProduct) {
    patch.relatedProductOrScope = extraction.relatedBusinessOrProduct;
  }

  return patch;
}

export function detectDuplicateDocuments(params: {
  candidate: UploadedDocumentRecord;
  extraction: DocumentAiExtraction;
  existing: UploadedDocumentRecord[];
}): string[] {
  const warnings: string[] = [];
  const ref = (
    params.extraction.extractedReferenceNumber ||
    params.extraction.fields.find((f) => f.mapsTo === 'document.referenceNumber')?.value ||
    ''
  ).trim();
  const type = normalizeComparable(params.extraction.detectedDocumentType);

  for (const other of params.existing) {
    if (other.id === params.candidate.id) continue;
    const sameHash =
      Boolean(params.candidate.contentHash) &&
      Boolean(other.contentHash) &&
      params.candidate.contentHash === other.contentHash;
    const sameRef =
      ref.length >= 4 &&
      other.referenceNumber &&
      normalizeComparable(other.referenceNumber) === normalizeComparable(ref);
    const sameTypeAndTitle =
      type &&
      normalizeComparable(other.documentType) === type &&
      normalizeComparable(other.title) ===
        normalizeComparable(params.extraction.extractedTitle || other.title);
    if (sameHash || sameRef || sameTypeAndTitle) {
      warnings.push(
        `Duplicate of existing vault document “${other.title}” (${other.fileName}).`
      );
    }
  }
  return warnings;
}

export type DocumentAdmissionDecision =
  | { allowed: true }
  | {
      allowed: false;
      code: 'unrelated_business' | 'duplicate' | 'not_a_certificate' | 'not_understood';
      reason: string;
    };

const OFFICIAL_DOC_KEYWORDS = [
  'certificate',
  'certificat',
  'licence',
  'license',
  'permit',
  'registration',
  'incorporation',
  'clearance',
  'attestation',
  'taxpayer',
  'tin',
  'pin',
  'iso',
  'haccp',
  'phytosanitary',
  'veterinary',
  'origin',
  'conformity',
  'standards',
  'issued',
  'issuing',
  'authority',
  'republic',
  'board',
  'revenue',
  'customs',
  'export',
  'import',
  'completion',
  'performance',
  'reference letter',
  'rdb',
  'rra',
  'rsb',
  'rfda',
  'naeb',
  'kra',
  'brs',
  'ursb',
  'ura',
  's-mark',
  'smark',
  'valid until',
  'expiry',
  'expiration',
  'registration number',
  'certificate number',
  'licence number',
  'license number',
];

const AUTHORITY_HINTS = [
  'rwanda development board',
  'rwanda revenue authority',
  'rwanda standards board',
  'rwanda fda',
  'ministry',
  'government',
  'authority',
  'bureau',
  'commission',
  'agency',
  'board',
];

/**
 * Reject random photos / fake images that are not business certificates or permits.
 * Also require that we confidently understand the document type.
 */
export function assessOfficialDocumentLikelihood(params: {
  ocrText: string;
  extraction: DocumentAiExtraction;
}): { ok: boolean; score: number; reason: string; code: 'not_a_certificate' | 'not_understood' } {
  const text = (params.ocrText || params.extraction.sourceTextExcerpt || '').trim();
  const compact = text.replace(/\s+/g, '');
  const lower = text.toLowerCase();

  if (params.extraction.ocrMethod === 'tradesquare_unreadable' || compact.length < 60) {
    return {
      ok: false,
      score: 0,
      code: 'not_understood',
      reason:
        'No. TradeSquare could not clearly read and understand this upload. Upload a clear official certificate or permit (PDF/JPG/PNG).',
    };
  }

  let score = 0;
  const matchedKeywords = OFFICIAL_DOC_KEYWORDS.filter((kw) => lower.includes(kw));
  score += Math.min(matchedKeywords.length * 2, 12);

  const matchedAuthorities = AUTHORITY_HINTS.filter((kw) => lower.includes(kw));
  score += Math.min(matchedAuthorities.length * 2, 6);

  const hasDate = /\b(\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\b/i.test(
    text
  );
  if (hasDate) score += 2;

  const hasRef =
    Boolean(params.extraction.extractedReferenceNumber?.trim()) ||
    /(?:no\.?|number|#)\s*[:\-]?\s*[a-z0-9\-\/]{4,}/i.test(text) ||
    /\b(?:tin|pin|rdb)\b/i.test(text);
  if (hasRef) score += 3;

  const highConfidenceIdentityFields = params.extraction.fields.filter(
    (f) =>
      f.value.trim() &&
      f.confidence === 'high' &&
      [
        'registration_number',
        'tin',
        'certificate_number',
        'document_number',
        'licence_number',
        'issuing_authority',
        'business_name',
        'taxpayer_name',
        'licence_holder',
      ].includes(f.key)
  ).length;
  score += Math.min(highConfidenceIdentityFields * 2, 8);

  const family = params.extraction.documentFamily;
  if (family && family !== 'other') score += 4;

  const understoodType =
    Boolean(params.extraction.detectedDocumentType?.trim()) &&
    !/pending ai identification|business document|other/i.test(
      params.extraction.detectedDocumentType || ''
    ) &&
    family !== 'other';

  // Hard fail: no certificate/permit vocabulary at all
  if (matchedKeywords.length === 0) {
    return {
      ok: false,
      score,
      code: 'not_a_certificate',
      reason:
        'No. This is not an official business certificate, licence, tax document, or permit. Unrelated images and fake documents are not accepted.',
    };
  }

  if (!understoodType) {
    return {
      ok: false,
      score,
      code: 'not_understood',
      reason:
        'No. TradeSquare is not 100% sure what this document is. Only clearly identifiable official certificates/permits can proceed.',
    };
  }

  // Require stronger authenticity + understanding
  if (score < 10 || highConfidenceIdentityFields < 1) {
    return {
      ok: false,
      score,
      code: 'not_understood',
      reason:
        'No. TradeSquare could not confidently understand key details on this document (authority, reference, or organisation). Re-upload a clearer official certificate.',
    };
  }

  return {
    ok: true,
    score,
    code: 'not_a_certificate',
    reason: 'Accepted as understood official document.',
  };
}

/**
 * Hard gate after extraction: reject fakes, unrelated businesses, unclear docs, and duplicates.
 */
export function evaluateDocumentAdmission(params: {
  businessName: string;
  candidate: UploadedDocumentRecord;
  extraction: DocumentAiExtraction;
  existingDocuments: UploadedDocumentRecord[];
}): DocumentAdmissionDecision {
  const authenticity = assessOfficialDocumentLikelihood({
    ocrText: params.extraction.sourceTextExcerpt || '',
    extraction: params.extraction,
  });
  if (!authenticity.ok) {
    return {
      allowed: false,
      code: authenticity.code,
      reason: authenticity.reason,
    };
  }

  const duplicates = detectDuplicateDocuments({
    candidate: params.candidate,
    extraction: params.extraction,
    existing: params.existingDocuments,
  });
  if (duplicates.length > 0) {
    return {
      allowed: false,
      code: 'duplicate',
      reason: `No. ${duplicates[0]} The same document cannot be uploaded twice.`,
    };
  }

  const extractedName = (
    params.extraction.extractedBusinessName ||
    params.extraction.fields.find((f) =>
      ['business_name', 'taxpayer_name', 'licence_holder', 'exporter_importer', 'organisation_name'].includes(
        f.key
      )
    )?.value ||
    ''
  ).trim();

  const textHay = [
    params.extraction.sourceTextExcerpt,
    params.extraction.extractedTitle,
    params.extraction.detectedDocumentType,
    ...params.extraction.fields.map((f) => f.value),
  ]
    .filter(Boolean)
    .join(' ');

  // Must prove the document belongs to THIS business
  const businessMentioned = namesLikelyMatch(textHay, params.businessName);
  if (extractedName) {
    if (!namesLikelyMatch(extractedName, params.businessName)) {
      return {
        allowed: false,
        code: 'unrelated_business',
        reason: `No. This document is for “${extractedName}”, not your business “${params.businessName}”. Unrelated documents cannot be uploaded.`,
      };
    }
  } else if (!businessMentioned) {
    return {
      allowed: false,
      code: 'unrelated_business',
      reason: `No. TradeSquare could not confirm this document belongs to your business “${params.businessName}”. Upload a certificate that clearly names your enterprise.`,
    };
  }

  if (params.extraction.businessNameMatchesProfile === false) {
    return {
      allowed: false,
      code: 'unrelated_business',
      reason: `No. The organisation on this document does not match your TradeSquare business “${params.businessName}”.`,
    };
  }

  const companyLike = textHay.match(
    /\b([A-Z][A-Za-z0-9 &.,'"()-]{2,60}?\s(?:Ltd|Limited|LLC|PLC|Company|SARL)\.?)\b/g
  );
  if (companyLike && companyLike.length > 0) {
    const anyMatch = companyLike.some((name) => namesLikelyMatch(name, params.businessName));
    if (!anyMatch) {
      return {
        allowed: false,
        code: 'unrelated_business',
        reason: `No. This document appears related to “${companyLike[0]}”, not your business “${params.businessName}”.`,
      };
    }
  }

  return { allowed: true };
}

export function enrichExtractionWithIntelligence(params: {
  extraction: DocumentAiExtraction;
  businessName: string;
  businessCountry: string;
  businessCity: string;
  businessIndustry: string;
  profile: BusinessRequirementsProfile;
  document: UploadedDocumentRecord;
  checklist: ChecklistItem[];
  existingDocuments: UploadedDocumentRecord[];
}): DocumentAiExtraction {
  const familyProfile = resolveExtractionProfile({
    detectedType: params.extraction.detectedDocumentType,
    userDocumentType: params.document.documentType,
    title: params.extraction.extractedTitle || params.document.title,
    authority: params.extraction.extractedIssuingAuthority,
    fileName: params.document.fileName,
  });

  const suggestion = findSuggestedChecklistRule({
    profile: familyProfile,
    detectedType: params.extraction.detectedDocumentType,
    checklist: params.checklist,
  });

  const discrepancies = buildDiscrepancies({
    fields: params.extraction.fields,
    businessName: params.businessName,
    document: params.document,
    extractedBusinessName: params.extraction.extractedBusinessName,
  });

  const profileProposals = buildProfileProposals({
    fields: params.extraction.fields,
    businessName: params.businessName,
    businessCountry: params.businessCountry,
    businessCity: params.businessCity,
    businessIndustry: params.businessIndustry,
    profile: params.profile,
  });

  const duplicateWarnings = detectDuplicateDocuments({
    candidate: params.document,
    extraction: params.extraction,
    existing: params.existingDocuments,
  });

  const extractionWarnings = [
    ...(params.extraction.extractionWarnings || []),
    ...duplicateWarnings,
  ];

  return {
    ...params.extraction,
    documentFamily: familyProfile.family,
    documentPurposeSummary: familyProfile.purpose,
    suggestedChecklistRuleId: suggestion.ruleId,
    suggestedChecklistRuleName: suggestion.ruleName,
    supportsChecklistItems: suggestion.supports,
    suggestedOtherDocuments: familyProfile.fields
      .filter((f) => f.requiredHint)
      .filter((f) => !params.extraction.fields.some((ef) => ef.key === f.key && ef.value.trim()))
      .map((f) => `Confirm or provide: ${f.label}`),
    profileProposals,
    discrepancies,
    extractionWarnings,
    processingStatus: 'ready_for_review',
    flaggedForHumanReview:
      params.extraction.flaggedForHumanReview ||
      discrepancies.some((d) => d.severity === 'critical') ||
      duplicateWarnings.length > 0,
    reviewFlagReasons: [
      ...params.extraction.reviewFlagReasons,
      ...discrepancies.filter((d) => d.severity !== 'info').map((d) => d.message),
      ...duplicateWarnings,
    ],
  };
}

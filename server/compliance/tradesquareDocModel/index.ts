import type {
  BusinessRequirementsProfile,
  ChecklistItem,
  DocumentAiExtraction,
  UploadedDocumentRecord,
} from '../../../src/types/compliance';
import { resolveExtractionProfile } from '../extractionProfiles';
import { enrichExtractionWithIntelligence } from '../documentIntelligence';
import { TS_DOC_MODEL_ID, TS_DOC_MODEL_LABEL } from './constants';
import { assessExpiryDate } from './dateUtils';
import { extractDocumentText } from './ocr';
import { runTradeSquareExtractors } from './extractors';

function improveDetectedType(params: {
  profileFamily: string;
  fullText: string;
  fileName: string;
  userType: string;
}): string {
  const hay = `${params.fullText}\n${params.fileName}\n${params.userType}`.toLowerCase();
  if (/certificate of (incorporation|registration)|rdb/.test(hay)) {
    return 'Business Registration Certificate';
  }
  if (/tax clearance|attestation|tin|taxpayer/.test(hay)) {
    return 'Tax Certificate';
  }
  if (/s[-\s]?mark|iso\s?\d|haccp|conformity/.test(hay)) {
    return 'Product Certification Document';
  }
  if (/phytosanitary|veterinary|certificate of origin|export|import permit/.test(hay)) {
    return 'Import / Export Permit or Certificate';
  }
  if (/certificate of completion|good performance|satisfactory service|client reference/.test(hay)) {
    return 'Experience / Performance Certificate';
  }
  if (/licence|license|operating permit/.test(hay)) {
    return 'Sector Licence / Permit';
  }
  if (params.userType && params.userType !== 'Pending AI identification') {
    return params.userType;
  }
  return params.profileFamily.replace(/_/g, ' ');
}

/**
 * TradeSquare Document Intelligence v1
 * Proprietary OCR + classification + typed field extraction.
 * Does not call Gemini or any external LLM for document reading.
 */
export async function analyzeWithTradeSquareDocModel(params: {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  documentRecord: UploadedDocumentRecord;
  businessName: string;
  businessCountry: string;
  businessCity: string;
  businessIndustry: string;
  profile: BusinessRequirementsProfile;
  checklist: ChecklistItem[];
  existingDocuments: UploadedDocumentRecord[];
}): Promise<DocumentAiExtraction> {
  const ocr = await extractDocumentText({
    fileBuffer: params.fileBuffer,
    mimeType: params.mimeType,
    fileName: params.fileName,
  });

  const seedProfile = resolveExtractionProfile({
    userDocumentType: params.documentRecord.documentType,
    title: params.documentRecord.title,
    authority: params.documentRecord.issuingAuthority,
    fileName: params.fileName,
    detectedType: ocr.fullText.slice(0, 500),
  });

  const extracted = runTradeSquareExtractors({
    profile: seedProfile,
    fullText: ocr.fullText,
    pages: ocr.pages,
    expectedBusinessName: params.businessName,
    userTitle: params.documentRecord.title,
    fileName: params.fileName,
  });

  const detectedDocumentType = improveDetectedType({
    profileFamily: seedProfile.family,
    fullText: ocr.fullText,
    fileName: params.fileName,
    userType: params.documentRecord.documentType,
  });

  // Re-resolve profile with detected type for better checklist matching
  const finalProfile = resolveExtractionProfile({
    detectedType: detectedDocumentType,
    userDocumentType: params.documentRecord.documentType,
    title: extracted.extractedTitle,
    authority: extracted.extractedIssuingAuthority,
    fileName: params.fileName,
  });

  const unreadPages = ocr.pages.filter((p) => !p.readable).map((p) => p.pageNumber);
  const expiryWarnings: string[] = [];
  // Only assess expiry when the document explicitly labeled it — never guess.
  if (extracted.expiryLabeled && extracted.extractedExpiryDate) {
    const assessment = assessExpiryDate(extracted.extractedExpiryDate);
    if (assessment.status === 'expired') {
      expiryWarnings.push(
        `Document expiry date ${assessment.raw} (${assessment.iso}) is ${assessment.daysPast} day(s) before today.`
      );
    } else if (assessment.status === 'expiring_soon') {
      expiryWarnings.push(
        `Document expiry date ${assessment.raw} (${assessment.iso}) is within ${assessment.daysRemaining} day(s).`
      );
    } else if (assessment.status === 'invalid_or_unparsed') {
      expiryWarnings.push(
        `Expiry date text “${extracted.extractedExpiryDate}” could not be parsed confidently. Please confirm manually.`
      );
    }
  }

  const completenessIssues = extracted.fields
    .filter((f) => f.confidence === 'missing' && seedProfile.fields.some((s) => s.key === f.key && s.requiredHint))
    .map((f) => `Required field not found in document text: ${f.label}`);

  if (ocr.channel === 'unreadable') {
    completenessIssues.push('Document text could not be read confidently by TradeSquare OCR.');
  }

  const base: DocumentAiExtraction = {
    detectedDocumentType,
    documentFamily: finalProfile.family,
    extractedTitle: extracted.extractedTitle,
    extractedIssuingAuthority: extracted.extractedIssuingAuthority,
    extractedIssueDate: extracted.extractedIssueDate,
    extractedExpiryDate: extracted.extractedExpiryDate,
    extractedReferenceNumber: extracted.extractedReferenceNumber,
    relatedBusinessOrProduct: extracted.relatedBusinessOrProduct,
    extractedBusinessName: extracted.extractedBusinessName,
    issuingCountry: extracted.issuingCountry || params.profile.registrationCountry,
    businessNameMatchesProfile: extracted.businessNameMatchesProfile,
    fields: extracted.fields,
    extractionWarnings: [...ocr.warnings],
    completenessIssues,
    expiryWarnings,
    pageCountEstimate: ocr.pages.length,
    unreadPages,
    documentPurposeSummary: finalProfile.purpose,
    supportsChecklistItems: [],
    suggestedOtherDocuments: completenessIssues.slice(0, 5),
    profileProposals: [],
    discrepancies: [],
    processingStatus: 'comparing',
    flaggedForHumanReview:
      !extracted.businessNameMatchesProfile ||
      expiryWarnings.length > 0 ||
      unreadPages.length > 0 ||
      ocr.channel === 'unreadable' ||
      completenessIssues.length > 0,
    reviewFlagReasons: [
      ...(!extracted.businessNameMatchesProfile
        ? ['Extracted organisation name may not match your TradeSquare business profile.']
        : []),
      ...expiryWarnings,
      ...ocr.warnings,
    ],
    disclaimer: `${TS_DOC_MODEL_LABEL} assists with OCR and form pre-fill only. It never confirms authenticity, legal validity, or official verification. Always review extracted values before saving.`,
    confirmedByUser: false,
    analyzedAt: new Date().toISOString(),
    ocrMethod:
      ocr.channel === 'pdf_text'
        ? 'tradesquare_pdf_text'
        : ocr.channel === 'tesseract_ocr'
          ? 'tradesquare_tesseract'
          : ocr.channel === 'hybrid'
            ? 'tradesquare_hybrid'
            : 'tradesquare_unreadable',
    modelUsed: TS_DOC_MODEL_ID,
    sourceTextExcerpt: ocr.fullText.slice(0, 4000),
  };

  return enrichExtractionWithIntelligence({
    extraction: base,
    businessName: params.businessName,
    businessCountry: params.businessCountry,
    businessCity: params.businessCity,
    businessIndustry: params.businessIndustry,
    profile: params.profile,
    document: params.documentRecord,
    checklist: params.checklist,
    existingDocuments: params.existingDocuments,
  });
}

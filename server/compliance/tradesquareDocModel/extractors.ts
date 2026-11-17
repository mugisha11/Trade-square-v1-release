import type {
  DocumentExtractedField,
  ExtractionConfidence,
} from '../../../src/types/compliance';
import type { DocumentFamily, ExtractionProfile } from '../extractionProfiles';
import type { PageTextResult } from './ocr';
import { parseDocumentDate } from './dateUtils';

const EXPIRY_LABEL_RE =
  /\b(expir(?:y|es|ed|ation)?|valid\s*until|valid\s*to|validity(?:\s*end|\s*period)?|renew(?:al)?\s*by|good\s*until)\b/i;
const ISSUE_LABEL_RE =
  /\b(issue\s*date|issued(?:\s*on)?|dated|date\s*of\s*issue|registration\s*date|granted(?:\s*on)?|commencement|effective\s*(?:date|from))\b/i;

function findPageForMatch(pages: PageTextResult[], match: string): number | undefined {
  const needle = match.slice(0, 80).toLowerCase();
  for (const page of pages) {
    if (page.text.toLowerCase().includes(needle.toLowerCase())) return page.pageNumber;
  }
  return pages.find((p) => p.readable)?.pageNumber;
}

function firstMatch(text: string, patterns: RegExp[]): { value: string; index: number } | null {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m?.[1]) {
      return { value: m[1].trim(), index: m.index ?? 0 };
    }
  }
  return null;
}

function confidenceForValue(value: string, required: boolean): ExtractionConfidence {
  if (!value.trim()) return required ? 'missing' : 'missing';
  if (value.trim().length < 2) return 'needs_review';
  return 'high';
}

function field(
  key: string,
  label: string,
  value: string,
  pages: PageTextResult[],
  opts: {
    required?: boolean;
    mapsTo?: DocumentExtractedField['mapsTo'];
    originalText?: string;
    warning?: string;
    forceConfidence?: ExtractionConfidence;
  } = {}
): DocumentExtractedField {
  const confidence =
    opts.forceConfidence || confidenceForValue(value, Boolean(opts.required));
  return {
    key,
    label,
    value: value.trim(),
    originalText: opts.originalText || (value ? value.trim() : undefined),
    pageNumber: value ? findPageForMatch(pages, opts.originalText || value) : undefined,
    confidence,
    status:
      confidence === 'missing'
        ? 'missing'
        : confidence === 'unreadable'
          ? 'unreadable'
          : 'extracted',
    statedOrInferred: 'stated',
    warning: opts.warning,
    mapsTo: opts.mapsTo,
  };
}

export type ExtractedDates = {
  issue?: string;
  expiry?: string;
  /** True only when expiry came from an explicit label near the date. */
  expiryLabeled: boolean;
  /** True only when issue came from an explicit label near the date. */
  issueLabeled: boolean;
  any: string[];
};

function extractDates(text: string): ExtractedDates {
  const patterns = [
    /\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/g,
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{4})\b/g,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\b/gi,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi,
  ];
  const found: string[] = [];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(text)) !== null) {
      const candidate = m[1]?.trim();
      if (!candidate || found.includes(candidate)) continue;
      // Keep only parseable, unambiguous dates
      if (!parseDocumentDate(candidate)) continue;
      found.push(candidate);
    }
  }

  const lower = text.toLowerCase();
  let issue: string | undefined;
  let expiry: string | undefined;
  let issueLabeled = false;
  let expiryLabeled = false;

  for (const d of found) {
    const idx = lower.indexOf(d.toLowerCase());
    if (idx < 0) continue;
    const window = lower.slice(Math.max(0, idx - 48), idx + d.length + 48);
    if (!expiry && EXPIRY_LABEL_RE.test(window)) {
      expiry = d;
      expiryLabeled = true;
      continue;
    }
    if (!issue && ISSUE_LABEL_RE.test(window)) {
      issue = d;
      issueLabeled = true;
    }
  }

  // Label-first line patterns (stronger than proximity windows)
  const labeledIssue = text.match(
    /(?:Issue\s*Date|Date\s*of\s*Issue|Issued(?:\s*on)?|Registration\s*Date)\s*[:\-]?\s*([^\n,]{6,32})/i
  );
  if (labeledIssue?.[1]) {
    const parsed = parseDocumentDate(labeledIssue[1].trim());
    if (parsed) {
      issue = parsed.raw;
      issueLabeled = true;
    }
  }
  const labeledExpiry = text.match(
    /(?:Expir(?:y|ation)\s*Date|Valid\s*(?:Until|To)|Valid(?:ity)?\s*End)\s*[:\-]?\s*([^\n,]{6,32})/i
  );
  if (labeledExpiry?.[1]) {
    const parsed = parseDocumentDate(labeledExpiry[1].trim());
    if (parsed) {
      expiry = parsed.raw;
      expiryLabeled = true;
    }
  }

  // Only fill issue from an unlabeled first date when no labeled issue exists.
  // NEVER invent expiry from "second date" — that caused false expired warnings.
  if (!issue && found[0]) {
    issue = found[0];
    issueLabeled = false;
  }

  return { issue, expiry, expiryLabeled, issueLabeled, any: found };
}

function extractAuthority(text: string): string | undefined {
  const patterns = [
    /(Rwanda Development Board|RDB)/i,
    /(Rwanda Revenue Authority|RRA)/i,
    /(Rwanda Standards Board|RSB)/i,
    /(Rwanda FDA|RFDA)/i,
    /(National Agricultural Export Development Board|NAEB)/i,
    /(Kenya Revenue Authority|KRA)/i,
    /(Business Registration Service|BRS)/i,
    /(Uganda Registration Services Bureau|URSB)/i,
    /(Uganda Revenue Authority|URA)/i,
    /(KEBS|KEPHIS|UNBS|MAAIF)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1];
  }
  return undefined;
}

function extractBusinessName(text: string, expectedName?: string): string | undefined {
  if (expectedName) {
    const esc = expectedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(esc, 'i');
    if (re.test(text)) return expectedName;
  }

  const labeled = firstMatch(text, [
    /(?:Company|Business|Enterprise|Taxpayer|Licence Holder|License Holder|Exporter|Importer)\s*Name\s*[:\-]\s*([A-Za-z0-9 &.,'"()\-]{3,120})/i,
    /(?:Registered Name|Name of (?:the )?Business)\s*[:\-]\s*([A-Za-z0-9 &.,'"()\-]{3,120})/i,
  ]);
  if (labeled) return labeled.value.replace(/\s+/g, ' ').trim();

  const ltd = text.match(
    /\b([A-Z][A-Za-z0-9 &.,'"()-]{2,80}?\s(?:Ltd|Limited|LLC|PLC|Co\.|Company|SARL|Ltda)\.?)\b/
  );
  return ltd?.[1]?.replace(/\s+/g, ' ').trim();
}

function dateFieldConfidence(value: string, labeled: boolean): ExtractionConfidence {
  if (!value.trim()) return 'missing';
  if (!parseDocumentDate(value)) return 'needs_review';
  return labeled ? 'high' : 'needs_review';
}

function extractByFamily(
  family: DocumentFamily,
  text: string,
  pages: PageTextResult[],
  expectedBusinessName?: string
): { fields: DocumentExtractedField[]; dates: ExtractedDates } {
  const dates = extractDates(text);
  const authority = extractAuthority(text);
  const businessName = extractBusinessName(text, expectedBusinessName);
  const fields: DocumentExtractedField[] = [];

  if (family === 'business_registration') {
    const reg = firstMatch(text, [
      /(?:Registration|Incorporation|Company|Enterprise)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
      /\b(RDB[\s\-]?\d{3,}[A-Z0-9\-]*)\b/i,
      /\b([0-9]{5,12}[A-Z]?)\b/,
    ]);
    fields.push(
      field('business_name', 'Registered business name', businessName || '', pages, {
        required: true,
        mapsTo: 'business.name',
      }),
      field('registration_number', 'Registration number', reg?.value || '', pages, {
        required: true,
        mapsTo: 'document.referenceNumber',
        forceConfidence: reg ? 'high' : 'missing',
      }),
      field('legal_structure', 'Legal structure', '', pages, {
        mapsTo: 'profile.legalStructure',
        forceConfidence: 'missing',
      }),
      field('issue_date', 'Registration / issue date', dates.issue || '', pages, {
        mapsTo: 'document.issueDate',
        forceConfidence: dateFieldConfidence(dates.issue || '', dates.issueLabeled),
        warning: dates.issue && !dates.issueLabeled
          ? 'Date found without an explicit issue-date label — confirm before saving.'
          : undefined,
      }),
      field('registered_address', 'Registered address', '', pages, {
        mapsTo: 'business.city',
        forceConfidence: 'missing',
      }),
      field('issuing_authority', 'Issuing authority', authority || '', pages, {
        required: true,
        mapsTo: 'document.issuingAuthority',
      }),
      field('issuing_country', 'Issuing country', '', pages, {
        mapsTo: 'document.countryOfIssue',
        forceConfidence: 'missing',
      }),
      field('directors', 'Director / authorised representative', '', pages, {
        forceConfidence: 'missing',
      })
    );
  } else if (family === 'tax') {
    const tin = firstMatch(text, [
      /(?:TIN|PIN|Tax\s*(?:Identification|Id)\s*Number)\s*[:\-]?\s*([A-Z0-9\-]{6,20})/i,
      /\b(\d{9,12})\b/,
    ]);
    const cert = firstMatch(text, [
      /(?:Certificate|Clearance|Document)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
    ]);
    fields.push(
      field('taxpayer_name', 'Taxpayer name', businessName || '', pages, {
        required: true,
        mapsTo: 'business.name',
      }),
      field('tin', 'Tax identification number (TIN)', tin?.value || '', pages, {
        required: true,
        mapsTo: 'document.referenceNumber',
      }),
      field('certificate_number', 'Certificate / document number', cert?.value || '', pages, {
        mapsTo: 'document.referenceNumber',
      }),
      field('issue_date', 'Issue date', dates.issue || '', pages, {
        mapsTo: 'document.issueDate',
        forceConfidence: dateFieldConfidence(dates.issue || '', dates.issueLabeled),
      }),
      field('expiry_date', 'Expiry date', dates.expiryLabeled ? dates.expiry || '' : '', pages, {
        mapsTo: 'document.expiryDate',
        forceConfidence: dateFieldConfidence(
          dates.expiryLabeled ? dates.expiry || '' : '',
          dates.expiryLabeled
        ),
        warning:
          dates.expiry && !dates.expiryLabeled
            ? 'Ignored unlabeled date as expiry to avoid false expired warnings.'
            : undefined,
      }),
      field('issuing_authority', 'Issuing authority', authority || '', pages, {
        required: true,
        mapsTo: 'document.issuingAuthority',
      }),
      field('issuing_country', 'Issuing country', '', pages, {
        mapsTo: 'document.countryOfIssue',
        forceConfidence: 'missing',
      })
    );
  } else if (family === 'product_certification') {
    const certNo = firstMatch(text, [
      /(?:Certificate|Certification)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
      /\b(S[\s\-]?Mark[^\n]{0,40})/i,
    ]);
    const product = firstMatch(text, [
      /(?:Product|Commodity|Goods)\s*(?:Name|Description)?\s*[:\-]\s*([A-Za-z0-9 &.,'"()\-]{3,120})/i,
    ]);
    const scheme = firstMatch(text, [
      /\b(ISO\s?\d{4,5}(?::\d{4})?|HACCP|S[\s\-]?Mark|GlobalG\.?A\.?P\.?)\b/i,
    ]);
    fields.push(
      field('product_name', 'Product name', product?.value || '', pages, {
        required: true,
        mapsTo: 'document.relatedProductOrScope',
      }),
      field('certification_scheme', 'Certification scheme / standard', scheme?.value || '', pages),
      field('certificate_number', 'Certificate number', certNo?.value || '', pages, {
        required: true,
        mapsTo: 'document.referenceNumber',
      }),
      field('issuing_authority', 'Issuing authority', authority || '', pages, {
        required: true,
        mapsTo: 'document.issuingAuthority',
      }),
      field('issue_date', 'Issue date', dates.issue || '', pages, {
        mapsTo: 'document.issueDate',
        forceConfidence: dateFieldConfidence(dates.issue || '', dates.issueLabeled),
      }),
      field('expiry_date', 'Expiry / validity end', dates.expiryLabeled ? dates.expiry || '' : '', pages, {
        mapsTo: 'document.expiryDate',
        forceConfidence: dateFieldConfidence(
          dates.expiryLabeled ? dates.expiry || '' : '',
          dates.expiryLabeled
        ),
      }),
      field('scope', 'Certified scope', product?.value || '', pages, {
        mapsTo: 'document.relatedProductOrScope',
      })
    );
  } else if (family === 'import_export') {
    const docNo = firstMatch(text, [
      /(?:Certificate|Permit|Declaration)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
    ]);
    const product = firstMatch(text, [
      /(?:Product|Commodity|Consignment|Goods)\s*[:\-]?\s*([A-Za-z0-9 &.,'"()\-]{3,120})/i,
    ]);
    const market = firstMatch(text, [
      /(?:Destination|Country of Destination|Origin)\s*[:\-]?\s*([A-Za-z ]{3,60})/i,
    ]);
    fields.push(
      field('document_number', 'Permit / certificate number', docNo?.value || '', pages, {
        required: true,
        mapsTo: 'document.referenceNumber',
      }),
      field('exporter_importer', 'Exporter / importer name', businessName || '', pages, {
        mapsTo: 'business.name',
      }),
      field('product_or_consignment', 'Product / consignment', product?.value || '', pages, {
        required: true,
        mapsTo: 'document.relatedProductOrScope',
      }),
      field('destination_or_origin', 'Destination or origin market', market?.value || '', pages),
      field('issue_date', 'Issue date', dates.issue || '', pages, {
        mapsTo: 'document.issueDate',
        forceConfidence: dateFieldConfidence(dates.issue || '', dates.issueLabeled),
      }),
      field('expiry_date', 'Expiry date', dates.expiryLabeled ? dates.expiry || '' : '', pages, {
        mapsTo: 'document.expiryDate',
        forceConfidence: dateFieldConfidence(
          dates.expiryLabeled ? dates.expiry || '' : '',
          dates.expiryLabeled
        ),
      }),
      field('issuing_authority', 'Issuing authority', authority || '', pages, {
        required: true,
        mapsTo: 'document.issuingAuthority',
      })
    );
  } else if (family === 'experience') {
    const client = firstMatch(text, [
      /(?:Client|Contracting (?:Authority|Organisation|Organization)|Employer|Issued (?:by|to))\s*[:\-]?\s*([A-Za-z0-9 &.,'"()\-]{3,120})/i,
    ]);
    const project = firstMatch(text, [
      /(?:Project|Contract|Works|Assignment)\s*(?:Title|Name)?\s*[:\-]?\s*([A-Za-z0-9 &.,'"()\-]{3,140})/i,
    ]);
    const contractRef = firstMatch(text, [
      /(?:Contract|Reference|Ref)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9\-\/]{3,40})/i,
    ]);
    fields.push(
      field('client_organisation', 'Client / contracting organisation', client?.value || '', pages, {
        required: true,
        mapsTo: 'experience.clientOrContractingOrg',
      }),
      field('project_title', 'Project / contract title', project?.value || '', pages, {
        required: true,
        mapsTo: 'experience.projectOrContractTitle',
      }),
      field('contract_reference', 'Contract reference', contractRef?.value || '', pages, {
        mapsTo: 'document.referenceNumber',
      }),
      field('service_delivered', 'Service / works delivered', '', pages, {
        mapsTo: 'experience.natureOfDelivery',
        forceConfidence: 'missing',
      }),
      field('completion_date', 'Completion / delivery date', dates.issue || dates.any[0] || '', pages, {
        mapsTo: 'experience.completionDate',
      }),
      field('issue_date', 'Certificate issue date', dates.issue || '', pages, {
        mapsTo: 'document.issueDate',
        forceConfidence: dateFieldConfidence(dates.issue || '', dates.issueLabeled),
      }),
      field('issuing_organisation', 'Issuing organisation', client?.value || authority || '', pages, {
        required: true,
        mapsTo: 'experience.issuingOrganisation',
      }),
      field('project_location', 'Project location', '', pages, { forceConfidence: 'missing' }),
      field('performance_assessment', 'Performance assessment', '', pages, {
        forceConfidence: 'missing',
      })
    );
  } else if (family === 'licence') {
    const licenceNo = firstMatch(text, [
      /(?:Licence|License|Permit)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
    ]);
    const scope = firstMatch(text, [
      /(?:Activity|Scope|Premises|Category)\s*[:\-]?\s*([A-Za-z0-9 &.,'"()\-]{3,120})/i,
    ]);
    fields.push(
      field('licence_holder', 'Licence holder', businessName || '', pages, {
        required: true,
        mapsTo: 'business.name',
      }),
      field('licence_number', 'Licence / permit number', licenceNo?.value || '', pages, {
        required: true,
        mapsTo: 'document.referenceNumber',
      }),
      field('activity_scope', 'Licensed activity / scope', scope?.value || '', pages, {
        mapsTo: 'document.relatedProductOrScope',
      }),
      field('issue_date', 'Issue date', dates.issue || '', pages, {
        mapsTo: 'document.issueDate',
        forceConfidence: dateFieldConfidence(dates.issue || '', dates.issueLabeled),
      }),
      field('expiry_date', 'Expiry date', dates.expiryLabeled ? dates.expiry || '' : '', pages, {
        mapsTo: 'document.expiryDate',
        forceConfidence: dateFieldConfidence(
          dates.expiryLabeled ? dates.expiry || '' : '',
          dates.expiryLabeled
        ),
      }),
      field('issuing_authority', 'Issuing authority', authority || '', pages, {
        required: true,
        mapsTo: 'document.issuingAuthority',
      })
    );
  } else {
    const ref = firstMatch(text, [
      /(?:No\.?|Number|Ref(?:erence)?)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
    ]);
    fields.push(
      field('document_title', 'Document title', '', pages, {
        required: true,
        mapsTo: 'document.title',
        forceConfidence: 'missing',
      }),
      field('issuing_authority', 'Issuing authority', authority || '', pages, {
        required: true,
        mapsTo: 'document.issuingAuthority',
      }),
      field('reference_number', 'Reference number', ref?.value || '', pages, {
        mapsTo: 'document.referenceNumber',
      }),
      field('issue_date', 'Issue date', dates.issue || '', pages, {
        mapsTo: 'document.issueDate',
        forceConfidence: dateFieldConfidence(dates.issue || '', dates.issueLabeled),
      }),
      field('expiry_date', 'Expiry date', dates.expiryLabeled ? dates.expiry || '' : '', pages, {
        mapsTo: 'document.expiryDate',
        forceConfidence: dateFieldConfidence(
          dates.expiryLabeled ? dates.expiry || '' : '',
          dates.expiryLabeled
        ),
      }),
      field('subject_or_scope', 'Subject / scope', '', pages, {
        mapsTo: 'document.relatedProductOrScope',
        forceConfidence: 'missing',
      }),
      field('organisation_name', 'Organisation name', businessName || '', pages, {
        mapsTo: 'business.name',
      })
    );
  }

  return { fields, dates };
}

export function runTradeSquareExtractors(params: {
  profile: ExtractionProfile;
  fullText: string;
  pages: PageTextResult[];
  expectedBusinessName: string;
  userTitle: string;
  fileName: string;
}): {
  fields: DocumentExtractedField[];
  detectedDocumentType: string;
  extractedTitle: string;
  extractedIssuingAuthority: string;
  extractedIssueDate?: string;
  extractedExpiryDate?: string;
  expiryLabeled: boolean;
  extractedReferenceNumber?: string;
  relatedBusinessOrProduct?: string;
  extractedBusinessName?: string;
  issuingCountry?: string;
  businessNameMatchesProfile: boolean;
} {
  const { fields, dates } = extractByFamily(
    params.profile.family,
    params.fullText,
    params.pages,
    params.expectedBusinessName
  );

  // Ensure every profile field exists
  for (const spec of params.profile.fields) {
    if (!fields.some((f) => f.key === spec.key)) {
      fields.push(
        field(spec.key, spec.label, '', params.pages, {
          required: spec.requiredHint,
          mapsTo: spec.mapsTo as DocumentExtractedField['mapsTo'],
          forceConfidence: 'missing',
        })
      );
    } else {
      const existing = fields.find((f) => f.key === spec.key)!;
      if (!existing.mapsTo && spec.mapsTo) {
        existing.mapsTo = spec.mapsTo as DocumentExtractedField['mapsTo'];
      }
    }
  }

  const get = (key: string) => fields.find((f) => f.key === key)?.value?.trim() || '';
  const extractedBusinessName =
    get('business_name') ||
    get('taxpayer_name') ||
    get('licence_holder') ||
    get('exporter_importer') ||
    get('organisation_name') ||
    undefined;

  const extractedReferenceNumber =
    get('registration_number') ||
    get('tin') ||
    get('certificate_number') ||
    get('document_number') ||
    get('licence_number') ||
    get('contract_reference') ||
    get('reference_number') ||
    undefined;

  const titleGuess =
    params.userTitle && params.userTitle !== 'Pending AI identification'
      ? params.userTitle
      : params.profile.purpose.split('.')[0] || params.fileName.replace(/\.[^.]+$/, '');

  const authority = get('issuing_authority') || get('issuing_organisation') || '';

  let businessNameMatchesProfile = true;
  if (extractedBusinessName && params.expectedBusinessName) {
    const a = extractedBusinessName.toLowerCase();
    const b = params.expectedBusinessName.toLowerCase();
    businessNameMatchesProfile = a === b || a.includes(b) || b.includes(a);
  }

  return {
    fields,
    detectedDocumentType:
      params.profile.family === 'other'
        ? params.fileName.replace(/\.[^.]+$/, '') || 'Business document'
        : params.profile.suggestedRuleIds[0]
          ? params.profile.purpose
          : params.profile.family.replace(/_/g, ' '),
    extractedTitle: titleGuess,
    extractedIssuingAuthority: authority || 'Pending review',
    extractedIssueDate: get('issue_date') || get('completion_date') || undefined,
    // Never surface expiry unless it was explicitly labeled on the document
    extractedExpiryDate: dates.expiryLabeled ? get('expiry_date') || undefined : undefined,
    expiryLabeled: dates.expiryLabeled,
    extractedReferenceNumber,
    relatedBusinessOrProduct:
      get('product_name') ||
      get('product_or_consignment') ||
      get('scope') ||
      get('activity_scope') ||
      get('subject_or_scope') ||
      undefined,
    extractedBusinessName,
    issuingCountry: get('issuing_country') || undefined,
    businessNameMatchesProfile,
  };
}

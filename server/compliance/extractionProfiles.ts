import type { DocumentCategory } from '../../src/types/compliance';

export type DocumentFamily =
  | 'business_registration'
  | 'tax'
  | 'product_certification'
  | 'import_export'
  | 'experience'
  | 'licence'
  | 'other';

export interface ExtractionFieldSpec {
  key: string;
  label: string;
  requiredHint: boolean;
  mapsTo?: string;
}

export interface ExtractionProfile {
  family: DocumentFamily;
  category: DocumentCategory;
  matchKeywords: string[];
  suggestedRuleIds: string[];
  purpose: string;
  fields: ExtractionFieldSpec[];
  promptFocus: string;
}

export const EXTRACTION_PROFILES: ExtractionProfile[] = [
  {
    family: 'business_registration',
    category: 'BUSINESS_REGISTRATION',
    matchKeywords: [
      'rdb',
      'certificate of registration',
      'certificate of incorporation',
      'enterprise registration',
      'business registration',
      'ursb',
      'brs',
    ],
    suggestedRuleIds: ['rw-reg-rdb-certificate', 'ke-reg-brs-kra', 'ug-reg-ursb-ura'],
    purpose:
      'Proves legal existence and registration of the enterprise with the competent registry.',
    fields: [
      { key: 'business_name', label: 'Registered business name', requiredHint: true, mapsTo: 'business.name' },
      { key: 'registration_number', label: 'Registration number', requiredHint: true, mapsTo: 'document.referenceNumber' },
      { key: 'legal_structure', label: 'Legal structure', requiredHint: false, mapsTo: 'profile.legalStructure' },
      { key: 'issue_date', label: 'Registration / issue date', requiredHint: false, mapsTo: 'document.issueDate' },
      { key: 'registered_address', label: 'Registered address', requiredHint: false, mapsTo: 'business.city' },
      { key: 'issuing_authority', label: 'Issuing authority', requiredHint: true, mapsTo: 'document.issuingAuthority' },
      { key: 'issuing_country', label: 'Issuing country', requiredHint: false, mapsTo: 'document.countryOfIssue' },
      { key: 'directors', label: 'Director / authorised representative', requiredHint: false },
    ],
    promptFocus:
      'Focus on company identity, registration/incorporation number, registry authority, legal form, and registered address. Do not invent a TIN unless printed.',
  },
  {
    family: 'tax',
    category: 'TAX_STATUTORY',
    matchKeywords: [
      'tin',
      'tax clearance',
      'taxpayer',
      'rra',
      'kra',
      'ura',
      'attestation',
      'tax compliance',
      'rssb',
    ],
    suggestedRuleIds: ['rw-tax-rra-tin', 'rw-tax-clearance-cert', 'rw-tax-rssb-clearance'],
    purpose: 'Supports tax registration or tax compliance status for the enterprise.',
    fields: [
      { key: 'taxpayer_name', label: 'Taxpayer name', requiredHint: true, mapsTo: 'business.name' },
      { key: 'tin', label: 'Tax identification number (TIN)', requiredHint: true, mapsTo: 'document.referenceNumber' },
      { key: 'certificate_number', label: 'Certificate / document number', requiredHint: false, mapsTo: 'document.referenceNumber' },
      { key: 'issue_date', label: 'Issue date', requiredHint: false, mapsTo: 'document.issueDate' },
      { key: 'expiry_date', label: 'Expiry date', requiredHint: false, mapsTo: 'document.expiryDate' },
      { key: 'issuing_authority', label: 'Issuing authority', requiredHint: true, mapsTo: 'document.issuingAuthority' },
      { key: 'issuing_country', label: 'Issuing country', requiredHint: false, mapsTo: 'document.countryOfIssue' },
    ],
    promptFocus:
      'Extract TIN/PIN, taxpayer name, clearance or registration certificate numbers, and validity dates only when printed.',
  },
  {
    family: 'product_certification',
    category: 'PRODUCT_CERTIFICATION',
    matchKeywords: [
      'rsb',
      's-mark',
      'iso',
      'haccp',
      'conformity',
      'certificate of analysis',
      'product certificate',
      'standardisation',
    ],
    suggestedRuleIds: [
      'rw-prod-rsb-smark',
      'rw-prod-haccp-food-safety',
      'rw-prod-iso-quality',
      'rw-prod-lab-coa',
    ],
    purpose: 'Evidences product conformity, quality, or food-safety certification.',
    fields: [
      { key: 'product_name', label: 'Product name', requiredHint: true, mapsTo: 'document.relatedProductOrScope' },
      { key: 'certification_scheme', label: 'Certification scheme / standard', requiredHint: false },
      { key: 'certificate_number', label: 'Certificate number', requiredHint: true, mapsTo: 'document.referenceNumber' },
      { key: 'issuing_authority', label: 'Issuing authority', requiredHint: true, mapsTo: 'document.issuingAuthority' },
      { key: 'issue_date', label: 'Issue date', requiredHint: false, mapsTo: 'document.issueDate' },
      { key: 'expiry_date', label: 'Expiry / validity end', requiredHint: false, mapsTo: 'document.expiryDate' },
      { key: 'scope', label: 'Certified scope', requiredHint: false, mapsTo: 'document.relatedProductOrScope' },
    ],
    promptFocus:
      'Extract product, scheme/standard, certificate number, authority, and validity. Leave blanks when not printed.',
  },
  {
    family: 'import_export',
    category: 'IMPORT_EXPORT',
    matchKeywords: [
      'certificate of origin',
      'phytosanitary',
      'veterinary',
      'export',
      'import',
      'customs',
      'naeb',
      'permit',
    ],
    suggestedRuleIds: [
      'rw-exp-eac-afcfta-coo',
      'rw-exp-phytosanitary',
      'rw-exp-veterinary',
      'rw-exp-coffee-naeb',
      'rw-exp-customs-pack',
      'rw-imp-customs-pack',
    ],
    purpose: 'Supports cross-border trade clearance, origin, or sanitary controls.',
    fields: [
      { key: 'document_number', label: 'Permit / certificate number', requiredHint: true, mapsTo: 'document.referenceNumber' },
      { key: 'exporter_importer', label: 'Exporter / importer name', requiredHint: false, mapsTo: 'business.name' },
      { key: 'product_or_consignment', label: 'Product / consignment', requiredHint: true, mapsTo: 'document.relatedProductOrScope' },
      { key: 'destination_or_origin', label: 'Destination or origin market', requiredHint: false },
      { key: 'issue_date', label: 'Issue date', requiredHint: false, mapsTo: 'document.issueDate' },
      { key: 'expiry_date', label: 'Expiry date', requiredHint: false, mapsTo: 'document.expiryDate' },
      { key: 'issuing_authority', label: 'Issuing authority', requiredHint: true, mapsTo: 'document.issuingAuthority' },
    ],
    promptFocus:
      'Extract trade document number, parties, product/consignment, destination/origin, and validity when present.',
  },
  {
    family: 'experience',
    category: 'EXPERIENCE_CREDIBILITY',
    matchKeywords: [
      'certificate of completion',
      'good performance',
      'satisfactory service',
      'client reference',
      'completion certificate',
      'delivery note',
      'purchase order',
      'contract',
    ],
    suggestedRuleIds: ['rw-cred-experience-pack'],
    purpose: 'Supports procurement credibility through delivery or performance evidence.',
    fields: [
      { key: 'client_organisation', label: 'Client / contracting organisation', requiredHint: true, mapsTo: 'experience.clientOrContractingOrg' },
      { key: 'project_title', label: 'Project / contract title', requiredHint: true, mapsTo: 'experience.projectOrContractTitle' },
      { key: 'contract_reference', label: 'Contract reference', requiredHint: false, mapsTo: 'document.referenceNumber' },
      { key: 'service_delivered', label: 'Service / works delivered', requiredHint: false, mapsTo: 'experience.natureOfDelivery' },
      { key: 'completion_date', label: 'Completion / delivery date', requiredHint: false, mapsTo: 'experience.completionDate' },
      { key: 'issue_date', label: 'Certificate issue date', requiredHint: false, mapsTo: 'document.issueDate' },
      { key: 'issuing_organisation', label: 'Issuing organisation', requiredHint: true, mapsTo: 'experience.issuingOrganisation' },
      { key: 'project_location', label: 'Project location', requiredHint: false },
      { key: 'performance_assessment', label: 'Performance assessment', requiredHint: false },
    ],
    promptFocus:
      'Extract client, project, contract reference, delivery description, dates, and issuing organisation. Do not invent performance ratings.',
  },
  {
    family: 'licence',
    category: 'SECTOR_LICENCES',
    matchKeywords: ['licence', 'license', 'permit', 'fda', 'rfda', 'eia', 'operating'],
    suggestedRuleIds: [
      'rw-sector-rfda-food-premises',
      'rw-sector-rfda-health',
      'rw-sector-eia-environmental',
      'rw-sector-construction-categorisation',
    ],
    purpose: 'Evidences sector operating authority or environmental clearance.',
    fields: [
      { key: 'licence_holder', label: 'Licence holder', requiredHint: true, mapsTo: 'business.name' },
      { key: 'licence_number', label: 'Licence / permit number', requiredHint: true, mapsTo: 'document.referenceNumber' },
      { key: 'activity_scope', label: 'Licensed activity / scope', requiredHint: false, mapsTo: 'document.relatedProductOrScope' },
      { key: 'issue_date', label: 'Issue date', requiredHint: false, mapsTo: 'document.issueDate' },
      { key: 'expiry_date', label: 'Expiry date', requiredHint: false, mapsTo: 'document.expiryDate' },
      { key: 'issuing_authority', label: 'Issuing authority', requiredHint: true, mapsTo: 'document.issuingAuthority' },
    ],
    promptFocus: 'Extract licence holder, number, scope, authority, and validity dates only when printed.',
  },
];

export function resolveExtractionProfile(input: {
  detectedType?: string;
  userDocumentType?: string;
  title?: string;
  authority?: string;
  fileName?: string;
}): ExtractionProfile {
  const hay = [
    input.detectedType,
    input.userDocumentType,
    input.title,
    input.authority,
    input.fileName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let best: ExtractionProfile | undefined;
  let bestScore = 0;
  for (const profile of EXTRACTION_PROFILES) {
    const score = profile.matchKeywords.reduce(
      (acc, kw) => (hay.includes(kw.toLowerCase()) ? acc + 1 : acc),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      best = profile;
    }
  }

  return (
    best ?? {
      family: 'other',
      category: 'PROCUREMENT_QUALIFICATION',
      matchKeywords: [],
      suggestedRuleIds: [],
      purpose: 'General business document supporting compliance or commercial evidence.',
      fields: [
        { key: 'document_title', label: 'Document title', requiredHint: true, mapsTo: 'document.title' },
        { key: 'issuing_authority', label: 'Issuing authority', requiredHint: true, mapsTo: 'document.issuingAuthority' },
        { key: 'reference_number', label: 'Reference number', requiredHint: false, mapsTo: 'document.referenceNumber' },
        { key: 'issue_date', label: 'Issue date', requiredHint: false, mapsTo: 'document.issueDate' },
        { key: 'expiry_date', label: 'Expiry date', requiredHint: false, mapsTo: 'document.expiryDate' },
        { key: 'subject_or_scope', label: 'Subject / scope', requiredHint: false, mapsTo: 'document.relatedProductOrScope' },
        { key: 'organisation_name', label: 'Organisation name', requiredHint: false, mapsTo: 'business.name' },
      ],
      promptFocus:
        'Extract only clearly printed identity, authority, reference, dates, and subject. Leave blanks when uncertain.',
    }
  );
}

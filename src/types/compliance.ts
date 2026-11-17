export type RequirementClassification =
  | 'MANDATORY'
  | 'CONDITIONAL'
  | 'BUYER-REQUIRED'
  | 'RECOMMENDED'
  | 'NOT_APPLICABLE'
  | 'NEEDS_CONFIRMATION';

export type DocumentCategory =
  | 'BUSINESS_REGISTRATION'
  | 'TAX_STATUTORY'
  | 'SECTOR_LICENCES'
  | 'PRODUCT_CERTIFICATION'
  | 'IMPORT_EXPORT'
  | 'PROCUREMENT_QUALIFICATION'
  | 'EXPERIENCE_CREDIBILITY';

export type DocumentStatus =
  | 'Missing'
  | 'Uploaded'
  | 'Pending review'
  | 'Verified'
  | 'Rejected'
  | 'Expiring soon'
  | 'Expired'
  | 'Renewal required'
  | 'Not applicable';

export type BusinessActivity =
  | 'Domestic sales'
  | 'Wholesale'
  | 'Retail'
  | 'Manufacturing'
  | 'Processing'
  | 'Distribution'
  | 'Importing'
  | 'Exporting'
  | 'Government procurement'
  | 'Private procurement'
  | 'Contract services'
  | 'International partnerships';

export type LegalStructureCode =
  | 'sole_proprietorship'
  | 'limited_company'
  | 'partnership'
  | 'cooperative'
  | 'association'
  | 'other_recognised';

export interface LegalStructureOption {
  code: LegalStructureCode;
  label: string;
  localExamples: string;
}

export interface CountryRegistryEntry {
  code: string;
  name: string;
  region:
    | 'East Africa'
    | 'West Africa'
    | 'Southern Africa'
    | 'North & Central Africa'
    | 'European Union'
    | 'International';
  tradeBlocs: string[];
  phaseCoverage: 'Phase 1 Primary' | 'Phase 2/3 Regional' | 'Destination Ruleset';
  legalStructures: LegalStructureOption[];
}

export type SourceCategory =
  | 'Regulatory'
  | 'Government Registration'
  | 'Statistical'
  | 'Trade Procedure'
  | 'Standards & Certification'
  | 'Market Intelligence';

export interface RegulatorySourceRecord {
  id: string;
  name: string;
  shortName: string;
  url: string;
  jurisdiction: string;
  sourceType: SourceCategory;
  description: string;
  integrationMethod: string;
  canEstablishLegalObligation: boolean;
  lastCheckedDate: string;
}

export interface RuleReviewEntry {
  version: string;
  reviewedAt: string;
  note: string;
}

export interface RegulatoryRuleRecord {
  id: string;
  version: string;
  jurisdiction: string;
  destinationJurisdiction?: string;
  scopeType: 'origin' | 'destination' | 'corridor' | 'procurement' | 'credibility';
  category: DocumentCategory;
  documentName: string;
  classification: RequirementClassification;
  activityTriggers: BusinessActivity[] | ['ANY'];
  industryTriggers: string[]; // ['ANY'] or normalized keyword triggers
  legalStructureTriggers?: LegalStructureCode[];
  productKeywordTriggers?: string[];
  requiresCrossBorder?: boolean;
  requiresExport?: boolean;
  requiresImport?: boolean;
  requiresProcurement?: boolean;
  requirementText: string;
  reasonText: string;
  conditionsAndLimitations: string;
  responsibleAuthority: string;
  sourceId: string;
  officialSourceUrl: string;
  applicationUrl?: string;
  documentsNeededToApply?: string[];
  validityPeriod?: string;
  renewalRequirements?: string;
  effectiveDate?: string;
  lastReviewedDate: string;
  confidence: 'High (Official Source)' | 'Medium (Conditional)' | 'Needs Official Confirmation';
  reviewHistory: RuleReviewEntry[];
}

export interface StructuredProductItem {
  id: string;
  name: string;
  category: string;
  productType:
    | 'Physical Good'
    | 'Processed Food / Beverage'
    | 'Raw Agricultural Commodity'
    | 'Industrial / Packaging Input'
    | 'Software / Digital Service'
    | 'Construction / Contracting Service'
    | 'Professional / Logistics Service';
  materialsOrIngredients?: string;
  intendedUse?: string;
  productionMethod?: string;
  capacityOrQuantity?: string;
  packagingType?: string;
  targetCustomers?: string;
  hsCode?: string;
  hsCodeConfidence?: 'Confirmed' | 'Not Established';
}

export interface BusinessRequirementsProfile {
  businessId: string;
  registrationCountry: string;
  operationCountry: string;
  establishmentCountry: string;
  legalStructure: LegalStructureCode;
  industry: string;
  activities: BusinessActivity[];
  products: StructuredProductItem[];
  targetMarkets: string[];
  buyerSpecificNotes: string;
  updatedAt: string;
}

export interface ChecklistUserAction {
  ruleId: string;
  markedNotApplicable: boolean;
  notApplicableReason?: string;
  clarificationRequested: boolean;
  clarificationNote?: string;
  updatedAt: string;
}

export interface ChecklistItem {
  ruleId: string;
  documentName: string;
  category: DocumentCategory;
  baseClassification: RequirementClassification;
  effectiveClassification: RequirementClassification;
  jurisdiction: string;
  destinationJurisdiction?: string;
  scopeLabel: 'Origin Country' | 'Destination Country' | 'Procurement / Buyer' | 'Credibility';
  relevantActivities: string[];
  relevantProducts: string[];
  reason: string;
  requirementText: string;
  conditionsAndLimitations: string;
  responsibleAuthority: string;
  sourceId: string;
  sourceName: string;
  officialSourceUrl: string;
  applicationUrl?: string;
  documentsNeededToApply: string[];
  validityPeriod?: string;
  renewalRequirements?: string;
  lastReviewedDate: string;
  confidence: RegulatoryRuleRecord['confidence'];
  status: DocumentStatus;
  linkedDocumentId?: string;
  userAction?: ChecklistUserAction;
}

export interface DocumentAiExtraction {
  detectedDocumentType: string;
  extractedTitle: string;
  extractedIssuingAuthority: string;
  extractedIssueDate?: string;
  extractedExpiryDate?: string;
  extractedReferenceNumber?: string;
  relatedBusinessOrProduct?: string;
  extractedBusinessName?: string;
  businessNameMatchesProfile: boolean;
  completenessIssues: string[];
  expiryWarnings: string[];
  flaggedForHumanReview: boolean;
  reviewFlagReasons: string[];
  disclaimer: string;
  confirmedByUser: boolean;
  analyzedAt: string;
}

export interface UploadedDocumentRecord {
  id: string;
  businessId: string;
  checklistRuleId?: string;
  documentType: string;
  category: DocumentCategory;
  title: string;
  issuingAuthority: string;
  referenceNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  countryOfIssue: string;
  relatedProductOrScope?: string;
  notes?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: DocumentStatus;
  aiAnalysis?: DocumentAiExtraction;
  uploadedAt: string;
  updatedAt: string;
}

export type ExperienceEvidenceType =
  | 'Certificate of Completion'
  | 'Certificate of Good Performance'
  | 'Satisfactory Service Delivery Certificate'
  | 'Client Reference Letter'
  | 'Project Completion Report'
  | 'Contract Award'
  | 'Delivery and Acceptance Note';

export interface ExperienceEvidenceRecord {
  id: string;
  businessId: string;
  evidenceType: ExperienceEvidenceType;
  clientOrContractingOrg: string;
  projectOrContractTitle: string;
  sector: string;
  contractPeriod: string;
  completionDate: string;
  natureOfDelivery: string;
  issuingOrganisation: string;
  supportingFileName?: string;
  supportingMimeType?: string;
  supportingFileSizeBytes?: number;
  verificationStatus: 'Uploaded (Unverified)' | 'Pending review' | 'Verified';
  publicDisplay: boolean;
  confidentialityConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceReadinessSummary {
  totalApplicableItems: number;
  mandatoryCount: number;
  conditionalCount: number;
  buyerRequiredCount: number;
  recommendedCount: number;
  needsConfirmationCount: number;
  missingCount: number;
  uploadedCount: number;
  pendingReviewCount: number;
  verifiedCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  notApplicableCount: number;
  pendingClarificationCount: number;
  experienceRecordsCount: number;
  checklistCompletenessPercent: number;
  completenessExplanation: string;
}

export interface ComplianceWorkspacePayload {
  countryRegistry: CountryRegistryEntry[];
  sourceRegistry: RegulatorySourceRecord[];
  rulesCatalogCount: number;
  rulesLastReviewed: string;
  requirementsProfile: BusinessRequirementsProfile;
  checklist: ChecklistItem[];
  readinessSummary: ComplianceReadinessSummary;
  documents: UploadedDocumentRecord[];
  experienceRecords: ExperienceEvidenceRecord[];
}

export interface ComplianceAssistantResponse {
  answerSummary: string;
  country: string;
  relevantBusinessActivity: string;
  requirementClassification: RequirementClassification;
  importantLimitations: string;
  lastCheckedDate: string;
  citations: Array<{
    sourceName: string;
    officialUrl: string;
    sourceType: SourceCategory;
  }>;
  actionableSteps: string[];
  needsOfficialConfirmation: boolean;
}

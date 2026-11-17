import type { RegulatoryRuleRecord } from '../../src/types/compliance';

export const REGULATORY_RULES_VERSION = '2026.11-Phase1-2';
export const REGULATORY_RULES_LAST_REVIEWED = '2026-11-01';

export const REGULATORY_RULES: RegulatoryRuleRecord[] = [
  // =========================================================================
  // A. BUSINESS REGISTRATION (RWANDA + EXTENSIBLE JURISDICTIONS)
  // =========================================================================
  {
    id: 'rw-reg-rdb-certificate',
    version: '1.2',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'BUSINESS_REGISTRATION',
    documentName: 'RDB Business Registration Certificate (Certificate of Incorporation / Enterprise Registration)',
    classification: 'MANDATORY',
    activityTriggers: ['ANY'],
    industryTriggers: ['ANY'],
    legalStructureTriggers: ['limited_company', 'sole_proprietorship', 'partnership', 'other_recognised'],
    requirementText:
      'Every commercial enterprise operating in Rwanda must hold a valid Business Registration Certificate issued by the Office of the Registrar General at the Rwanda Development Board (RDB).',
    reasonText:
      'Establishes legal existence, unique enterprise registration code, registered office, and authorised signatories in Rwanda.',
    conditionsAndLimitations:
      'Specific form varies by structure (Certificate of Incorporation for Limited Companies vs Enterprise Registration Certificate for sole proprietorships).',
    responsibleAuthority: 'Rwanda Development Board — Office of the Registrar General (ORG)',
    sourceId: 'rw_rdb_org',
    officialSourceUrl: 'https://org.rdb.rw/',
    applicationUrl: 'https://org.rdb.rw/',
    documentsNeededToApply: [
      'National ID or Passport of founder(s)/directors',
      'Company name reservation & business activity codes',
      'Registered physical address in Rwanda',
    ],
    validityPeriod: 'Valid indefinitely while entity remains active and files annual returns',
    renewalRequirements: 'File annual returns and update changes in shareholding or directorship via RDB ORG.',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-09-15', note: 'Initial RDB ORG baseline verification.' },
      { version: '1.2', reviewedAt: '2026-11-01', note: 'Confirmed alignment with org.rdb.rw electronic registry.' },
    ],
  },
  {
    id: 'rw-reg-articles-association',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'BUSINESS_REGISTRATION',
    documentName: 'Memorandum & Articles of Association / Company Governance Filing',
    classification: 'CONDITIONAL',
    activityTriggers: ['ANY'],
    industryTriggers: ['ANY'],
    legalStructureTriggers: ['limited_company'],
    requirementText:
      'Limited companies in Rwanda maintain Memorandum/Articles of Association (or standard statutory articles selected at incorporation) defining share capital, shareholder rights, and director powers.',
    reasonText:
      'Commonly required for corporate banking, tender pre-qualification, joint ventures, and export licensing verification.',
    conditionsAndLimitations:
      'Applies specifically to limited companies; sole proprietorships do not have Articles of Association.',
    responsibleAuthority: 'Rwanda Development Board — Office of the Registrar General (ORG)',
    sourceId: 'rw_rdb_org',
    officialSourceUrl: 'https://org.rdb.rw/',
    documentsNeededToApply: ['Incorporation application via RDB ORG', 'Shareholder & director identification'],
    validityPeriod: 'Valid unless amended by special resolution filed with ORG',
    renewalRequirements: 'File any constitutional amendments with the Registrar General.',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Scoped conditionally to limited companies.' },
    ],
  },
  {
    id: 'rw-reg-cooperative-cert',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'BUSINESS_REGISTRATION',
    documentName: 'Cooperative Legal Personality / Registration Certificate',
    classification: 'MANDATORY',
    activityTriggers: ['ANY'],
    industryTriggers: ['ANY'],
    legalStructureTriggers: ['cooperative'],
    requirementText:
      'Cooperatives operating in Rwanda must hold official registration granting legal personality under national cooperative law.',
    reasonText:
      'Required to open cooperative bank accounts, sign bulk supply contracts, and apply for agricultural or processing permits.',
    conditionsAndLimitations:
      'Applies specifically when business legal structure is selected as Cooperative.',
    responsibleAuthority: 'Rwanda Cooperative Agency (RCA) / RDB Registry',
    sourceId: 'rw_rdb_org',
    officialSourceUrl: 'https://org.rdb.rw/',
    documentsNeededToApply: [
      'Cooperative founding assembly minutes & bylaws',
      'Member register & committee list',
      'Sector cooperative recommendation',
    ],
    validityPeriod: 'Valid subject to statutory cooperative compliance',
    renewalRequirements: 'Maintain annual general assembly filings and cooperative audit compliance.',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Verified cooperative registration requirement.' },
    ],
  },

  // =========================================================================
  // B. TAX & STATUTORY COMPLIANCE (RWANDA)
  // =========================================================================
  {
    id: 'rw-tax-rra-tin',
    version: '1.1',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'TAX_STATUTORY',
    documentName: 'RRA Taxpayer Identification Number (TIN) Registration',
    classification: 'MANDATORY',
    activityTriggers: ['ANY'],
    industryTriggers: ['ANY'],
    requirementText:
      'All revenue-generating enterprises in Rwanda must be registered with the Rwanda Revenue Authority (RRA) and hold an active TIN (issued alongside RDB enterprise registration).',
    reasonText:
      'Required for issuing EBM tax invoices, customs clearance, statutory tax declarations, and formal B2B invoicing.',
    conditionsAndLimitations:
      'VAT registration becomes additionally mandatory only above statutory annual turnover thresholds.',
    responsibleAuthority: 'Rwanda Revenue Authority (RRA)',
    sourceId: 'rw_rra',
    officialSourceUrl: 'https://www.rra.gov.rw/',
    applicationUrl: 'https://www.rra.gov.rw/',
    documentsNeededToApply: ['RDB Registration Certificate / National ID', 'Business contact & bank details'],
    validityPeriod: 'Permanent while enterprise remains tax-active',
    renewalRequirements: 'File periodic tax returns (CIT/PIT, PAYE, and VAT if VAT-registered) on schedule.',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Confirmed with RRA taxpayer registration framework.' },
    ],
  },
  {
    id: 'rw-tax-clearance-cert',
    version: '1.1',
    jurisdiction: 'Rwanda',
    scopeType: 'procurement',
    category: 'TAX_STATUTORY',
    documentName: 'RRA Tax Clearance Certificate (Attestation de Non-Créance)',
    classification: 'CONDITIONAL',
    activityTriggers: ['Government procurement', 'Private procurement', 'Exporting', 'Importing'],
    industryTriggers: ['ANY'],
    requirementText:
      'Confirms the enterprise has no overdue tax arrears with the Rwanda Revenue Authority at the date of issue.',
    reasonText:
      'Mandatory for participating in public tenders (Umucyo/RPPA), frequently requested by institutional buyers, and required for certain trade/licence renewals.',
    conditionsAndLimitations:
      'Conditional on tender participation, buyer pre-qualification, or specific statutory licensing triggers rather than daily domestic retail.',
    responsibleAuthority: 'Rwanda Revenue Authority (RRA)',
    sourceId: 'rw_rra',
    officialSourceUrl: 'https://www.rra.gov.rw/',
    applicationUrl: 'https://www.rra.gov.rw/',
    documentsNeededToApply: ['Active RRA TIN', 'Up-to-date tax filings and zero unpaid arrears'],
    validityPeriod: 'Time-limited (typically valid for 3 months or as stated on the certificate)',
    renewalRequirements: 'Re-apply online via RRA E-Tax / MyRRA upon expiry.',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Classified CONDITIONAL for tenders/trade.' },
    ],
  },
  {
    id: 'rw-tax-rssb-clearance',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'TAX_STATUTORY',
    documentName: 'RSSB Employer Registration & Social Security Clearance Certificate',
    classification: 'CONDITIONAL',
    activityTriggers: ['Government procurement', 'Contract services', 'Manufacturing', 'Processing'],
    industryTriggers: ['ANY'],
    requirementText:
      'Enterprises employing staff in Rwanda must register with the Rwanda Social Security Board (RSSB) and remit pension/occupational hazard/maternity contributions.',
    reasonText:
      'RSSB good-standing clearance is required for public procurement tenders and often requested during corporate vendor onboarding.',
    conditionsAndLimitations:
      'Applies when the enterprise has salaried employees or bids on public/corporate service tenders.',
    responsibleAuthority: 'Rwanda Social Security Board (RSSB)',
    sourceId: 'rw_rppa',
    officialSourceUrl: 'https://www.umucyo.gov.rw/',
    documentsNeededToApply: ['RDB Registration Certificate', 'Employee payroll declarations'],
    validityPeriod: 'Periodic clearance certificate as issued by RSSB',
    renewalRequirements: 'Maintain monthly RSSB contribution filings.',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Linked to statutory employer and Umucyo tender rules.' },
    ],
  },

  // =========================================================================
  // C. SECTOR LICENCES & PERMITS (STRICTLY ACTIVITY & SECTOR SCOPED)
  // =========================================================================
  {
    id: 'rw-sector-rfda-food-premises',
    version: '1.1',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'SECTOR_LICENCES',
    documentName: 'Rwanda FDA Food / Beverage Manufacturing & Premises Operating Licence',
    classification: 'MANDATORY',
    activityTriggers: ['Manufacturing', 'Processing', 'Wholesale', 'Exporting', 'Importing'],
    industryTriggers: ['Food processing', 'Agriculture', 'Agro-Processing', 'Beverage', 'Food'],
    productKeywordTriggers: ['food', 'coffee', 'tea', 'honey', 'juice', 'flour', 'oil', 'snack', 'packaged food', 'dairy', 'beverage', 'spice'],
    requirementText:
      'Premises processing, manufacturing, packaging, storing, or wholesale-distributing regulated processed food or beverage products in Rwanda require Rwanda FDA premises licensing and product notification/registration.',
    reasonText:
      'Verifies food hygiene, facility Good Manufacturing Practice (GMP), and consumer safety compliance.',
    conditionsAndLimitations:
      'Does not apply to non-food sectors (e.g. ICT software, construction hardware). Unprocessed primary farm produce follows MINAGRI/RALIS phytosanitary rules.',
    responsibleAuthority: 'Rwanda Food and Drugs Authority (Rwanda FDA)',
    sourceId: 'rw_fda',
    officialSourceUrl: 'https://rwandafda.gov.rw/',
    applicationUrl: 'https://rwandafda.gov.rw/',
    documentsNeededToApply: [
      'RDB Registration Certificate',
      'Facility floor plan & hygiene/GMP SOPs',
      'Qualified food safety / technical personnel credentials',
    ],
    validityPeriod: 'Subject to periodic Rwanda FDA inspection & renewal schedule',
    renewalRequirements: 'Apply for annual/periodic premises licence renewal and facility inspection.',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Scoped strictly to processed food/beverage premises.' },
    ],
  },
  {
    id: 'rw-sector-rfda-health',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'SECTOR_LICENCES',
    documentName: 'Rwanda FDA Pharmaceutical / Medical Device / Healthcare Operating Licence',
    classification: 'MANDATORY',
    activityTriggers: ['ANY'],
    industryTriggers: ['Healthcare', 'Pharmaceutical', 'Medical'],
    productKeywordTriggers: ['medicine', 'pharmaceutical', 'medical', 'diagnostic', 'health'],
    requirementText:
      'Entities manufacturing, importing, wholesaling, or retailing pharmaceuticals, medical devices, or regulated health products require Rwanda FDA licensing and product registration.',
    reasonText:
      'Legal prerequisite to distribute or import regulated healthcare products in Rwanda.',
    conditionsAndLimitations: 'Applies exclusively to healthcare, pharmaceutical, and medical device operators.',
    responsibleAuthority: 'Rwanda Food and Drugs Authority (Rwanda FDA)',
    sourceId: 'rw_fda',
    officialSourceUrl: 'https://rwandafda.gov.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Healthcare sector baseline rule.' },
    ],
  },
  {
    id: 'rw-sector-eia-environmental',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'SECTOR_LICENCES',
    documentName: 'Environmental Impact Assessment (EIA) Certificate / Environmental Clearance',
    classification: 'CONDITIONAL',
    activityTriggers: ['Manufacturing', 'Processing', 'Contract services'],
    industryTriggers: ['Manufacturing', 'Mining', 'Construction', 'Industrial Packaging', 'Chemical'],
    requirementText:
      'Industrial plants, processing factories, construction works, and mining projects listed under Rwanda EIA thresholds must obtain an EIA Certificate prior to industrial operation.',
    reasonText:
      'Demonstrates environmental and waste-management compliance required for industrial permits and institutional financing.',
    conditionsAndLimitations:
      'Conditional on project scale and environmental category thresholds under REMA/RDB regulations; light office-based ICT or micro-trading typically does not trigger full EIA.',
    responsibleAuthority: 'Rwanda Development Board (RDB) / Rwanda Environment Management Authority (REMA)',
    sourceId: 'rw_rdb_org',
    officialSourceUrl: 'https://org.rdb.rw/',
    documentsNeededToApply: ['Project brief / Environmental Impact Study prepared by registered EIA expert'],
    lastReviewedDate: '2026-11-01',
    confidence: 'Medium (Conditional)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Classified CONDITIONAL on project scale thresholds.' },
    ],
  },
  {
    id: 'rw-sector-construction-categorisation',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'SECTOR_LICENCES',
    documentName: 'Contractor Categorisation / Construction Practice Registration',
    classification: 'NEEDS_CONFIRMATION',
    activityTriggers: ['Contract services', 'Government procurement', 'Private procurement'],
    industryTriggers: ['Construction', 'Construction & Materials', 'Engineering'],
    requirementText:
      'Civil works contractors and engineering firms bidding on public or regulated construction projects in Rwanda typically require valid contractor categorisation/registration.',
    reasonText:
      'Determines eligible tender contract value classes and technical qualification standing.',
    conditionsAndLimitations:
      'Exact classification band (Class A–F) depends on firm turnover, equipment, and registered engineers. Confirm current categorisation schedule with RHA/RPPA.',
    responsibleAuthority: 'Rwanda Housing Authority (RHA) / RPPA',
    sourceId: 'rw_rppa',
    officialSourceUrl: 'https://www.umucyo.gov.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'Needs Official Confirmation',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Flagged NEEDS_CONFIRMATION for exact contractor class thresholds.' },
    ],
  },

  // =========================================================================
  // D. PRODUCT CERTIFICATION & QUALITY
  // =========================================================================
  {
    id: 'rw-prod-rsb-smark',
    version: '1.2',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'PRODUCT_CERTIFICATION',
    documentName: 'Rwanda Standards Board (RSB) S-Mark Standardisation Certificate',
    classification: 'CONDITIONAL',
    activityTriggers: ['Manufacturing', 'Processing', 'Wholesale', 'Retail', 'Exporting'],
    industryTriggers: ['Food processing', 'Manufacturing', 'Industrial Packaging', 'Construction & Materials', 'Agro-Processing'],
    productKeywordTriggers: ['food', 'beverage', 'water', 'juice', 'flour', 'oil', 'cement', 'steel', 'cosmetic', 'packaging', 'honey', 'dairy'],
    requirementText:
      'Products falling under Rwanda mandatory national standards (especially processed foods, beverages, cosmetics, and regulated construction materials) require RSB S-Mark certification before placing on the market.',
    reasonText:
      'Certifies product conformity to Rwandan/EAC harmonized standards and enables regional EAC mutual recognition.',
    conditionsAndLimitations:
      'Mandatory only for products covered by compulsory Rwandan standards; voluntary/recommended for non-regulated goods. Never applies to pure software/consulting services.',
    responsibleAuthority: 'Rwanda Standards Board (RSB)',
    sourceId: 'rw_rsb',
    officialSourceUrl: 'https://www.rsb.gov.rw/',
    applicationUrl: 'https://www.rsb.gov.rw/',
    documentsNeededToApply: [
      'RDB Registration Certificate',
      'Quality management procedures & factory inspection readiness',
      'Product laboratory test samples',
    ],
    validityPeriod: 'Issued with annual surveillance audit / renewal requirements',
    renewalRequirements: 'Annual surveillance audit and periodic sample testing by RSB.',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.2', reviewedAt: '2026-11-01', note: 'Clarified compulsory vs voluntary RSB S-Mark applicability.' },
    ],
  },
  {
    id: 'rw-prod-haccp-food-safety',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'PRODUCT_CERTIFICATION',
    documentName: 'HACCP / ISO 22000 Food Safety Management System Evidence',
    classification: 'RECOMMENDED',
    activityTriggers: ['Manufacturing', 'Processing', 'Exporting', 'Private procurement'],
    industryTriggers: ['Food processing', 'Agro-Processing', 'Agriculture'],
    productKeywordTriggers: ['food', 'coffee', 'tea', 'beverage', 'packaging', 'shea', 'oil', 'honey'],
    requirementText:
      'Structured Hazard Analysis and Critical Control Points (HACCP) or ISO 22000 food safety documentation for food processors and food-contact packaging producers.',
    reasonText:
      'Widely requested by regional supermarket procurement teams, FMCG buyers, and international export importers to demonstrate systematic food safety control.',
    conditionsAndLimitations:
      'Classified RECOMMENDED unless specifically mandated by a buyer contract (BUYER-REQUIRED) or EU high-risk food import rule.',
    responsibleAuthority: 'Rwanda Standards Board (RSB) / Accredited Certification Bodies',
    sourceId: 'rw_rsb',
    officialSourceUrl: 'https://www.rsb.gov.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Positioned accurately as RECOMMENDED unless buyer-contracted.' },
    ],
  },
  {
    id: 'rw-prod-iso-quality',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'PRODUCT_CERTIFICATION',
    documentName: 'ISO 9001 Quality Management / Sector ISO Certification',
    classification: 'RECOMMENDED',
    activityTriggers: ['Manufacturing', 'Exporting', 'Private procurement', 'Government procurement', 'International partnerships'],
    industryTriggers: ['Manufacturing', 'Industrial Packaging', 'ICT and software', 'Construction & Materials', 'Transportation and logistics'],
    requirementText:
      'Independent ISO quality or information security certification (such as ISO 9001 or ISO/IEC 27001 for software providers).',
    reasonText:
      'Strengthens buyer confidence during enterprise vendor qualification and cross-border contracting.',
    conditionsAndLimitations:
      'Not a universal legal requirement to trade in Rwanda; purely RECOMMENDED unless stipulated inside a specific tender specification.',
    responsibleAuthority: 'Rwanda Standards Board (RSB) / Accredited ISO Registrars',
    sourceId: 'rw_rsb',
    officialSourceUrl: 'https://www.rsb.gov.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Explicitly marked RECOMMENDED, never legal mandate.' },
    ],
  },
  {
    id: 'rw-prod-lab-coa',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'PRODUCT_CERTIFICATION',
    documentName: 'Batch Laboratory Test Report / Certificate of Analysis (CoA)',
    classification: 'CONDITIONAL',
    activityTriggers: ['Manufacturing', 'Processing', 'Exporting', 'Private procurement'],
    industryTriggers: ['Food processing', 'Agro-Processing', 'Industrial Packaging', 'Healthcare', 'Manufacturing'],
    productKeywordTriggers: ['food', 'coffee', 'tea', 'honey', 'oil', 'shea', 'packaging', 'beverage', 'chemical'],
    requirementText:
      'Laboratory test report confirming moisture, microbiological, contaminant, or food-contact migration parameters for manufactured or processed batches.',
    reasonText:
      'Required for RSB conformity assessment, Rwanda FDA registration, and buyer lot acceptance.',
    conditionsAndLimitations:
      'Applies to physical goods undergoing standards testing, food/agricultural safety checks, or buyer QA inspection.',
    responsibleAuthority: 'Rwanda Standards Board (RSB) Testing Laboratories / Accredited Labs',
    sourceId: 'rw_rsb',
    officialSourceUrl: 'https://www.rsb.gov.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Added batch CoA requirement.' },
    ],
  },

  // =========================================================================
  // E. IMPORT & EXPORT DOCUMENTS (ORIGIN RWANDA + DESTINATION SPECIFICS)
  // =========================================================================
  {
    id: 'rw-exp-customs-pack',
    version: '1.2',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'IMPORT_EXPORT',
    documentName: 'Export Customs Clearance Pack (Commercial Invoice, Packing List & Customs Declaration)',
    classification: 'MANDATORY',
    activityTriggers: ['Exporting'],
    industryTriggers: ['ANY'],
    requiresExport: true,
    requirementText:
      'Every commercial export shipment leaving Rwanda must be declared through the Rwanda Electronic Single Window (ReSW / ASYCUDA) supported by a Commercial Invoice, Packing List, and transport document (Road Consignment Note / CMR, Airway Bill, or Bill of Lading).',
    reasonText:
      'Core customs clearance documentation required at Rwanda border posts and Kigali International Airport.',
    conditionsAndLimitations:
      'Digital software/remote services exported electronically without physical goods follow service contract & tax invoicing rules rather than physical customs declarations.',
    responsibleAuthority: 'Rwanda Revenue Authority — Customs Department (ReSW)',
    sourceId: 'rw_trade_portal',
    officialSourceUrl: 'https://rwandatrade.rw/',
    applicationUrl: 'https://rwandatrade.rw/',
    documentsNeededToApply: [
      'Active RRA TIN',
      'Commercial Invoice & Packing List',
      'Licensed Clearing Agent customs entry (or Simplified Declaration under EAC threshold)',
    ],
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.2', reviewedAt: '2026-11-01', note: 'Verified against Rwanda Trade Portal export procedures.' },
    ],
  },
  {
    id: 'rw-imp-customs-pack',
    version: '1.1',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'IMPORT_EXPORT',
    documentName: 'Import Customs Declaration, Commercial Invoice, Packing List & Import Permit (Where Regulated)',
    classification: 'MANDATORY',
    activityTriggers: ['Importing'],
    industryTriggers: ['ANY'],
    requiresImport: true,
    requirementText:
      'Importing physical commercial goods into Rwanda requires customs entry via Rwanda Electronic Single Window with Commercial Invoice, Packing List, freight bill, and agency import permits where goods are regulated (e.g., food/medicines via Rwanda FDA or plants via RALIS).',
    reasonText:
      'Establishes customs valuation, tariff classification, and regulatory release at Rwanda customs.',
    conditionsAndLimitations:
      'Pre-import permits apply specifically to controlled/regulated goods (food, pharmaceuticals, agricultural inputs, chemicals).',
    responsibleAuthority: 'Rwanda Revenue Authority — Customs & Sector Regulatory Agencies',
    sourceId: 'rw_trade_portal',
    officialSourceUrl: 'https://rwandatrade.rw/',
    applicationUrl: 'https://rwandatrade.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Verified against rwandatrade.rw import steps.' },
    ],
  },
  {
    id: 'rw-exp-eac-afcfta-coo',
    version: '1.1',
    jurisdiction: 'Rwanda',
    scopeType: 'corridor',
    category: 'IMPORT_EXPORT',
    documentName: 'Certificate of Origin (EAC / COMESA / AfCFTA Preferential Origin)',
    classification: 'CONDITIONAL',
    activityTriggers: ['Exporting'],
    industryTriggers: ['ANY'],
    requiresExport: true,
    requiresCrossBorder: true,
    requirementText:
      'Official Certificate of Origin issued by Rwanda Revenue Authority Customs (or Simplified Certificate of Origin for eligible small EAC consignments) certifying qualifying origin under EAC, COMESA, or AfCFTA rules.',
    reasonText:
      'Unlocks preferential or duty-free tariff treatment in partner EAC/AfCFTA destination countries.',
    conditionsAndLimitations:
      'Conditional on goods meeting origin criteria and the exporter seeking preferential tariff treatment in an EAC, COMESA, or AfCFTA partner state.',
    responsibleAuthority: 'Rwanda Revenue Authority — Customs Rules of Origin Office',
    sourceId: 'reg_eac',
    officialSourceUrl: 'https://www.eac.int/',
    applicationUrl: 'https://rwandatrade.rw/',
    documentsNeededToApply: [
      'RDB Registration & TIN',
      'Bill of Materials / Production Cost Statement proving origin',
      'Commercial Invoice & Packing List',
    ],
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Linked to EAC & AfCFTA Rules of Origin.' },
    ],
  },
  {
    id: 'rw-exp-phytosanitary',
    version: '1.1',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'IMPORT_EXPORT',
    documentName: 'Phytosanitary Certificate (Plant & Fresh Produce Exports)',
    classification: 'CONDITIONAL',
    activityTriggers: ['Exporting'],
    industryTriggers: ['Agriculture', 'Agro-Processing', 'Food processing'],
    productKeywordTriggers: ['coffee', 'tea', 'avocado', 'produce', 'horticulture', 'fruit', 'vegetable', 'grain', 'bean', 'maize', 'flower', 'seed', 'plant'],
    requiresExport: true,
    requirementText:
      'Official Phytosanitary Certificate confirming plant-origin consignments are free from quarantine pests and meet the importing country’s plant health conditions.',
    reasonText:
      'Legally required at border exit and destination import inspection for fresh agricultural produce, green coffee beans, grains, and plant materials.',
    conditionsAndLimitations:
      'Applies only to plants, fresh produce, grains, green coffee, and unprocessed botanical exports—does not apply to non-plant manufactured goods or services.',
    responsibleAuthority: 'Rwanda Agriculture and Animal Resources Development Board / RALIS (MINAGRI)',
    sourceId: 'rw_trade_portal',
    officialSourceUrl: 'https://rwandatrade.rw/',
    applicationUrl: 'https://rwandatrade.rw/',
    documentsNeededToApply: [
      'Import permit from destination country plant health authority (where required)',
      'Consignment inspection request & Commercial Invoice',
    ],
    validityPeriod: 'Consignment-specific (valid for shipment window)',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Verified against Rwanda Trade Portal agricultural export steps.' },
    ],
  },
  {
    id: 'rw-exp-coffee-naeb',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'IMPORT_EXPORT',
    documentName: 'Coffee / Tea Export Licence & Quality Grading Certificate (NAEB)',
    classification: 'CONDITIONAL',
    activityTriggers: ['Exporting'],
    industryTriggers: ['Agriculture', 'Agro-Processing', 'Food processing'],
    productKeywordTriggers: ['coffee', 'tea', 'horticulture'],
    requiresExport: true,
    requirementText:
      'Commercial exporters of Rwandan coffee, tea, or regulated cash-crop horticulture consignments require National Agricultural Export Development Board (NAEB) exporter registration and export permit/quality clearance.',
    reasonText:
      'Authorises commercial export clearance and grade/origin verification for Rwandan coffee and tea lots.',
    conditionsAndLimitations: 'Triggered specifically when exporting coffee, tea, or NAEB-regulated agricultural commodities.',
    responsibleAuthority: 'National Agricultural Export Development Board (NAEB)',
    sourceId: 'rw_trade_portal',
    officialSourceUrl: 'https://rwandatrade.rw/',
    applicationUrl: 'https://rwandatrade.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Commodity-specific NAEB coffee/tea export rule.' },
    ],
  },
  {
    id: 'rw-exp-veterinary',
    version: '1.0',
    jurisdiction: 'Rwanda',
    scopeType: 'origin',
    category: 'IMPORT_EXPORT',
    documentName: 'Veterinary Health Certificate (Animal & Animal-Origin Exports)',
    classification: 'CONDITIONAL',
    activityTriggers: ['Exporting'],
    industryTriggers: ['Agriculture', 'Food processing', 'Agro-Processing'],
    productKeywordTriggers: ['meat', 'dairy', 'milk', 'cheese', 'honey', 'leather', 'hides', 'livestock', 'poultry', 'fish'],
    requiresExport: true,
    requirementText:
      'Consignments of animal products (dairy, meat, honey, hides/skins, fish) require veterinary inspection and a Veterinary Health Certificate prior to export.',
    reasonText:
      'Mandatory sanitary clearance for cross-border movement of animal-origin products.',
    conditionsAndLimitations:
      'Applies only when products contain or derive from animal inputs; inapplicable to plant-only or non-agricultural businesses.',
    responsibleAuthority: 'Rwanda Agriculture and Animal Resources Development Board (RAB) / RALIS',
    sourceId: 'rw_trade_portal',
    officialSourceUrl: 'https://rwandatrade.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Scoped to animal-origin products.' },
    ],
  },

  // =========================================================================
  // DESTINATION COUNTRY REQUIREMENTS (SEPARATED BY DESTINATION JURISDICTION)
  // =========================================================================
  {
    id: 'dest-ke-import-conformity',
    version: '1.1',
    jurisdiction: 'Kenya',
    destinationJurisdiction: 'Kenya',
    scopeType: 'destination',
    category: 'IMPORT_EXPORT',
    documentName: 'Kenya Destination Import Clearance: KEBS Standards Conformity / KEPHIS Import Permit',
    classification: 'CONDITIONAL',
    activityTriggers: ['Exporting', 'Distribution'],
    industryTriggers: ['ANY'],
    requiresExport: true,
    requiresCrossBorder: true,
    requirementText:
      'Exports entering Kenya must satisfy Kenyan destination requirements: EAC-harmonised S-Mark / KEBS Certificate of Conformity (PVoC) for manufactured goods, plus a KEPHIS Plant Import Permit obtained by the Kenyan buyer prior to shipment for agricultural/fresh produce.',
    reasonText:
      'Origin-country certificates alone do not authorise Kenyan customs release unless covered under EAC mutual recognition or pre-shipment KEPHIS/KEBS approval.',
    conditionsAndLimitations:
      'Exact permit depends on whether cargo is processed manufactured goods (KEBS) vs fresh produce/plants (KEPHIS) vs registered food/pharma.',
    responsibleAuthority: 'Kenya Bureau of Standards (KEBS) & KEPHIS (coordinated via KenTrade)',
    sourceId: 'ke_kebs_kentrade',
    officialSourceUrl: 'https://infotradekenya.go.ke/',
    applicationUrl: 'https://infotradekenya.go.ke/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Separated explicitly as Kenya destination requirement.' },
    ],
  },
  {
    id: 'dest-ug-import-conformity',
    version: '1.0',
    jurisdiction: 'Uganda',
    destinationJurisdiction: 'Uganda',
    scopeType: 'destination',
    category: 'IMPORT_EXPORT',
    documentName: 'Uganda Destination Clearance: UNBS Conformity & MAAIF Phytosanitary Import Permit',
    classification: 'CONDITIONAL',
    activityTriggers: ['Exporting', 'Distribution'],
    industryTriggers: ['ANY'],
    requiresExport: true,
    requiresCrossBorder: true,
    requirementText:
      'Goods destined for Uganda require UNBS standards clearance (or valid EAC mutual-recognition S-Mark) for manufactured products, and MAAIF import permit clearance for agricultural consignments.',
    reasonText:
      'Prevents border holds at Gatuna / Mirama Hills customs posts when entering the Ugandan market.',
    conditionsAndLimitations:
      'Origin-country RSB S-Mark helps under EAC mutual recognition only for goods accompanied by a valid EAC Certificate of Origin and conforming labelling.',
    responsibleAuthority: 'Uganda National Bureau of Standards (UNBS) & MAAIF',
    sourceId: 'ug_unbs_ursb',
    officialSourceUrl: 'https://ugandatrades.go.ug/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Added Uganda destination ruleset.' },
    ],
  },
  {
    id: 'dest-eu-import-compliance',
    version: '1.1',
    jurisdiction: 'European Union',
    destinationJurisdiction: 'European Union',
    scopeType: 'destination',
    category: 'IMPORT_EXPORT',
    documentName: 'EU Destination Compliance: TRACES Phytosanitary / Food Safety MRLs & EUDR Geolocation Due Diligence',
    classification: 'CONDITIONAL',
    activityTriggers: ['Exporting'],
    industryTriggers: ['Agriculture', 'Food processing', 'Agro-Processing', 'Manufacturing'],
    requiresExport: true,
    requiresCrossBorder: true,
    requirementText:
      'Exporting food or agricultural commodities to the European Union triggers strict EU destination requirements: EU TRACES NT electronic phytosanitary/health pre-notification, EU Maximum Residue Limits (MRL) lab testing, EBA/REX registered exporter origin proof, and EU Deforestation Regulation (EUDR) plot geolocation due diligence for coffee/cocoa/timber.',
    reasonText:
      'Rwandan domestic certificates (such as RSB S-Mark or Rwanda FDA approval) do NOT substitute for EU food safety, TRACES phytosanitary, or EUDR compliance.',
    conditionsAndLimitations:
      'EUDR applies specifically to covered commodities (e.g., coffee, cocoa, soy, wood); non-agricultural exports follow EU CE marking / REACH rules where applicable.',
    responsibleAuthority: 'European Commission (DG SANTE / TRACES NT / EU Member State Customs)',
    sourceId: 'eu_access2markets',
    officialSourceUrl: 'https://trade.ec.europa.eu/access-to-markets/en/home',
    applicationUrl: 'https://trade.ec.europa.eu/access-to-markets/en/home',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Distinguished EU destination rules from Rwanda origin rules.' },
    ],
  },

  // =========================================================================
  // F. PROCUREMENT & SUPPLIER QUALIFICATION (TENDER / BUYER SPECIFIC)
  // =========================================================================
  {
    id: 'rw-proc-tender-pack',
    version: '1.1',
    jurisdiction: 'Rwanda',
    scopeType: 'procurement',
    category: 'PROCUREMENT_QUALIFICATION',
    documentName: 'Public / Corporate Tender Qualification Pack (Umucyo Registration, Financial Statements, Bid Security & Manufacturer Authorisation)',
    classification: 'BUYER-REQUIRED',
    activityTriggers: ['Government procurement', 'Private procurement', 'Contract services'],
    industryTriggers: ['ANY'],
    requiresProcurement: true,
    requirementText:
      'Participating in public tenders via Rwanda Umucyo e-Procurement or structured corporate RFPs typically requires tender-specific qualification records: Umucyo supplier registration, RRA Tax Clearance, RSSB Clearance, audited/certified financial statements, bid security, and Manufacturer Authorisation (when supplying third-party equipment).',
    reasonText:
      'Required per specific solicitation or buyer pre-qualification package—these are tender-specific rather than universal legal licences to operate privately.',
    conditionsAndLimitations:
      'Exact list varies by tender document; bid security and manufacturer authorisation only apply when specified in the Request for Proposals / Bidding Document.',
    responsibleAuthority: 'Rwanda Public Procurement Authority (RPPA / Umucyo) or Procuring Buyer',
    sourceId: 'rw_rppa',
    officialSourceUrl: 'https://www.umucyo.gov.rw/',
    applicationUrl: 'https://www.umucyo.gov.rw/',
    documentsNeededToApply: [
      'RDB Business Registration Certificate',
      'Valid RRA Tax Clearance & RSSB Clearance',
      'Signed Financial Statements / Experience Certificates',
    ],
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.1', reviewedAt: '2026-11-01', note: 'Classified strictly BUYER-REQUIRED / tender-specific.' },
    ],
  },

  // =========================================================================
  // G. COMMERCIAL EXPERIENCE & BUSINESS CREDIBILITY
  // =========================================================================
  {
    id: 'cred-experience-completion',
    version: '1.0',
    jurisdiction: 'Pan-African',
    scopeType: 'credibility',
    category: 'EXPERIENCE_CREDIBILITY',
    documentName: 'Certificates of Project Completion, Good Performance & Client Reference Letters',
    classification: 'RECOMMENDED',
    activityTriggers: ['Government procurement', 'Private procurement', 'Contract services', 'Exporting', 'International partnerships', 'Wholesale'],
    industryTriggers: ['ANY'],
    requirementText:
      'Commercial track-record records—such as Certificates of Completion, Certificates of Good Performance, Satisfactory Service Delivery Certificates, Purchase Orders, and Client Reference Letters—used to prove delivery history.',
    reasonText:
      'Demonstrates real execution track record during buyer due diligence and tender technical scoring; note that these are commercial credibility evidence, NOT statutory operating licences.',
    conditionsAndLimitations:
      'Never legally required to incorporate or trade, unless a specific tender stipulates prior experience thresholds.',
    responsibleAuthority: 'Previous Contracting Clients / Procuring Institutions',
    sourceId: 'rw_rppa',
    officialSourceUrl: 'https://www.umucyo.gov.rw/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Explicitly separated commercial experience from legal licences.' },
    ],
  },

  // =========================================================================
  // EXTENSIBLE NON-RWANDA ORIGIN BASELINES (KENYA / UGANDA / TANZANIA / REGION)
  // =========================================================================
  {
    id: 'ke-origin-brs-kra',
    version: '1.0',
    jurisdiction: 'Kenya',
    scopeType: 'origin',
    category: 'BUSINESS_REGISTRATION',
    documentName: 'Kenya BRS Certificate of Incorporation / Registration & KRA PIN / Tax Compliance Certificate',
    classification: 'MANDATORY',
    activityTriggers: ['ANY'],
    industryTriggers: ['ANY'],
    requirementText:
      'Businesses registered in Kenya must hold a Business Registration Service (BRS) Certificate (incorporation or BN2 registration) and a Kenya Revenue Authority (KRA) PIN with valid Tax Compliance Certificate where tendering or exporting.',
    reasonText:
      'Foundational statutory identity and tax compliance for commercial enterprises established in Kenya.',
    conditionsAndLimitations:
      'County Single Business Permits and sector licences (KEBS, KEPHIS, NCA) must also be confirmed directly via KenTrade InfoTradeKenya.',
    responsibleAuthority: 'Business Registration Service (BRS) & Kenya Revenue Authority (KRA)',
    sourceId: 'ke_kebs_kentrade',
    officialSourceUrl: 'https://infotradekenya.go.ke/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Phase 3 Kenya origin baseline.' },
    ],
  },
  {
    id: 'ug-origin-ursb-ura',
    version: '1.0',
    jurisdiction: 'Uganda',
    scopeType: 'origin',
    category: 'BUSINESS_REGISTRATION',
    documentName: 'Uganda URSB Certificate of Registration / Incorporation & URA TIN',
    classification: 'MANDATORY',
    activityTriggers: ['ANY'],
    industryTriggers: ['ANY'],
    requirementText:
      'Enterprises registered in Uganda must hold a Certificate of Incorporation or Business Name registration from URSB alongside a Uganda Revenue Authority (URA) TIN.',
    reasonText:
      'Required for lawful commercial contracting, invoicing, and trade portal registration in Uganda.',
    conditionsAndLimitations:
      'Municipal trading licences and UNBS/sector permits vary by local district and product line.',
    responsibleAuthority: 'Uganda Registration Services Bureau (URSB) & URA',
    sourceId: 'ug_unbs_ursb',
    officialSourceUrl: 'https://ugandatrades.go.ug/',
    lastReviewedDate: '2026-11-01',
    confidence: 'High (Official Source)',
    reviewHistory: [
      { version: '1.0', reviewedAt: '2026-11-01', note: 'Phase 3 Uganda origin baseline.' },
    ],
  },
];

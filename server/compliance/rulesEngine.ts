import type {
  BusinessActivity,
  BusinessRequirementsProfile,
  ChecklistItem,
  ChecklistUserAction,
  ComplianceReadinessSummary,
  DocumentStatus,
  LegalStructureCode,
  RegulatoryRuleRecord,
  UploadedDocumentRecord,
  ExperienceEvidenceRecord,
} from '../../src/types/compliance';
import { REGULATORY_RULES } from './regulatoryRules';
import { getSourceById } from './sourceRegistry';

export interface StoredBusinessLike {
  id: string;
  name: string;
  businessType: string;
  industry: string;
  country: string;
  city: string;
  description: string;
  productsAndServices: string[];
  targetMarkets: string[];
  requirements: string;
}

export function deriveDefaultProfileFromBusiness(
  biz: StoredBusinessLike
): BusinessRequirementsProfile {
  const activities: BusinessActivity[] = ['Domestic sales'];
  const roleLower = biz.businessType.toLowerCase();
  const reqLower = `${biz.requirements} ${biz.description}`.toLowerCase();

  if (roleLower.includes('manufacturer')) {
    activities.push('Manufacturing', 'Wholesale');
  } else if (roleLower.includes('supplier')) {
    activities.push('Wholesale');
  } else if (roleLower.includes('distributor')) {
    activities.push('Distribution', 'Wholesale');
  } else if (roleLower.includes('importer') || roleLower.includes('exporter')) {
    activities.push('Exporting', 'Importing');
  } else if (roleLower.includes('agricultural') || roleLower.includes('cooperative')) {
    activities.push('Processing', 'Wholesale');
  } else if (roleLower.includes('service')) {
    activities.push('Contract services');
  }

  if (
    biz.targetMarkets.some(
      (m) => m.trim().toLowerCase() !== biz.country.trim().toLowerCase()
    ) ||
    reqLower.includes('export')
  ) {
    if (!activities.includes('Exporting')) activities.push('Exporting');
  }
  if (reqLower.includes('import')) {
    if (!activities.includes('Importing')) activities.push('Importing');
  }
  if (reqLower.includes('tender') || reqLower.includes('government')) {
    if (!activities.includes('Government procurement')) activities.push('Government procurement');
  }

  let legalStructure: LegalStructureCode = 'limited_company';
  if (roleLower.includes('cooperative')) {
    legalStructure = 'cooperative';
  }

  return {
    businessId: biz.id,
    registrationCountry: biz.country || 'Rwanda',
    operationCountry: biz.country || 'Rwanda',
    establishmentCountry: biz.country || 'Rwanda',
    legalStructure,
    industry: biz.industry || 'General Trade & Manufacturing',
    activities: Array.from(new Set(activities)),
    products: (biz.productsAndServices ?? []).map((name, idx) => ({
      id: `prod_init_${idx + 1}`,
      name,
      category: biz.industry || 'General Commerce',
      productType: inferInitialProductType(name, biz.industry),
      hsCodeConfidence: 'Not Established',
    })),
    targetMarkets:
      biz.targetMarkets.length > 0 ? biz.targetMarkets : [biz.country || 'Rwanda'],
    buyerSpecificNotes: biz.requirements || '',
    updatedAt: new Date().toISOString(),
  };
}

function inferInitialProductType(
  name: string,
  industry: string
): BusinessRequirementsProfile['products'][number]['productType'] {
  const text = `${name} ${industry}`.toLowerCase();
  if (/(software|ict|saas|app|platform|consulting|advisory)/.test(text)) {
    return 'Software / Digital Service';
  }
  if (/(construction|building|contractor|civil|engineering)/.test(text)) {
    return 'Construction / Contracting Service';
  }
  if (/(coffee|tea|honey|juice|snack|flour|oil|shea|processed|food|beverage|dairy)/.test(text)) {
    return 'Processed Food / Beverage';
  }
  if (/(avocado|produce|grain|bean|maize|crop|agricult|fruit|vegetable|horticulture)/.test(text)) {
    return 'Raw Agricultural Commodity';
  }
  if (/(packaging|pouch|film|carton|steel|hardware|cement|industrial)/.test(text)) {
    return 'Industrial / Packaging Input';
  }
  if (/(logistics|haulage|transport|cold-chain|freight|service)/.test(text)) {
    return 'Professional / Logistics Service';
  }
  return 'Physical Good';
}

export function computeEffectiveDocumentStatus(doc: UploadedDocumentRecord): DocumentStatus {
  if (doc.status === 'Rejected' || doc.status === 'Not applicable') {
    return doc.status;
  }

  if (doc.expiryDate) {
    const expiryMs = Date.parse(doc.expiryDate);
    if (!Number.isNaN(expiryMs)) {
      const nowMs = Date.now();
      const diffDays = (expiryMs - nowMs) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) {
        return 'Expired';
      }
      if (diffDays <= 30) {
        return 'Expiring soon';
      }
    }
  }

  return doc.status;
}

function matchesIndustry(rule: RegulatoryRuleRecord, profile: BusinessRequirementsProfile): boolean {
  if (rule.industryTriggers.includes('ANY')) return true;
  const industryHay = profile.industry.toLowerCase();
  const productHay = profile.products
    .map((p) => `${p.name} ${p.category} ${p.productType} ${p.materialsOrIngredients ?? ''} ${p.intendedUse ?? ''}`)
    .join(' ')
    .toLowerCase();

  const industryMatch = rule.industryTriggers.some((trig) =>
    industryHay.includes(trig.toLowerCase())
  );

  if (industryMatch) {
    // If the rule also carries specific commodity keyword triggers (like coffee/tea or animal products),
    // verify whether the enterprise's products contradict or support it.
    if (rule.productKeywordTriggers && rule.productKeywordTriggers.length > 0 && profile.products.length > 0) {
      return rule.productKeywordTriggers.some((kw) => productHay.includes(kw.toLowerCase()));
    }
    return true;
  }

  if (rule.productKeywordTriggers && rule.productKeywordTriggers.length > 0) {
    return rule.productKeywordTriggers.some((kw) => productHay.includes(kw.toLowerCase()));
  }

  return false;
}

function matchesActivities(rule: RegulatoryRuleRecord, profile: BusinessRequirementsProfile): string[] {
  if ((rule.activityTriggers as string[]).includes('ANY')) {
    return profile.activities.length > 0 ? [profile.activities[0]] : ['General Operations'];
  }
  return rule.activityTriggers.filter((act) =>
    profile.activities.includes(act as BusinessActivity)
  );
}

function isDestinationSelected(
  destJurisdiction: string,
  profile: BusinessRequirementsProfile
): boolean {
  const normDest = destJurisdiction.toLowerCase();
  const originCountries = new Set(
    [profile.registrationCountry, profile.operationCountry, profile.establishmentCountry]
      .filter(Boolean)
      .map((c) => c.toLowerCase())
  );

  return profile.targetMarkets.some((market) => {
    const m = market.trim().toLowerCase();
    if (!m || originCountries.has(m)) return false;
    if (normDest === 'european union') {
      return /(eu|europe|european union|germany|france|netherlands|belgium|uk)/.test(m);
    }
    return m === normDest || m.includes(normDest);
  });
}

export function buildPersonalisedChecklist(params: {
  profile: BusinessRequirementsProfile;
  documents: UploadedDocumentRecord[];
  userActions: ChecklistUserAction[];
}): ChecklistItem[] {
  const { profile, documents, userActions } = params;

  const originCountries = Array.from(
    new Set(
      [profile.registrationCountry, profile.operationCountry, profile.establishmentCountry]
        .map((c) => c.trim())
        .filter(Boolean)
    )
  );

  const hasExport = profile.activities.includes('Exporting');
  const hasImport = profile.activities.includes('Importing');
  const hasProcurement =
    profile.activities.includes('Government procurement') ||
    profile.activities.includes('Private procurement');
  const externalMarkets = profile.targetMarkets.filter(
    (m) => !originCountries.some((oc) => oc.toLowerCase() === m.trim().toLowerCase())
  );
  const hasCrossBorder = hasExport || hasImport || externalMarkets.length > 0;

  const productHay = profile.products
    .map((p) => `${p.name} ${p.category} ${p.materialsOrIngredients ?? ''}`.toLowerCase());

  const items: ChecklistItem[] = [];

  for (const rule of REGULATORY_RULES) {
    // 1. Jurisdiction check
    if (rule.scopeType === 'destination' && rule.destinationJurisdiction) {
      if (!hasExport && !profile.activities.includes('Distribution') && externalMarkets.length === 0) {
        continue;
      }
      if (!isDestinationSelected(rule.destinationJurisdiction, profile)) {
        continue;
      }
    } else if (rule.scopeType === 'origin' || rule.scopeType === 'procurement') {
      const matchesOrigin = originCountries.some(
        (c) => c.toLowerCase() === rule.jurisdiction.toLowerCase()
      );
      if (!matchesOrigin) continue;
    } else if (rule.scopeType === 'corridor') {
      const matchesOrigin = originCountries.some(
        (c) => c.toLowerCase() === rule.jurisdiction.toLowerCase()
      );
      if (!matchesOrigin) continue;
    }

    // 2. Legal structure check
    if (rule.legalStructureTriggers && rule.legalStructureTriggers.length > 0) {
      if (!rule.legalStructureTriggers.includes(profile.legalStructure)) {
        continue;
      }
    }

    // 3. Trade mode flags
    if (rule.requiresExport && !hasExport) continue;
    if (rule.requiresImport && !hasImport) continue;
    if (rule.requiresCrossBorder && !hasCrossBorder) continue;
    if (rule.requiresProcurement && !hasProcurement) continue;

    // 4. Industry & product check
    if (!matchesIndustry(rule, profile)) continue;

    // 5. Activity check
    const matchedActivities = matchesActivities(rule, profile);
    if (matchedActivities.length === 0) continue;

    // Determine relevant products
    const relevantProducts: string[] = [];
    if (rule.productKeywordTriggers && rule.productKeywordTriggers.length > 0) {
      profile.products.forEach((p, idx) => {
        const text = productHay[idx] || '';
        if (rule.productKeywordTriggers?.some((kw) => text.includes(kw.toLowerCase()))) {
          relevantProducts.push(p.name);
        }
      });
    } else if (profile.products.length > 0 && rule.category !== 'BUSINESS_REGISTRATION' && rule.category !== 'TAX_STATUTORY') {
      relevantProducts.push(profile.products[0].name);
    }

    const action = userActions.find((a) => a.ruleId === rule.id);
    const linkedDoc = documents.find((d) => d.checklistRuleId === rule.id);
    const source = getSourceById(rule.sourceId);

    const effectiveClassification = action?.markedNotApplicable
      ? 'NOT_APPLICABLE'
      : rule.classification;

    const status: DocumentStatus = action?.markedNotApplicable
      ? 'Not applicable'
      : linkedDoc
        ? computeEffectiveDocumentStatus(linkedDoc)
        : 'Missing';

    const scopeLabel: ChecklistItem['scopeLabel'] =
      rule.scopeType === 'destination'
        ? 'Destination Country'
        : rule.scopeType === 'procurement'
          ? 'Procurement / Buyer'
          : rule.scopeType === 'credibility'
            ? 'Credibility'
            : 'Origin Country';

    items.push({
      ruleId: rule.id,
      documentName: rule.documentName,
      category: rule.category,
      baseClassification: rule.classification,
      effectiveClassification,
      jurisdiction: rule.jurisdiction,
      destinationJurisdiction: rule.destinationJurisdiction,
      scopeLabel,
      relevantActivities: matchedActivities,
      relevantProducts,
      reason: rule.reasonText,
      requirementText: rule.requirementText,
      conditionsAndLimitations: rule.conditionsAndLimitations,
      responsibleAuthority: rule.responsibleAuthority,
      sourceId: rule.sourceId,
      sourceName: source?.name ?? rule.responsibleAuthority,
      officialSourceUrl: rule.officialSourceUrl,
      applicationUrl: rule.applicationUrl,
      documentsNeededToApply: rule.documentsNeededToApply ?? [],
      validityPeriod: rule.validityPeriod,
      renewalRequirements: rule.renewalRequirements,
      lastReviewedDate: rule.lastReviewedDate,
      confidence: rule.confidence,
      status,
      linkedDocumentId: linkedDoc?.id,
      userAction: action,
    });
  }

  // Dynamic NEEDS_CONFIRMATION item when origin country is outside Phase 1-3 detailed rulesets (RW/KE/UG)
  for (const originCountry of originCountries) {
    const low = originCountry.toLowerCase();
    if (!['rwanda', 'kenya', 'uganda'].includes(low)) {
      const ruleId = `dyn-origin-${low.replace(/[^a-z0-9]/g, '-')}`;
      const action = userActions.find((a) => a.ruleId === ruleId);
      const linkedDoc = documents.find((d) => d.checklistRuleId === ruleId);
      items.push({
        ruleId,
        documentName: `${originCountry} National Business Registration, Tax ID & Sector Licensing Confirmation`,
        category: 'BUSINESS_REGISTRATION',
        baseClassification: 'NEEDS_CONFIRMATION',
        effectiveClassification: action?.markedNotApplicable ? 'NOT_APPLICABLE' : 'NEEDS_CONFIRMATION',
        jurisdiction: originCountry,
        scopeLabel: 'Origin Country',
        relevantActivities: profile.activities.slice(0, 3),
        relevantProducts: [],
        reason: `Detailed national subsidiary licensing rules for ${originCountry} are scheduled for Phase 3 expansion. Confirm exact corporate registry, tax clearance, and sector permits with ${originCountry}'s national business registrar and revenue authority.`,
        requirementText: `Verify statutory company registration, tax identification, and sector operating permits required in ${originCountry}.`,
        conditionsAndLimitations:
          'TradeSquare flags NEEDS_CONFIRMATION rather than inventing legal requirements where country-specific official schedules are not yet loaded.',
        responsibleAuthority: `${originCountry} National Registrar & Revenue Authority / AfCFTA Secretariat`,
        sourceId: 'reg_afcfta',
        sourceName: 'AfCFTA / Regional Trade Authority Reference',
        officialSourceUrl: 'https://au-afcfta.org/',
        documentsNeededToApply: [],
        lastReviewedDate: '2026-11-01',
        confidence: 'Needs Official Confirmation',
        status: action?.markedNotApplicable
          ? 'Not applicable'
          : linkedDoc
            ? computeEffectiveDocumentStatus(linkedDoc)
            : 'Missing',
        linkedDocumentId: linkedDoc?.id,
        userAction: action,
      });
    }
  }

  // Dynamic destination NEEDS_CONFIRMATION cards for export targets beyond Kenya/Uganda/EU
  if (hasExport) {
    for (const market of externalMarkets) {
      const mLow = market.trim().toLowerCase();
      const handledByRules =
        mLow.includes('kenya') ||
        mLow.includes('uganda') ||
        /(eu|europe|european union|germany|france|netherlands|belgium|uk)/.test(mLow) ||
        mLow === 'east africa';

      if (!handledByRules) {
        const ruleId = `dyn-dest-${mLow.replace(/[^a-z0-9]/g, '-')}`;
        const action = userActions.find((a) => a.ruleId === ruleId);
        const linkedDoc = documents.find((d) => d.checklistRuleId === ruleId);
        items.push({
          ruleId,
          documentName: `${market} Destination Import Conformity & Buyer Customs Requirements`,
          category: 'IMPORT_EXPORT',
          baseClassification: 'NEEDS_CONFIRMATION',
          effectiveClassification: action?.markedNotApplicable ? 'NOT_APPLICABLE' : 'NEEDS_CONFIRMATION',
          jurisdiction: market,
          destinationJurisdiction: market,
          scopeLabel: 'Destination Country',
          relevantActivities: ['Exporting'],
          relevantProducts: profile.products.map((p) => p.name).slice(0, 3),
          reason: `Origin compliance in ${profile.registrationCountry} does not automatically satisfy ${market}'s national standards or sanitary/import permit controls.`,
          requirementText: `Confirm destination import permits, standards conformity marks, and rules-of-origin eligibility for exporting to ${market}.`,
          conditionsAndLimitations:
            'Requires confirmation against destination customs authority or official bilateral buyer instructions.',
          responsibleAuthority: `${market} Customs / Standards Authority & Rwanda Trade Portal`,
          sourceId: 'rw_trade_portal',
          sourceName: 'Rwanda Trade Portal & AfCFTA Framework',
          officialSourceUrl: 'https://rwandatrade.rw/',
          documentsNeededToApply: [],
          lastReviewedDate: '2026-11-01',
          confidence: 'Needs Official Confirmation',
          status: action?.markedNotApplicable
            ? 'Not applicable'
            : linkedDoc
              ? computeEffectiveDocumentStatus(linkedDoc)
              : 'Missing',
          linkedDocumentId: linkedDoc?.id,
          userAction: action,
        });
      }
    }
  }

  // Buyer-specific qualification requirements entered by the business
  if (profile.buyerSpecificNotes.trim().length > 0) {
    const ruleId = 'buyer-specific-mandate';
    const action = userActions.find((a) => a.ruleId === ruleId);
    const linkedDoc = documents.find((d) => d.checklistRuleId === ruleId);
    items.push({
      ruleId,
      documentName: 'Buyer-Specific Qualification & Customer Compliance Evidence',
      category: 'PROCUREMENT_QUALIFICATION',
      baseClassification: 'BUYER-REQUIRED',
      effectiveClassification: action?.markedNotApplicable ? 'NOT_APPLICABLE' : 'BUYER-REQUIRED',
      jurisdiction: profile.operationCountry || 'Rwanda',
      scopeLabel: 'Procurement / Buyer',
      relevantActivities: profile.activities.slice(0, 3),
      relevantProducts: profile.products.map((p) => p.name).slice(0, 3),
      reason: `Driven by your stated buyer / tender requirement: "${profile.buyerSpecificNotes.trim()}"`,
      requirementText:
        'Commercial counterparties or institutional buyers may stipulate additional quality audits, bank guarantees, manufacturer authorisations, or product specifications beyond statutory law.',
      conditionsAndLimitations:
        'Contractual or buyer-specific obligation only; does not represent a universal government mandate.',
      responsibleAuthority: 'Requesting Buyer / Contracting Entity',
      sourceId: 'rw_rppa',
      sourceName: 'Buyer Specification / Procurement Terms',
      officialSourceUrl: 'https://www.umucyo.gov.rw/',
      documentsNeededToApply: [],
      lastReviewedDate: '2026-11-01',
      confidence: 'Medium (Conditional)',
      status: action?.markedNotApplicable
        ? 'Not applicable'
        : linkedDoc
          ? computeEffectiveDocumentStatus(linkedDoc)
          : 'Missing',
      linkedDocumentId: linkedDoc?.id,
      userAction: action,
    });
  }

  return items;
}

export function buildReadinessSummary(params: {
  checklist: ChecklistItem[];
  documents: UploadedDocumentRecord[];
  experienceRecords: ExperienceEvidenceRecord[];
}): ComplianceReadinessSummary {
  const { checklist, documents, experienceRecords } = params;
  const activeChecklist = checklist.filter((c) => c.effectiveClassification !== 'NOT_APPLICABLE');
  const computedDocs = documents.map((d) => ({
    ...d,
    status: computeEffectiveDocumentStatus(d),
  }));

  const coveredChecklistCount = activeChecklist.filter((c) =>
    ['Uploaded', 'Pending review', 'Verified', 'Expiring soon'].includes(c.status)
  ).length;

  const checklistCompletenessPercent =
    activeChecklist.length > 0
      ? Math.round((coveredChecklistCount / activeChecklist.length) * 100)
      : 0;

  return {
    totalApplicableItems: activeChecklist.length,
    mandatoryCount: activeChecklist.filter((c) => c.effectiveClassification === 'MANDATORY').length,
    conditionalCount: activeChecklist.filter((c) => c.effectiveClassification === 'CONDITIONAL').length,
    buyerRequiredCount: activeChecklist.filter((c) => c.effectiveClassification === 'BUYER-REQUIRED').length,
    recommendedCount: activeChecklist.filter((c) => c.effectiveClassification === 'RECOMMENDED').length,
    needsConfirmationCount: activeChecklist.filter((c) => c.effectiveClassification === 'NEEDS_CONFIRMATION').length,
    missingCount: activeChecklist.filter((c) => c.status === 'Missing').length,
    uploadedCount: computedDocs.filter((d) => d.status === 'Uploaded').length,
    pendingReviewCount: computedDocs.filter((d) => d.status === 'Pending review').length,
    verifiedCount: computedDocs.filter((d) => d.status === 'Verified').length,
    expiringSoonCount: computedDocs.filter((d) => d.status === 'Expiring soon').length,
    expiredCount: computedDocs.filter((d) => d.status === 'Expired' || d.status === 'Renewal required').length,
    notApplicableCount: checklist.filter((c) => c.effectiveClassification === 'NOT_APPLICABLE').length,
    pendingClarificationCount: checklist.filter((c) => c.userAction?.clarificationRequested).length,
    experienceRecordsCount: experienceRecords.length,
    checklistCompletenessPercent,
    completenessExplanation:
      'Checklist completeness reflects the share of applicable checklist items with an active uploaded file. It does NOT confirm legal compliance, official document authenticity, business verification, or automatic tender qualification.',
  };
}

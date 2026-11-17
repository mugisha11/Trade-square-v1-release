import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  BusinessRequirementsProfile,
  ChecklistItem,
  ComplianceAssistantResponse,
  DocumentAiExtraction,
  UploadedDocumentRecord,
} from '../../src/types/compliance';
import { REGULATORY_SOURCES } from './sourceRegistry';
import { REGULATORY_RULES } from './regulatoryRules';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function analyzeUploadedDocumentWithAi(params: {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  documentRecord: UploadedDocumentRecord;
  businessName: string;
  profile: BusinessRequirementsProfile;
}): Promise<DocumentAiExtraction> {
  const ai = getGeminiClient();

  const prompt = [
    'Analyze this uploaded business compliance or commercial document (PDF or image).',
    `Expected Enterprise Name in TradeSquare Profile: "${params.businessName}"`,
    `Profile Registration Country: "${params.profile.registrationCountry}"`,
    `User-selected Document Type: "${params.documentRecord.documentType}"`,
    `User-entered Title: "${params.documentRecord.title}"`,
    `User-entered Issuing Authority: "${params.documentRecord.issuingAuthority}"`,
    `File Name: "${params.fileName}"`,
    '',
    'CRITICAL RULES:',
    '- Extract only details clearly visible in the document. If a field (e.g. expiry date or reference number) is not printed or illegible, leave it empty/omitted rather than guessing.',
    '- Compare any visible business/company name against the Expected Enterprise Name and set businessNameMatchesProfile honestly.',
    '- Check for readability issues, missing signature/pages, or expired dates.',
    '- If there are inconsistencies, unreadable sections, or expiry issues, set flaggedForHumanReview = true and explain calmly in reviewFlagReasons. NEVER accuse forgery.',
  ].join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: params.mimeType,
            data: params.fileBuffer.toString('base64'),
          },
        },
        { text: prompt },
      ],
    },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedDocumentType: { type: Type.STRING },
          extractedTitle: { type: Type.STRING },
          extractedIssuingAuthority: { type: Type.STRING },
          extractedIssueDate: { type: Type.STRING },
          extractedExpiryDate: { type: Type.STRING },
          extractedReferenceNumber: { type: Type.STRING },
          relatedBusinessOrProduct: { type: Type.STRING },
          extractedBusinessName: { type: Type.STRING },
          businessNameMatchesProfile: { type: Type.BOOLEAN },
          completenessIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
          expiryWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          flaggedForHumanReview: { type: Type.BOOLEAN },
          reviewFlagReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'detectedDocumentType',
          'extractedTitle',
          'extractedIssuingAuthority',
          'businessNameMatchesProfile',
          'completenessIssues',
          'expiryWarnings',
          'flaggedForHumanReview',
          'reviewFlagReasons',
        ],
      },
    },
  });

  const raw = (response.text ?? '').trim();
  if (!raw) {
    throw new Error('AI document analyzer returned an empty response.');
  }

  const parsed = JSON.parse(raw);

  // Additional deterministic expiry check
  const expiryWarnings: string[] = Array.isArray(parsed.expiryWarnings) ? [...parsed.expiryWarnings] : [];
  if (parsed.extractedExpiryDate) {
    const ms = Date.parse(parsed.extractedExpiryDate);
    if (!Number.isNaN(ms)) {
      const days = (ms - Date.now()) / (1000 * 60 * 60 * 24);
      if (days < 0 && !expiryWarnings.some((w) => w.toLowerCase().includes('expired'))) {
        expiryWarnings.push(`Extracted expiry date (${parsed.extractedExpiryDate}) appears to be in the past.`);
      } else if (days >= 0 && days <= 30 && !expiryWarnings.some((w) => w.toLowerCase().includes('soon'))) {
        expiryWarnings.push(`Extracted expiry date (${parsed.extractedExpiryDate}) is within 30 days.`);
      }
    }
  }

  return {
    detectedDocumentType: parsed.detectedDocumentType || params.documentRecord.documentType,
    extractedTitle: parsed.extractedTitle || params.documentRecord.title,
    extractedIssuingAuthority:
      parsed.extractedIssuingAuthority || params.documentRecord.issuingAuthority,
    extractedIssueDate: parsed.extractedIssueDate || undefined,
    extractedExpiryDate: parsed.extractedExpiryDate || undefined,
    extractedReferenceNumber: parsed.extractedReferenceNumber || undefined,
    relatedBusinessOrProduct: parsed.relatedBusinessOrProduct || undefined,
    extractedBusinessName: parsed.extractedBusinessName || undefined,
    businessNameMatchesProfile: Boolean(parsed.businessNameMatchesProfile),
    completenessIssues: Array.isArray(parsed.completenessIssues) ? parsed.completenessIssues : [],
    expiryWarnings,
    flaggedForHumanReview:
      Boolean(parsed.flaggedForHumanReview) ||
      !parsed.businessNameMatchesProfile ||
      expiryWarnings.length > 0,
    reviewFlagReasons: Array.isArray(parsed.reviewFlagReasons) ? parsed.reviewFlagReasons : [],
    disclaimer:
      'AI-extracted details assist with document pre-screening and data entry only. AI analysis never confirms authenticity or serves as official regulatory verification.',
    confirmedByUser: false,
    analyzedAt: new Date().toISOString(),
  };
}

export async function answerComplianceQuestionWithAi(params: {
  question: string;
  businessName: string;
  profile: BusinessRequirementsProfile;
  checklist: ChecklistItem[];
  documents: UploadedDocumentRecord[];
}): Promise<ComplianceAssistantResponse> {
  const ai = getGeminiClient();

  const authoritativeSources = REGULATORY_SOURCES.filter((s) => s.canEstablishLegalObligation);
  const validSourceUrlMap = new Map(REGULATORY_SOURCES.map((s) => [s.url, s]));

  // Retrieve top matching rules and checklist context
  const qLower = params.question.toLowerCase();
  const relevantRules = REGULATORY_RULES.filter((r) => {
    const hay = `${r.documentName} ${r.jurisdiction} ${r.requirementText} ${r.reasonText} ${r.responsibleAuthority}`.toLowerCase();
    return (
      qLower.split(/\s+/).some((tok) => tok.length > 3 && hay.includes(tok)) ||
      r.jurisdiction.toLowerCase() === params.profile.registrationCountry.toLowerCase()
    );
  }).slice(0, 12);

  const groundingContext = {
    enterpriseContext: {
      businessName: params.businessName,
      registrationCountry: params.profile.registrationCountry,
      operationCountry: params.profile.operationCountry,
      legalStructure: params.profile.legalStructure,
      industry: params.profile.industry,
      activities: params.profile.activities,
      products: params.profile.products.map((p) => p.name),
      targetMarkets: params.profile.targetMarkets,
    },
    currentPersonalisedChecklist: params.checklist.map((item) => ({
      documentName: item.documentName,
      classification: item.effectiveClassification,
      jurisdiction: item.jurisdiction,
      scope: item.scopeLabel,
      status: item.status,
      authority: item.responsibleAuthority,
      officialUrl: item.officialSourceUrl,
      validityPeriod: item.validityPeriod,
      conditions: item.conditionsAndLimitations,
      lastReviewedDate: item.lastReviewedDate,
    })),
    uploadedDocumentsStatus: params.documents.map((d) => ({
      title: d.title,
      type: d.documentType,
      status: d.status,
      expiryDate: d.expiryDate,
    })),
    retrievedAuthoritativeRules: relevantRules.map((r) => ({
      id: r.id,
      jurisdiction: r.jurisdiction,
      documentName: r.documentName,
      classification: r.classification,
      authority: r.responsibleAuthority,
      officialSourceUrl: r.officialSourceUrl,
      requirementText: r.requirementText,
      conditions: r.conditionsAndLimitations,
      documentsNeededToApply: r.documentsNeededToApply,
      lastReviewedDate: r.lastReviewedDate,
    })),
    approvedOfficialRegulatorySources: authoritativeSources.map((s) => ({
      name: s.name,
      url: s.url,
      jurisdiction: s.jurisdiction,
      sourceType: s.sourceType,
      lastCheckedDate: s.lastCheckedDate,
    })),
    userQuestion: params.question.trim(),
  };

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: JSON.stringify(groundingContext),
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      systemInstruction: [
        'You are the TradeSquare Compliance & Trade Readiness Assistant.',
        'STRICT REGULATORY GROUNDING RULES:',
        '1. Base every regulatory statement ONLY on retrievedAuthoritativeRules, currentPersonalisedChecklist, uploadedDocumentsStatus, and approvedOfficialRegulatorySources.',
        '2. NEVER invent fees, processing timelines, legal obligations, or official URLs not explicitly present in the provided JSON context.',
        '3. NEVER cite statistical/market intelligence sources (ITC Trade Map, NISR, data.gov.rw) as proof of legal obligation.',
        '4. If a question asks about a country, commodity, or rule not confirmed in the retrieved records, set requirementClassification to "NEEDS_CONFIRMATION" and needsOfficialConfirmation to true, clearly explaining what must be confirmed with the relevant authority.',
        '5. Always distinguish RECOMMENDED or BUYER-REQUIRED items from MANDATORY legal requirements.',
        '6. Only return citation officialUrl values that exactly match a url in approvedOfficialRegulatorySources or currentPersonalisedChecklist.',
      ].join('\n'),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answerSummary: { type: Type.STRING },
          country: { type: Type.STRING },
          relevantBusinessActivity: { type: Type.STRING },
          requirementClassification: {
            type: Type.STRING,
            enum: [
              'MANDATORY',
              'CONDITIONAL',
              'BUYER-REQUIRED',
              'RECOMMENDED',
              'NOT_APPLICABLE',
              'NEEDS_CONFIRMATION',
            ],
          },
          importantLimitations: { type: Type.STRING },
          lastCheckedDate: { type: Type.STRING },
          citations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sourceName: { type: Type.STRING },
                officialUrl: { type: Type.STRING },
              },
              required: ['sourceName', 'officialUrl'],
            },
          },
          actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          needsOfficialConfirmation: { type: Type.BOOLEAN },
        },
        required: [
          'answerSummary',
          'country',
          'relevantBusinessActivity',
          'requirementClassification',
          'importantLimitations',
          'lastCheckedDate',
          'citations',
          'actionableSteps',
          'needsOfficialConfirmation',
        ],
      },
    },
  });

  const raw = (response.text ?? '').trim();
  if (!raw) {
    throw new Error('Compliance assistant returned an empty response.');
  }

  const parsed = JSON.parse(raw);

  // Enforce strict URL citation integrity
  const sanitizedCitations = (Array.isArray(parsed.citations) ? parsed.citations : [])
    .map((c: { sourceName: string; officialUrl: string }) => {
      const matched = validSourceUrlMap.get(c.officialUrl);
      if (!matched || !matched.canEstablishLegalObligation) return null;
      return {
        sourceName: matched.name,
        officialUrl: matched.url,
        sourceType: matched.sourceType,
      };
    })
    .filter(Boolean);

  if (sanitizedCitations.length === 0) {
    const rwPortal = validSourceUrlMap.get('https://rwandatrade.rw/');
    if (rwPortal) {
      sanitizedCitations.push({
        sourceName: rwPortal.name,
        officialUrl: rwPortal.url,
        sourceType: rwPortal.sourceType,
      });
    }
  }

  return {
    answerSummary: parsed.answerSummary,
    country: parsed.country || params.profile.registrationCountry,
    relevantBusinessActivity:
      parsed.relevantBusinessActivity || params.profile.activities.join(', ') || 'General Commerce',
    requirementClassification: parsed.requirementClassification || 'NEEDS_CONFIRMATION',
    importantLimitations:
      parsed.importantLimitations ||
      'This guidance summarizes structured regulatory records and does not constitute formal legal advice.',
    lastCheckedDate: parsed.lastCheckedDate || '2026-11-01',
    citations: sanitizedCitations,
    actionableSteps: Array.isArray(parsed.actionableSteps) ? parsed.actionableSteps : [],
    needsOfficialConfirmation: Boolean(parsed.needsOfficialConfirmation),
  };
}

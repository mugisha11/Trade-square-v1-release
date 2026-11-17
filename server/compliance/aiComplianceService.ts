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
import { analyzeWithTradeSquareDocModel } from './tradesquareDocModel';

/**
 * Document analysis uses TradeSquare Document Intelligence v1
 * (local OCR + typed extractors). Gemini is NOT used for document reading.
 */
export async function analyzeUploadedDocumentWithAi(params: {
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
  return analyzeWithTradeSquareDocModel(params);
}

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

/** Compliance Q&A assistant (separate from document OCR/extraction). */
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

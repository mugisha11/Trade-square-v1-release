import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  BusinessRequirementsProfile,
  ChecklistUserAction,
  ComplianceWorkspacePayload,
  DocumentCategory,
  DocumentStatus,
  ExperienceEvidenceRecord,
  ExperienceEvidenceType,
  UploadedDocumentRecord,
} from './src/types/compliance';
import { COUNTRY_REGISTRY } from './server/compliance/countryRegistry';
import { REGULATORY_SOURCES } from './server/compliance/sourceRegistry';
import {
  REGULATORY_RULES,
  REGULATORY_RULES_LAST_REVIEWED,
  REGULATORY_RULES_VERSION,
} from './server/compliance/regulatoryRules';
import {
  deleteStoredDocumentFile,
  readStoredDocumentBuffer,
  validateAndSaveBase64Document,
} from './server/compliance/documentStorage';
import {
  buildPersonalisedChecklist,
  buildReadinessSummary,
  computeEffectiveDocumentStatus,
  deriveDefaultProfileFromBusiness,
} from './server/compliance/rulesEngine';
import {
  analyzeUploadedDocumentWithAi,
  answerComplianceQuestionWithAi,
} from './server/compliance/aiComplianceService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const STORE_PATH = '/tmp/tradesquare-workspace-store.json';
const SESSION_COOKIE = 'ts_session';

interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  language: 'en' | 'fr' | 'rw';
  createdAt: string;
}

interface StoredBusiness {
  id: string;
  ownerUserId: string;
  name: string;
  businessType: string;
  industry: string;
  country: string;
  city: string;
  description: string;
  productsAndServices: string[];
  targetMarkets: string[];
  requirements: string;
  logoUrl?: string;
  verifiedRecord: boolean;
  updatedAt: string;
}

interface StoredOpportunity {
  id: string;
  ownerUserId: string;
  businessId: string;
  type: string;
  productOrService: string;
  description: string;
  quantityAndSpecs?: string;
  destinationMarket?: string;
  deadline?: string;
  industry: string;
  createdAt: string;
  savedByUserIds: string[];
  interestedUserIds: string[];
}

interface StoredEnquiry {
  id: string;
  opportunityId: string;
  fromUserId: string;
  toUserId: string;
  fromBusinessName: string;
  toBusinessName: string;
  subject: string;
  createdAt: string;
}

interface StoredMessage {
  id: string;
  threadId: string;
  senderUserId: string;
  senderName: string;
  senderBusinessName: string;
  body: string;
  createdAt: string;
}

interface StoredThread {
  id: string;
  participantUserIds: string[];
  subject: string;
  opportunityId?: string;
  lastMessageAt: string;
  messages: StoredMessage[];
}

interface StoredActivity {
  id: string;
  userId: string;
  kind: 'enquiry' | 'response' | 'message' | 'saved_update';
  title: string;
  detail: string;
  createdAt: string;
  relatedPage: 'home' | 'discover' | 'opportunities' | 'messages' | 'my-business';
  relatedId?: string;
}

interface NetworkRegistration {
  referenceId: string;
  businessName: string;
  contactName: string;
  email: string;
  country: string;
  role: string;
  sector: string;
  objective: string;
  submittedAt: string;
}

interface StoredChecklistAction extends ChecklistUserAction {
  businessId: string;
}

interface StoredComplianceDocument extends UploadedDocumentRecord {
  storageKey: string;
}

interface StoredExperienceEvidence extends ExperienceEvidenceRecord {
  supportingStorageKey?: string;
}

interface StoreState {
  users: StoredUser[];
  businesses: StoredBusiness[];
  opportunities: StoredOpportunity[];
  enquiries: StoredEnquiry[];
  threads: StoredThread[];
  activities: StoredActivity[];
  sessions: Record<string, string>;
  registrations: NetworkRegistration[];
  complianceProfiles: BusinessRequirementsProfile[];
  checklistActions: StoredChecklistAction[];
  complianceDocuments: StoredComplianceDocument[];
  experienceRecords: StoredExperienceEvidence[];
}

function loadStore(): StoreState {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      return {
        users: parsed.users ?? [],
        businesses: parsed.businesses ?? [],
        opportunities: parsed.opportunities ?? [],
        enquiries: parsed.enquiries ?? [],
        threads: parsed.threads ?? [],
        activities: parsed.activities ?? [],
        sessions: parsed.sessions ?? {},
        registrations: parsed.registrations ?? [],
        complianceProfiles: parsed.complianceProfiles ?? [],
        checklistActions: parsed.checklistActions ?? [],
        complianceDocuments: parsed.complianceDocuments ?? [],
        experienceRecords: parsed.experienceRecords ?? [],
      };
    }
  } catch {
    // Fallback to clean empty store if corrupt
  }

  return {
    users: [],
    businesses: [],
    opportunities: [],
    enquiries: [],
    threads: [],
    activities: [],
    sessions: {},
    registrations: [],
    complianceProfiles: [],
    checklistActions: [],
    complianceDocuments: [],
    experienceRecords: [],
  };
}

const store: StoreState = loadStore();

function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only filesystems; in-memory state stays intact
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) result[key] = val;
  }
  return result;
}

function extractTokenFromRequest(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE] || null;
}

function getAuthenticatedUser(req: express.Request): StoredUser | null {
  const token = extractTokenFromRequest(req);
  if (!token) return null;
  const userId = store.sessions[token];
  if (!userId) return null;
  return store.users.find((u) => u.id === userId) ?? null;
}

function isHttpsRequest(req: express.Request): boolean {
  const proto = req.headers['x-forwarded-proto'];
  return req.secure || (typeof proto === 'string' && proto.split(',')[0].trim() === 'https');
}

function setSessionCookie(req: express.Request, res: express.Response, token: string) {
  const https = isHttpsRequest(req);
  const attrs = https
    ? 'Path=/; HttpOnly; SameSite=None; Secure'
    : 'Path=/; HttpOnly; SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${attrs}; Max-Age=${60 * 60 * 24 * 7}`
  );
}

function clearSessionCookie(req: express.Request, res: express.Response) {
  const https = isHttpsRequest(req);
  const attrs = https
    ? 'Path=/; HttpOnly; SameSite=None; Secure'
    : 'Path=/; HttpOnly; SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; ${attrs}; Max-Age=0`
  );
}

function getBusinessForUser(userId: string): StoredBusiness | undefined {
  return store.businesses.find((b) => b.ownerUserId === userId);
}

function sanitizeUser(user: StoredUser) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    language: user.language,
    createdAt: user.createdAt,
  };
}

function sanitizeComplianceDocument(doc: StoredComplianceDocument): UploadedDocumentRecord {
  const { storageKey: _removed, ...rest } = doc;
  return {
    ...rest,
    status: computeEffectiveDocumentStatus(rest),
  };
}

function sanitizeExperienceRecord(rec: StoredExperienceEvidence): ExperienceEvidenceRecord {
  const { supportingStorageKey: _removed, ...rest } = rec;
  return rest;
}

function getOrCreateComplianceProfile(business: StoredBusiness): BusinessRequirementsProfile {
  let profile = store.complianceProfiles.find((p) => p.businessId === business.id);
  if (!profile) {
    profile = deriveDefaultProfileFromBusiness(business);
    store.complianceProfiles.push(profile);
    saveStore();
  }
  return profile;
}

function buildComplianceWorkspaceForBusiness(business: StoredBusiness): ComplianceWorkspacePayload {
  const profile = getOrCreateComplianceProfile(business);
  const docs = store.complianceDocuments
    .filter((d) => d.businessId === business.id)
    .map(sanitizeComplianceDocument)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const actions = store.checklistActions.filter((a) => a.businessId === business.id);
  const experience = store.experienceRecords
    .filter((r) => r.businessId === business.id)
    .map(sanitizeExperienceRecord)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const checklist = buildPersonalisedChecklist({
    profile,
    documents: docs,
    userActions: actions,
  });

  const readinessSummary = buildReadinessSummary({
    checklist,
    documents: docs,
    experienceRecords: experience,
  });

  return {
    countryRegistry: COUNTRY_REGISTRY,
    sourceRegistry: REGULATORY_SOURCES,
    rulesCatalogCount: REGULATORY_RULES.length,
    rulesLastReviewed: REGULATORY_RULES_LAST_REVIEWED,
    requirementsProfile: profile,
    checklist,
    readinessSummary,
    documents: docs,
    experienceRecords: experience,
  };
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

let cachedRegionalAnalysis: {
  generatedAt: number;
  data: {
    region: string;
    label: string;
    items: Array<{
      category: 'Historical Trade Pattern' | 'Market Analysis' | 'Potential Opportunity';
      title: string;
      detail: string;
    }>;
  };
} | null = null;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'tradesquare' });
  });

  // =========================================================================
  // PUBLIC LANDING PAGE ENDPOINTS (Preserved)
  // =========================================================================
  app.post('/api/intelligence/brief', async (req, res) => {
    const { role, originRegion, corridorScope, query } = req.body ?? {};

    if (!query || typeof query !== 'string' || query.trim().length < 10) {
      res.status(400).json({
        error: 'Please enter a specific business, sourcing, or market expansion goal (at least 10 characters).',
      });
      return;
    }

    try {
      const ai = getGeminiClient();

      const prompt = [
        `Participant Role: ${String(role || 'African Enterprise')}`,
        `Origin Region: ${String(originRegion || 'Pan-African')}`,
        `Target Scope: ${String(corridorScope || 'Regional Cross-Border Trade')}`,
        `Commercial Query: ${query.trim()}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          systemInstruction: [
            'You are TradeSquare Commercial Intelligence, a practical trade and partner-discovery advisor for African businesses, buyers, manufacturers, distributors, investors, and institutional stakeholders.',
            'Follow TradeSquare communication principles strictly:',
            '- Be visionary yet grounded, commercially confident, practical, and easy for an ordinary business owner to act on.',
            '- Avoid empty startup buzzwords, exaggerated AI claims, or invented statistics. Never fabricate company names, fake volume numbers, or unverified percentages.',
            '- Focus on real commercial execution: counterparty profile criteria, verification and compliance checks, regional logistics/documentation realities, and concrete first commercial actions.',
            '- Keep each array concise (3 to 4 crisp, high-value items) and keep the executive summary under 60 words.',
          ].join('\n'),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              targetPartnerProfiles: { type: Type.ARRAY, items: { type: Type.STRING } },
              verificationChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
              corridorConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
              nextCommercialActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'summary',
              'targetPartnerProfiles',
              'verificationChecks',
              'corridorConsiderations',
              'nextCommercialActions',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'The intelligence service returned an empty response. Please refine your query and try again.',
        });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({
        brief: parsed,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to generate commercial brief right now.';
      const status =
        message.includes('API_KEY') || message.includes('PERMISSION_DENIED') || message.includes('403')
          ? 503
          : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 500;

      res.status(status).json({
        error:
          status === 503
            ? 'Commercial intelligence requires a valid GEMINI_API_KEY configured in Settings > Secrets.'
            : message,
      });
    }
  });

  app.post('/api/video/animate', async (req, res) => {
    const { imageBase64, mimeType, prompt, aspectRatio } = req.body ?? {};

    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length < 32) {
      res.status(400).json({ error: 'Please upload or select a valid image to animate.' });
      return;
    }

    const allowedMimes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
    const resolvedMime =
      typeof mimeType === 'string' && allowedMimes.has(mimeType.toLowerCase())
        ? mimeType.toLowerCase() === 'image/jpg'
          ? 'image/jpeg'
          : mimeType.toLowerCase()
        : 'image/jpeg';

    const resolvedAspectRatio: '16:9' | '9:16' = aspectRatio === '9:16' ? '9:16' : '16:9';
    const motionPrompt =
      typeof prompt === 'string' && prompt.trim().length >= 3
        ? prompt.trim()
        : 'Smooth cinematic camera motion bringing this commercial trade scene to life naturally.';

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').trim();

    try {
      const ai = getGeminiClient();
      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          input: [
            {
              type: 'image',
              mime_type: resolvedMime,
              data: cleanBase64,
            },
            {
              type: 'text',
              text: motionPrompt,
            },
          ],
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: resolvedAspectRatio,
          },
        },
        { timeout: 300000 }
      );

      let videoPart = interaction.output_video;
      if (!videoPart && Array.isArray(interaction.steps)) {
        for (let i = interaction.steps.length - 1; i >= 0; i -= 1) {
          const step = interaction.steps[i];
          if (step.type === 'model_output' && Array.isArray(step.content)) {
            const found = step.content.find((c) => c.type === 'video');
            if (found && found.type === 'video') {
              videoPart = found;
              break;
            }
          }
        }
      }

      if (!videoPart || (!videoPart.data && !videoPart.uri)) {
        res.status(502).json({
          error: 'Video generation completed without a playable video payload. Please try another photo or prompt.',
        });
        return;
      }

      const outputMime = videoPart.mime_type || 'video/mp4';
      res.json({
        videoDataUrl: videoPart.data ? `data:${outputMime};base64,${videoPart.data}` : undefined,
        videoUri: videoPart.uri || undefined,
        mimeType: outputMime,
        aspectRatio: resolvedAspectRatio,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to animate image into video right now.';
      const upper = message.toUpperCase();
      const isKeyError =
        upper.includes('GEMINI_API_KEY') ||
        upper.includes('API_KEY_INVALID') ||
        upper.includes('PERMISSION_DENIED') ||
        message.includes('403');
      const isQuotaError = upper.includes('RESOURCE_EXHAUSTED') || message.includes('429');
      const isNotFound = upper.includes('NOT_FOUND') || message.includes('404');

      const status = isKeyError ? 403 : isQuotaError ? 429 : isNotFound ? 404 : 500;
      res.status(status).json({
        error: isKeyError
          ? 'Video generation with gemini-omni-1.2-flash requires a paid GEMINI_API_KEY configured in Settings > Secrets.'
          : isQuotaError
            ? 'Quota reached or paid tier required for gemini-omni-1.2-flash. Check your billing-enabled API key in Settings > Secrets.'
            : message,
      });
    }
  });

  app.post('/api/network/register', (req, res) => {
    const { businessName, contactName, email, country, role, sector, objective } = req.body ?? {};

    if (!businessName || typeof businessName !== 'string' || businessName.trim().length < 2) {
      res.status(400).json({ error: 'Please provide your business or organization name.' });
      return;
    }
    if (!contactName || typeof contactName !== 'string' || contactName.trim().length < 2) {
      res.status(400).json({ error: 'Please provide a primary contact name.' });
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailPattern.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid work email address.' });
      return;
    }
    if (!country || typeof country !== 'string' || country.trim().length < 2) {
      res.status(400).json({ error: 'Please specify your primary country or market.' });
      return;
    }
    if (!objective || typeof objective !== 'string' || objective.trim().length < 10) {
      res.status(400).json({
        error: 'Please briefly describe the buyers, suppliers, or regional opportunities you are seeking.',
      });
      return;
    }

    const referenceId = `TS-${String(store.registrations.length + 101).padStart(4, '0')}`;
    const record: NetworkRegistration = {
      referenceId,
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      email: email.trim().toLowerCase(),
      country: country.trim(),
      role: String(role || 'Enterprise'),
      sector: String(sector || 'General Trade & Manufacturing'),
      objective: objective.trim(),
      submittedAt: new Date().toISOString(),
    };

    store.registrations.push(record);
    saveStore();
    res.status(201).json({ registration: record });
  });

  app.get('/api/network/registrations-count', (_req, res) => {
    res.json({ sessionCount: store.registrations.length });
  });

  // =========================================================================
  // AUTHENTICATION & USER SESSION ROUTES
  // =========================================================================
  app.get('/api/auth/session', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ authenticated: false });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      user: sanitizeUser(user),
      business,
    });
  });

  app.post('/api/auth/signup', (req, res) => {
    const {
      firstName,
      lastName,
      businessName,
      email,
      password,
      country,
      city,
      businessType,
      industry,
    } = req.body ?? {};

    if (!businessName || typeof businessName !== 'string' || businessName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your business or organization name.' });
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailPattern.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid work email address.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (store.users.some((u) => u.email === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
      return;
    }

    const emailHandle = normalizedEmail.split('@')[0] || 'Member';
    const cleanFirst =
      typeof firstName === 'string' && firstName.trim().length >= 1
        ? firstName.trim()
        : emailHandle.charAt(0).toUpperCase() + emailHandle.slice(1);
    const cleanLast = typeof lastName === 'string' ? lastName.trim() : '';

    const now = new Date().toISOString();
    const userId = `usr_${crypto.randomUUID()}`;
    const businessId = `biz_${crypto.randomUUID()}`;

    const newUser: StoredUser = {
      id: userId,
      firstName: cleanFirst,
      lastName: cleanLast,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      language: 'en',
      createdAt: now,
    };

    const resolvedCountry = typeof country === 'string' && country.trim() ? country.trim() : 'Rwanda';
    const resolvedCity =
      typeof city === 'string' && city.trim()
        ? city.trim()
        : resolvedCountry.toLowerCase() === 'rwanda'
          ? 'Kigali'
          : '';

    const newBusiness: StoredBusiness = {
      id: businessId,
      ownerUserId: userId,
      name: businessName.trim(),
      businessType: typeof businessType === 'string' && businessType.trim() ? businessType.trim() : 'SME',
      industry: typeof industry === 'string' && industry.trim() ? industry.trim() : 'General Trade & Manufacturing',
      country: resolvedCountry,
      city: resolvedCity,
      description: '',
      productsAndServices: [],
      targetMarkets: ['Rwanda', 'East Africa'],
      requirements: '',
      verifiedRecord: false,
      updatedAt: now,
    };

    store.users.push(newUser);
    store.businesses.push(newBusiness);

    const token = crypto.randomBytes(32).toString('hex');
    store.sessions[token] = userId;
    saveStore();

    setSessionCookie(req, res, token);
    res.status(201).json({
      user: sanitizeUser(newUser),
      business: newBusiness,
      sessionToken: token,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ error: 'Please enter both your email address and password.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = store.users.find((u) => u.email === normalizedEmail);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password. If you are new to TradeSquare, please sign up first.' });
      return;
    }

    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(500).json({ error: 'Associated business record could not be loaded.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    store.sessions[token] = user.id;
    saveStore();

    setSessionCookie(req, res, token);
    res.json({
      user: sanitizeUser(user),
      business,
      sessionToken: token,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractTokenFromRequest(req);
    if (token && store.sessions[token]) {
      delete store.sessions[token];
      saveStore();
    }
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  // =========================================================================
  // AUTHENTICATED USER, BUSINESS & SETTINGS ROUTES
  // =========================================================================
  app.put('/api/user/preferences', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const { language, firstName, lastName } = req.body ?? {};
    if (language === 'en' || language === 'fr' || language === 'rw') {
      user.language = language;
    }
    if (typeof firstName === 'string' && firstName.trim()) {
      user.firstName = firstName.trim();
    }
    if (typeof lastName === 'string') {
      user.lastName = lastName.trim();
    }
    saveStore();
    res.json({ user: sanitizeUser(user) });
  });

  app.get('/api/business/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }
    res.json({ business });
  });

  app.put('/api/business/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const {
      name,
      businessType,
      industry,
      country,
      city,
      description,
      productsAndServices,
      targetMarkets,
      requirements,
    } = req.body ?? {};

    if (typeof name === 'string' && name.trim().length >= 2) {
      business.name = name.trim();
    }
    if (typeof businessType === 'string' && businessType.trim()) {
      business.businessType = businessType.trim();
    }
    if (typeof industry === 'string' && industry.trim()) {
      business.industry = industry.trim();
    }
    if (typeof country === 'string' && country.trim()) {
      business.country = country.trim();
    }
    if (typeof city === 'string') {
      business.city = city.trim();
    }
    if (typeof description === 'string') {
      business.description = description.trim();
    }
    if (Array.isArray(productsAndServices)) {
      business.productsAndServices = productsAndServices
        .map((s) => String(s).trim())
        .filter(Boolean);
    }
    if (Array.isArray(targetMarkets)) {
      business.targetMarkets = targetMarkets.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof requirements === 'string') {
      business.requirements = requirements.trim();
    }
    business.updatedAt = new Date().toISOString();
    saveStore();

    res.json({ business });
  });

  // =========================================================================
  // OPPORTUNITIES FEED, SAVING, INTEREST & PUBLISHING
  // =========================================================================
  app.get('/api/opportunities', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const typeFilter = typeof req.query.type === 'string' ? req.query.type : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const scope = typeof req.query.scope === 'string' ? req.query.scope : 'all';

    const enriched = store.opportunities
      .filter((opp) => {
        if (scope === 'saved' && !opp.savedByUserIds.includes(user.id)) return false;
        if (scope === 'mine' && opp.ownerUserId !== user.id) return false;
        if (typeFilter && typeFilter !== 'All' && opp.type !== typeFilter) return false;
        if (q) {
          const biz = store.businesses.find((b) => b.id === opp.businessId);
          const haystack = [
            opp.productOrService,
            opp.description,
            opp.type,
            opp.industry,
            opp.destinationMarket ?? '',
            biz?.name ?? '',
            biz?.country ?? '',
            biz?.city ?? '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((opp) => {
        const biz = store.businesses.find((b) => b.id === opp.businessId);
        return {
          id: opp.id,
          businessId: opp.businessId,
          businessName: biz?.name ?? 'Registered Enterprise',
          businessLocation: biz ? [biz.city, biz.country].filter(Boolean).join(', ') : 'East Africa',
          businessLogoUrl: biz?.logoUrl,
          verifiedRecord: Boolean(biz?.verifiedRecord),
          type: opp.type,
          productOrService: opp.productOrService,
          description: opp.description,
          quantityAndSpecs: opp.quantityAndSpecs,
          destinationMarket: opp.destinationMarket,
          deadline: opp.deadline,
          industry: opp.industry,
          createdAt: opp.createdAt,
          savedByMe: opp.savedByUserIds.includes(user.id),
          interestExpressedByMe: opp.interestedUserIds.includes(user.id),
          isOwnOpportunity: opp.ownerUserId === user.id,
        };
      });

    res.json({ opportunities: enriched });
  });

  app.post('/api/opportunities', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const { type, productOrService, description, quantityAndSpecs, destinationMarket, deadline, industry } =
      req.body ?? {};

    if (!productOrService || typeof productOrService !== 'string' || productOrService.trim().length < 3) {
      res.status(400).json({ error: 'Please enter a product or service title.' });
      return;
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      res.status(400).json({ error: 'Please provide a clear description (at least 10 characters).' });
      return;
    }

    const opp: StoredOpportunity = {
      id: `opp_${crypto.randomUUID()}`,
      ownerUserId: user.id,
      businessId: business.id,
      type: typeof type === 'string' && type.trim() ? type.trim() : 'Buyer Request',
      productOrService: productOrService.trim(),
      description: description.trim(),
      quantityAndSpecs:
        typeof quantityAndSpecs === 'string' && quantityAndSpecs.trim()
          ? quantityAndSpecs.trim()
          : undefined,
      destinationMarket:
        typeof destinationMarket === 'string' && destinationMarket.trim()
          ? destinationMarket.trim()
          : undefined,
      deadline:
        typeof deadline === 'string' && deadline.trim() ? deadline.trim() : undefined,
      industry:
        typeof industry === 'string' && industry.trim() ? industry.trim() : business.industry,
      createdAt: new Date().toISOString(),
      savedByUserIds: [],
      interestedUserIds: [],
    };

    store.opportunities.push(opp);
    store.activities.unshift({
      id: `act_${crypto.randomUUID()}`,
      userId: user.id,
      kind: 'response',
      title: `Published ${opp.type}: ${opp.productOrService}`,
      detail: `Visible to businesses discovering opportunities in ${opp.industry}.`,
      createdAt: opp.createdAt,
      relatedPage: 'opportunities',
      relatedId: opp.id,
    });
    saveStore();

    res.status(201).json({
      opportunity: {
        ...opp,
        businessName: business.name,
        businessLocation: [business.city, business.country].filter(Boolean).join(', '),
        businessLogoUrl: business.logoUrl,
        verifiedRecord: business.verifiedRecord,
        savedByMe: false,
        interestExpressedByMe: false,
        isOwnOpportunity: true,
      },
    });
  });

  app.post('/api/opportunities/:id/save', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const opp = store.opportunities.find((o) => o.id === req.params.id);
    if (!opp) {
      res.status(404).json({ error: 'Opportunity not found.' });
      return;
    }

    const idx = opp.savedByUserIds.indexOf(user.id);
    let saved = false;
    if (idx === -1) {
      opp.savedByUserIds.push(user.id);
      saved = true;
      store.activities.unshift({
        id: `act_${crypto.randomUUID()}`,
        userId: user.id,
        kind: 'saved_update',
        title: `Saved opportunity: ${opp.productOrService}`,
        detail: `${opp.type} in ${opp.industry}`,
        createdAt: new Date().toISOString(),
        relatedPage: 'opportunities',
        relatedId: opp.id,
      });
    } else {
      opp.savedByUserIds.splice(idx, 1);
      saved = false;
    }

    saveStore();
    res.json({ saved });
  });

  app.post('/api/opportunities/:id/interest', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const myBusiness = getBusinessForUser(user.id);
    if (!myBusiness) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const opp = store.opportunities.find((o) => o.id === req.params.id);
    if (!opp) {
      res.status(404).json({ error: 'Opportunity not found.' });
      return;
    }
    if (opp.ownerUserId === user.id) {
      res.status(400).json({ error: 'You cannot express commercial interest in your own listing.' });
      return;
    }

    const targetBusiness = store.businesses.find((b) => b.id === opp.businessId);
    const now = new Date().toISOString();

    if (!opp.interestedUserIds.includes(user.id)) {
      opp.interestedUserIds.push(user.id);
    }

    const enquiry: StoredEnquiry = {
      id: `enq_${crypto.randomUUID()}`,
      opportunityId: opp.id,
      fromUserId: user.id,
      toUserId: opp.ownerUserId,
      fromBusinessName: myBusiness.name,
      toBusinessName: targetBusiness?.name ?? 'Registered Enterprise',
      subject: `Enquiry: ${opp.productOrService}`,
      createdAt: now,
    };
    store.enquiries.push(enquiry);

    // Ensure or create a real message thread between these two users
    let thread = store.threads.find(
      (t) =>
        t.opportunityId === opp.id &&
        t.participantUserIds.includes(user.id) &&
        t.participantUserIds.includes(opp.ownerUserId)
    );

    const noteText =
      typeof req.body?.message === 'string' && req.body.message.trim()
        ? req.body.message.trim()
        : `${myBusiness.name} expressed commercial interest in "${opp.productOrService}" (${opp.type}).`;

    if (!thread) {
      thread = {
        id: `thr_${crypto.randomUUID()}`,
        participantUserIds: [user.id, opp.ownerUserId],
        subject: `${opp.type}: ${opp.productOrService}`,
        opportunityId: opp.id,
        lastMessageAt: now,
        messages: [],
      };
      store.threads.push(thread);
    }

    thread.lastMessageAt = now;
    thread.messages.push({
      id: `msg_${crypto.randomUUID()}`,
      threadId: thread.id,
      senderUserId: user.id,
      senderName: `${user.firstName} ${user.lastName}`.trim(),
      senderBusinessName: myBusiness.name,
      body: noteText,
      createdAt: now,
    });

    store.activities.unshift(
      {
        id: `act_${crypto.randomUUID()}`,
        userId: opp.ownerUserId,
        kind: 'enquiry',
        title: `New business enquiry from ${myBusiness.name}`,
        detail: `Regarding ${opp.productOrService}`,
        createdAt: now,
        relatedPage: 'messages',
        relatedId: thread.id,
      },
      {
        id: `act_${crypto.randomUUID()}`,
        userId: user.id,
        kind: 'message',
        title: `Enquiry sent to ${targetBusiness?.name ?? 'business'}`,
        detail: `Regarding ${opp.productOrService}`,
        createdAt: now,
        relatedPage: 'messages',
        relatedId: thread.id,
      }
    );

    saveStore();
    res.status(201).json({ threadId: thread.id, enquiry });
  });

  // =========================================================================
  // DISCOVERY SEARCH & EXPLAINABLE BUSINESS RECOMMENDATIONS
  // =========================================================================
  app.get('/api/discover', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const myBusiness = getBusinessForUser(user.id);
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const roleFilter = typeof req.query.businessType === 'string' ? req.query.businessType : 'All';
    const countryFilter = typeof req.query.country === 'string' ? req.query.country : 'All';

    const businesses = store.businesses
      .filter((b) => b.ownerUserId !== user.id)
      .filter((b) => {
        if (roleFilter !== 'All' && b.businessType !== roleFilter) return false;
        if (
          countryFilter !== 'All' &&
          !b.country.toLowerCase().includes(countryFilter.toLowerCase())
        ) {
          return false;
        }
        if (q) {
          const hay = [
            b.name,
            b.businessType,
            b.industry,
            b.country,
            b.city,
            b.description,
            ...b.productsAndServices,
            ...b.targetMarkets,
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((b) => {
        const reasons: string[] = [];
        if (myBusiness) {
          if (b.industry.toLowerCase() === myBusiness.industry.toLowerCase()) {
            reasons.push(`operates in your selected industry (${b.industry})`);
          }
          const sharedMarkets = b.targetMarkets.filter((m) =>
            myBusiness.targetMarkets.some((mm) => mm.toLowerCase() === m.toLowerCase())
          );
          if (sharedMarkets.length > 0) {
            reasons.push(`serves a market you are interested in (${sharedMarkets.join(', ')})`);
          } else if (
            myBusiness.targetMarkets.some((mm) =>
              b.country.toLowerCase().includes(mm.toLowerCase())
            )
          ) {
            reasons.push(`is located in your target market (${b.country})`);
          }
        }
        const explanation =
          reasons.length > 0
            ? `Recommended because this business ${reasons.join(' and ')}.`
            : `Registered ${b.businessType.toLowerCase()} operating in ${b.city ? `${b.city}, ` : ''}${b.country}.`;

        return {
          business: b,
          explanation,
        };
      });

    const opportunities = store.opportunities
      .filter((opp) => {
        if (!q) return true;
        const biz = store.businesses.find((b) => b.id === opp.businessId);
        const hay = [
          opp.productOrService,
          opp.description,
          opp.type,
          opp.industry,
          opp.destinationMarket ?? '',
          biz?.name ?? '',
          biz?.country ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .map((opp) => {
        const biz = store.businesses.find((b) => b.id === opp.businessId);
        return {
          id: opp.id,
          businessId: opp.businessId,
          businessName: biz?.name ?? 'Registered Enterprise',
          businessLocation: biz ? [biz.city, biz.country].filter(Boolean).join(', ') : 'East Africa',
          businessLogoUrl: biz?.logoUrl,
          verifiedRecord: Boolean(biz?.verifiedRecord),
          type: opp.type,
          productOrService: opp.productOrService,
          description: opp.description,
          quantityAndSpecs: opp.quantityAndSpecs,
          destinationMarket: opp.destinationMarket,
          deadline: opp.deadline,
          industry: opp.industry,
          createdAt: opp.createdAt,
          savedByMe: opp.savedByUserIds.includes(user.id),
          interestExpressedByMe: opp.interestedUserIds.includes(user.id),
          isOwnOpportunity: opp.ownerUserId === user.id,
        };
      });

    res.json({ businesses, opportunities });
  });

  // =========================================================================
  // REAL ACTIVITY & MESSAGES
  // =========================================================================
  app.get('/api/activity', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const items = store.activities
      .filter((a) => a.userId === user.id)
      .slice(0, 10);

    res.json({ activities: items });
  });

  app.get('/api/messages', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const myThreads = store.threads
      .filter((t) => t.participantUserIds.includes(user.id))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      .map((t) => {
        const otherId = t.participantUserIds.find((id) => id !== user.id) ?? user.id;
        const otherUser = store.users.find((u) => u.id === otherId);
        const otherBiz = getBusinessForUser(otherId);
        const lastMsg = t.messages[t.messages.length - 1];
        return {
          id: t.id,
          participantUserIds: t.participantUserIds,
          counterpartyName: otherUser
            ? `${otherUser.firstName} ${otherUser.lastName}`.trim()
            : 'Business Contact',
          counterpartyBusinessName: otherBiz?.name ?? 'Registered Enterprise',
          counterpartyLocation: otherBiz
            ? [otherBiz.city, otherBiz.country].filter(Boolean).join(', ')
            : 'East Africa',
          subject: t.subject,
          opportunityId: t.opportunityId,
          lastMessageAt: t.lastMessageAt,
          lastMessagePreview: lastMsg?.body ?? '',
          unreadCount: 0,
          messages: t.messages,
        };
      });

    res.json({ threads: myThreads });
  });

  app.post('/api/messages', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const myBusiness = getBusinessForUser(user.id);
    if (!myBusiness) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const { threadId, recipientBusinessId, subject, body } = req.body ?? {};
    if (!body || typeof body !== 'string' || body.trim().length < 1) {
      res.status(400).json({ error: 'Please enter a message.' });
      return;
    }

    const now = new Date().toISOString();
    let thread: StoredThread | undefined;

    if (typeof threadId === 'string' && threadId) {
      thread = store.threads.find(
        (t) => t.id === threadId && t.participantUserIds.includes(user.id)
      );
      if (!thread) {
        res.status(404).json({ error: 'Conversation thread not found.' });
        return;
      }
    } else if (typeof recipientBusinessId === 'string' && recipientBusinessId) {
      const targetBiz = store.businesses.find((b) => b.id === recipientBusinessId);
      if (!targetBiz) {
        res.status(404).json({ error: 'Target business not found.' });
        return;
      }
      if (targetBiz.ownerUserId === user.id) {
        res.status(400).json({ error: 'Cannot start a message thread with your own business.' });
        return;
      }
      thread = store.threads.find(
        (t) =>
          !t.opportunityId &&
          t.participantUserIds.includes(user.id) &&
          t.participantUserIds.includes(targetBiz.ownerUserId)
      );
      if (!thread) {
        thread = {
          id: `thr_${crypto.randomUUID()}`,
          participantUserIds: [user.id, targetBiz.ownerUserId],
          subject:
            typeof subject === 'string' && subject.trim()
              ? subject.trim()
              : `Commercial Connection — ${myBusiness.name}`,
          lastMessageAt: now,
          messages: [],
        };
        store.threads.push(thread);
      }
    } else {
      res.status(400).json({ error: 'Specify a threadId or recipientBusinessId.' });
      return;
    }

    const newMsg: StoredMessage = {
      id: `msg_${crypto.randomUUID()}`,
      threadId: thread.id,
      senderUserId: user.id,
      senderName: `${user.firstName} ${user.lastName}`.trim(),
      senderBusinessName: myBusiness.name,
      body: body.trim(),
      createdAt: now,
    };

    thread.lastMessageAt = now;
    thread.messages.push(newMsg);

    const otherId = thread.participantUserIds.find((id) => id !== user.id);
    if (otherId) {
      store.activities.unshift({
        id: `act_${crypto.randomUUID()}`,
        userId: otherId,
        kind: 'message',
        title: `New message from ${myBusiness.name}`,
        detail: body.trim().slice(0, 90),
        createdAt: now,
        relatedPage: 'messages',
        relatedId: thread.id,
      });
    }

    saveStore();
    res.status(201).json({ threadId: thread.id, message: newMsg });
  });

  // =========================================================================
  // TRADESQUARE AI & REGIONAL TRADE INSIGHTS (Grounded in Real DB + Gemini)
  // =========================================================================
  app.post('/api/ai/discover-assist', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const myBusiness = getBusinessForUser(user.id);
    const { query, intent } = req.body ?? {};
    const effectiveQuery =
      typeof query === 'string' && query.trim()
        ? query.trim()
        : typeof intent === 'string' && intent.trim()
          ? intent.trim()
          : '';

    if (effectiveQuery.length < 4) {
      res.status(400).json({ error: 'Please enter a search or business question.' });
      return;
    }

    const candidateBusinesses = store.businesses
      .filter((b) => b.ownerUserId !== user.id)
      .map((b) => ({
        id: b.id,
        name: b.name,
        businessType: b.businessType,
        industry: b.industry,
        location: `${b.city}, ${b.country}`,
        productsAndServices: b.productsAndServices,
        targetMarkets: b.targetMarkets,
      }));

    const candidateOpportunities = store.opportunities.map((opp) => ({
      id: opp.id,
      type: opp.type,
      productOrService: opp.productOrService,
      industry: opp.industry,
      destinationMarket: opp.destinationMarket,
      description: opp.description,
    }));

    try {
      const ai = getGeminiClient();

      const contextPayload = {
        userBusiness: myBusiness
          ? {
              name: myBusiness.name,
              businessType: myBusiness.businessType,
              industry: myBusiness.industry,
              location: `${myBusiness.city}, ${myBusiness.country}`,
              productsAndServices: myBusiness.productsAndServices,
              targetMarkets: myBusiness.targetMarkets,
              requirements: myBusiness.requirements,
              description: myBusiness.description,
            }
          : null,
        availableRegisteredBusinesses: candidateBusinesses,
        availablePublishedOpportunities: candidateOpportunities,
        userRequest: effectiveQuery,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: JSON.stringify(contextPayload),
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          systemInstruction: [
            'You are TradeSquare AI, the business intelligence and partner-matching engine inside the TradeSquare B2B network.',
            'Initial regional focus is Rwanda and wider East Africa.',
            'STRICT GROUNDING RULES:',
            '- ONLY reference businessId / businessName from availableRegisteredBusinesses, and opportunityId / title from availablePublishedOpportunities.',
            '- If availableRegisteredBusinesses or availablePublishedOpportunities is empty, return empty matchedBusinesses / matchedOpportunities arrays and honestly explain what the user can publish or search for next. NEVER invent companies, fake buyers, match scores, or verification claims.',
            '- Provide practical, plain-language commercial guidance for an ordinary business owner.',
            '- Provide a concise suggestedSearchQuery for filtering the Discover feed.',
          ].join('\n'),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedSearchQuery: { type: Type.STRING },
              matchedBusinesses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    businessId: { type: Type.STRING },
                    businessName: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['businessId', 'businessName', 'reason'],
                },
              },
              matchedOpportunities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    opportunityId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['opportunityId', 'title', 'reason'],
                },
              },
            },
            required: [
              'summary',
              'keyInsights',
              'recommendedActions',
              'matchedBusinesses',
              'matchedOpportunities',
            ],
          },
        },
      });

      const raw = (response.text ?? '').trim();
      if (!raw) {
        res.status(502).json({ error: 'AI service returned an empty response.' });
        return;
      }

      const parsed = JSON.parse(raw);
      // Enforce ID integrity so hallucinated IDs can never slip through
      const validBizIds = new Set(candidateBusinesses.map((b) => b.id));
      const validOppIds = new Set(candidateOpportunities.map((o) => o.id));
      parsed.matchedBusinesses = (parsed.matchedBusinesses ?? []).filter((m: { businessId: string }) =>
        validBizIds.has(m.businessId)
      );
      parsed.matchedOpportunities = (parsed.matchedOpportunities ?? []).filter(
        (m: { opportunityId: string }) => validOppIds.has(m.opportunityId)
      );

      res.json({ result: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to reach TradeSquare AI.';
      const isKeyOrPermission =
        message.includes('API_KEY') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('403') ||
        message.includes('configured');
      const status = isKeyOrPermission
        ? 503
        : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
          ? 429
          : 500;
      res.status(status).json({
        error:
          status === 503
            ? 'TradeSquare AI service is currently unavailable. Please try again later.'
            : status === 429
              ? 'Too many AI requests right now. Please wait a moment and try again.'
              : 'Unable to complete AI analysis right now. Please try again.',
      });
    }
  });

  app.get('/api/intelligence/regional', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const liveMetrics = {
      activeBuyerRequests: store.opportunities.filter(
        (o) => o.type === 'Buyer Request' || o.type === 'Procurement'
      ).length,
      activeSupplierOffers: store.opportunities.filter((o) => o.type === 'Supplier Offer').length,
      confirmedEnquiries: store.enquiries.length,
      registeredEnterprises: store.businesses.length,
    };

    const now = Date.now();
    if (cachedRegionalAnalysis && now - cachedRegionalAnalysis.generatedAt < 1000 * 60 * 30) {
      res.json({
        liveMetrics,
        marketAnalysis: cachedRegionalAnalysis.data,
      });
      return;
    }

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents:
          'Provide 3 concise, factual regional trade insights focused on Rwanda and East Africa (EAC cross-border trade corridors, agro-processing/manufacturing value chains, and regional compliance/standards). Never fabricate live buyer counts or unverified percentages.',
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          systemInstruction:
            'Classify each insight clearly as either "Historical Trade Pattern", "Market Analysis", or "Potential Opportunity". Keep titles concise and details under 30 words each. Never claim live demand numbers.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              region: { type: Type.STRING },
              label: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      enum: ['Historical Trade Pattern', 'Market Analysis', 'Potential Opportunity'],
                    },
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                  },
                  required: ['category', 'title', 'detail'],
                },
              },
            },
            required: ['region', 'label', 'items'],
          },
        },
      });

      const raw = (response.text ?? '').trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        cachedRegionalAnalysis = {
          generatedAt: now,
          data: parsed,
        };
        res.json({
          liveMetrics,
          marketAnalysis: parsed,
        });
        return;
      }
      res.json({
        liveMetrics,
        marketAnalysis: null,
        analysisError: 'Regional market analysis is currently unavailable.',
      });
    } catch {
      res.json({
        liveMetrics,
        marketAnalysis: null,
        analysisError:
          'Regional market analysis is temporarily unavailable. Live network metrics above remain accurate.',
      });
    }
  });

  // =========================================================================
  // BUSINESS COMPLIANCE & TRADE READINESS CENTRE ROUTES (OWNER-ONLY)
  // =========================================================================
  app.get('/api/compliance/workspace', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }
    res.json({ workspace: buildComplianceWorkspaceForBusiness(business) });
  });

  app.get('/api/compliance/rules', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    res.json({
      version: REGULATORY_RULES_VERSION,
      lastReviewed: REGULATORY_RULES_LAST_REVIEWED,
      rules: REGULATORY_RULES,
      sources: REGULATORY_SOURCES,
    });
  });

  app.put('/api/compliance/profile', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const body = req.body ?? {};
    const existing = getOrCreateComplianceProfile(business);

    const updated: BusinessRequirementsProfile = {
      businessId: business.id,
      registrationCountry:
        typeof body.registrationCountry === 'string' && body.registrationCountry.trim()
          ? body.registrationCountry.trim()
          : existing.registrationCountry,
      operationCountry:
        typeof body.operationCountry === 'string' && body.operationCountry.trim()
          ? body.operationCountry.trim()
          : existing.operationCountry,
      establishmentCountry:
        typeof body.establishmentCountry === 'string' && body.establishmentCountry.trim()
          ? body.establishmentCountry.trim()
          : existing.establishmentCountry,
      legalStructure:
        typeof body.legalStructure === 'string' && body.legalStructure.trim()
          ? body.legalStructure.trim()
          : existing.legalStructure,
      industry:
        typeof body.industry === 'string' && body.industry.trim()
          ? body.industry.trim()
          : existing.industry,
      activities: Array.isArray(body.activities)
        ? body.activities.map((a: unknown) => String(a).trim()).filter(Boolean)
        : existing.activities,
      products: Array.isArray(body.products)
        ? body.products
            .filter((p: unknown) => p && typeof p === 'object' && typeof (p as { name?: unknown }).name === 'string')
            .map((p: Record<string, unknown>, idx: number) => ({
              id: typeof p.id === 'string' && p.id ? p.id : `prod_${crypto.randomUUID().slice(0, 8)}_${idx}`,
              name: String(p.name).trim(),
              category: typeof p.category === 'string' && p.category.trim() ? p.category.trim() : existing.industry,
              productType:
                typeof p.productType === 'string' && p.productType.trim()
                  ? (p.productType.trim() as BusinessRequirementsProfile['products'][number]['productType'])
                  : 'Physical Good',
              materialsOrIngredients:
                typeof p.materialsOrIngredients === 'string' && p.materialsOrIngredients.trim()
                  ? p.materialsOrIngredients.trim()
                  : undefined,
              intendedUse:
                typeof p.intendedUse === 'string' && p.intendedUse.trim()
                  ? p.intendedUse.trim()
                  : undefined,
              productionMethod:
                typeof p.productionMethod === 'string' && p.productionMethod.trim()
                  ? p.productionMethod.trim()
                  : undefined,
              capacityOrQuantity:
                typeof p.capacityOrQuantity === 'string' && p.capacityOrQuantity.trim()
                  ? p.capacityOrQuantity.trim()
                  : undefined,
              packagingType:
                typeof p.packagingType === 'string' && p.packagingType.trim()
                  ? p.packagingType.trim()
                  : undefined,
              targetCustomers:
                typeof p.targetCustomers === 'string' && p.targetCustomers.trim()
                  ? p.targetCustomers.trim()
                  : undefined,
              hsCode:
                typeof p.hsCode === 'string' && p.hsCode.trim() ? p.hsCode.trim() : undefined,
              hsCodeConfidence:
                p.hsCode && typeof p.hsCode === 'string' && p.hsCode.trim()
                  ? 'Confirmed'
                  : 'Not Established',
            }))
            .filter((p: { name: string }) => p.name.length > 0)
        : existing.products,
      targetMarkets: Array.isArray(body.targetMarkets)
        ? body.targetMarkets.map((m: unknown) => String(m).trim()).filter(Boolean)
        : existing.targetMarkets,
      buyerSpecificNotes:
        typeof body.buyerSpecificNotes === 'string'
          ? body.buyerSpecificNotes.trim()
          : existing.buyerSpecificNotes,
      updatedAt: new Date().toISOString(),
    };

    const idx = store.complianceProfiles.findIndex((p) => p.businessId === business.id);
    if (idx >= 0) {
      store.complianceProfiles[idx] = updated;
    } else {
      store.complianceProfiles.push(updated);
    }

    // Keep core business profile aligned
    business.country = updated.registrationCountry;
    business.industry = updated.industry;
    business.targetMarkets = updated.targetMarkets;
    if (updated.products.length > 0) {
      business.productsAndServices = updated.products.map((p) => p.name);
    }
    business.updatedAt = updated.updatedAt;

    saveStore();
    res.json({
      business,
      workspace: buildComplianceWorkspaceForBusiness(business),
    });
  });

  app.put('/api/compliance/checklist/:ruleId/action', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const ruleId = String(req.params.ruleId || '').trim();
    if (!ruleId) {
      res.status(400).json({ error: 'Invalid checklist item reference.' });
      return;
    }

    const { markedNotApplicable, notApplicableReason, clarificationRequested, clarificationNote } =
      req.body ?? {};

    const now = new Date().toISOString();
    const existingIdx = store.checklistActions.findIndex(
      (a) => a.businessId === business.id && a.ruleId === ruleId
    );
    const prev = existingIdx >= 0 ? store.checklistActions[existingIdx] : undefined;

    const record: StoredChecklistAction = {
      businessId: business.id,
      ruleId,
      markedNotApplicable:
        typeof markedNotApplicable === 'boolean'
          ? markedNotApplicable
          : prev?.markedNotApplicable ?? false,
      notApplicableReason:
        typeof notApplicableReason === 'string'
          ? notApplicableReason.trim()
          : prev?.notApplicableReason,
      clarificationRequested:
        typeof clarificationRequested === 'boolean'
          ? clarificationRequested
          : prev?.clarificationRequested ?? false,
      clarificationNote:
        typeof clarificationNote === 'string'
          ? clarificationNote.trim()
          : prev?.clarificationNote,
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      store.checklistActions[existingIdx] = record;
    } else {
      store.checklistActions.push(record);
    }

    saveStore();
    res.json({ workspace: buildComplianceWorkspaceForBusiness(business) });
  });

  app.post('/api/compliance/documents', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const {
      checklistRuleId,
      documentType,
      category,
      title,
      issuingAuthority,
      referenceNumber,
      issueDate,
      expiryDate,
      countryOfIssue,
      relatedProductOrScope,
      notes,
      fileName,
      mimeType,
      base64Content,
      submitForReview,
    } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      res.status(400).json({ error: 'Please provide a document title.' });
      return;
    }
    if (!documentType || typeof documentType !== 'string' || !documentType.trim()) {
      res.status(400).json({ error: 'Please specify the document type.' });
      return;
    }
    if (!issuingAuthority || typeof issuingAuthority !== 'string' || !issuingAuthority.trim()) {
      res.status(400).json({ error: 'Please specify the issuing authority or organisation.' });
      return;
    }
    if (!base64Content || typeof base64Content !== 'string' || !mimeType || typeof mimeType !== 'string') {
      res.status(400).json({ error: 'Please select a valid PDF, JPG, JPEG, or PNG file to upload.' });
      return;
    }

    try {
      const savedFile = validateAndSaveBase64Document({
        businessId: business.id,
        base64Content,
        mimeType,
        fileName: typeof fileName === 'string' && fileName.trim() ? fileName.trim() : 'document',
      });

      const now = new Date().toISOString();
      // Uploaded documents start as 'Uploaded' or 'Pending review' — NEVER auto-Verified
      const initialStatus: DocumentStatus = submitForReview ? 'Pending review' : 'Uploaded';

      const newDoc: StoredComplianceDocument = {
        id: `doc_${crypto.randomUUID()}`,
        businessId: business.id,
        checklistRuleId:
          typeof checklistRuleId === 'string' && checklistRuleId.trim()
            ? checklistRuleId.trim()
            : undefined,
        documentType: documentType.trim(),
        category: (category as DocumentCategory) || 'BUSINESS_REGISTRATION',
        title: title.trim(),
        issuingAuthority: issuingAuthority.trim(),
        referenceNumber:
          typeof referenceNumber === 'string' && referenceNumber.trim()
            ? referenceNumber.trim()
            : undefined,
        issueDate:
          typeof issueDate === 'string' && issueDate.trim() ? issueDate.trim() : undefined,
        expiryDate:
          typeof expiryDate === 'string' && expiryDate.trim() ? expiryDate.trim() : undefined,
        countryOfIssue:
          typeof countryOfIssue === 'string' && countryOfIssue.trim()
            ? countryOfIssue.trim()
            : business.country || 'Rwanda',
        relatedProductOrScope:
          typeof relatedProductOrScope === 'string' && relatedProductOrScope.trim()
            ? relatedProductOrScope.trim()
            : undefined,
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
        fileName: typeof fileName === 'string' && fileName.trim() ? fileName.trim() : `upload${savedFile.mimeType === 'application/pdf' ? '.pdf' : '.jpg'}`,
        mimeType: savedFile.mimeType,
        fileSizeBytes: savedFile.fileSizeBytes,
        status: initialStatus,
        storageKey: savedFile.storageKey,
        uploadedAt: now,
        updatedAt: now,
      };

      store.complianceDocuments.push(newDoc);
      saveStore();

      res.status(201).json({
        document: sanitizeComplianceDocument(newDoc),
        workspace: buildComplianceWorkspaceForBusiness(business),
      });
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to process uploaded document.',
      });
    }
  });

  app.put('/api/compliance/documents/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const doc = store.complianceDocuments.find(
      (d) => d.id === req.params.id && d.businessId === business.id
    );
    if (!doc) {
      res.status(404).json({ error: 'Document not found or access denied.' });
      return;
    }

    const body = req.body ?? {};
    if (body.base64Content && body.mimeType) {
      try {
        const savedFile = validateAndSaveBase64Document({
          businessId: business.id,
          base64Content: String(body.base64Content),
          mimeType: String(body.mimeType),
          fileName: typeof body.fileName === 'string' ? body.fileName : doc.fileName,
        });
        deleteStoredDocumentFile(business.id, doc.storageKey);
        doc.storageKey = savedFile.storageKey;
        doc.mimeType = savedFile.mimeType;
        doc.fileSizeBytes = savedFile.fileSizeBytes;
        if (typeof body.fileName === 'string' && body.fileName.trim()) {
          doc.fileName = body.fileName.trim();
        }
        doc.aiAnalysis = undefined;
        doc.status = body.submitForReview ? 'Pending review' : 'Uploaded';
      } catch (err: unknown) {
        res.status(400).json({
          error: err instanceof Error ? err.message : 'Unable to replace document file.',
        });
        return;
      }
    }

    if (typeof body.title === 'string' && body.title.trim()) doc.title = body.title.trim();
    if (typeof body.documentType === 'string' && body.documentType.trim()) doc.documentType = body.documentType.trim();
    if (typeof body.category === 'string' && body.category.trim()) doc.category = body.category as DocumentCategory;
    if (typeof body.issuingAuthority === 'string' && body.issuingAuthority.trim()) doc.issuingAuthority = body.issuingAuthority.trim();
    if (typeof body.referenceNumber === 'string') doc.referenceNumber = body.referenceNumber.trim() || undefined;
    if (typeof body.issueDate === 'string') doc.issueDate = body.issueDate.trim() || undefined;
    if (typeof body.expiryDate === 'string') doc.expiryDate = body.expiryDate.trim() || undefined;
    if (typeof body.countryOfIssue === 'string' && body.countryOfIssue.trim()) doc.countryOfIssue = body.countryOfIssue.trim();
    if (typeof body.relatedProductOrScope === 'string') doc.relatedProductOrScope = body.relatedProductOrScope.trim() || undefined;
    if (typeof body.notes === 'string') doc.notes = body.notes.trim() || undefined;
    if (typeof body.checklistRuleId === 'string') doc.checklistRuleId = body.checklistRuleId.trim() || undefined;
    // Allow user to toggle between Uploaded and Pending review only (never self-Verify)
    if (body.status === 'Uploaded' || body.status === 'Pending review') {
      doc.status = body.status;
    }

    doc.updatedAt = new Date().toISOString();
    saveStore();

    res.json({
      document: sanitizeComplianceDocument(doc),
      workspace: buildComplianceWorkspaceForBusiness(business),
    });
  });

  app.get('/api/compliance/documents/:id/file', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const doc = store.complianceDocuments.find(
      (d) => d.id === req.params.id && d.businessId === business.id
    );
    if (!doc) {
      res.status(404).json({ error: 'Document not found or access denied.' });
      return;
    }

    const buffer = readStoredDocumentBuffer(business.id, doc.storageKey);
    if (!buffer) {
      res.status(404).json({ error: 'Stored file could not be located on the server.' });
      return;
    }

    const downloadMode = req.query.download === '1';
    const safeName = doc.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${downloadMode ? 'attachment' : 'inline'}; filename="${safeName}"`
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  });

  app.post('/api/compliance/documents/:id/analyze', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const doc = store.complianceDocuments.find(
      (d) => d.id === req.params.id && d.businessId === business.id
    );
    if (!doc) {
      res.status(404).json({ error: 'Document not found or access denied.' });
      return;
    }

    const buffer = readStoredDocumentBuffer(business.id, doc.storageKey);
    if (!buffer) {
      res.status(404).json({ error: 'Document binary is missing on disk. Please re-upload the file.' });
      return;
    }

    try {
      const profile = getOrCreateComplianceProfile(business);
      const extraction = await analyzeUploadedDocumentWithAi({
        fileBuffer: buffer,
        mimeType: doc.mimeType,
        fileName: doc.fileName,
        documentRecord: sanitizeComplianceDocument(doc),
        businessName: business.name,
        profile,
      });

      doc.aiAnalysis = extraction;
      doc.updatedAt = new Date().toISOString();
      saveStore();

      res.json({
        document: sanitizeComplianceDocument(doc),
        workspace: buildComplianceWorkspaceForBusiness(business),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to analyze document right now.';
      const isKeyError =
        message.includes('API_KEY') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('403') ||
        message.includes('configured');
      const status = isKeyError
        ? 503
        : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
          ? 429
          : 500;
      res.status(status).json({
        error:
          status === 503
            ? 'AI document analysis requires a valid GEMINI_API_KEY configured in Settings > Secrets.'
            : status === 429
              ? 'AI rate limit reached. Please try again in a moment.'
              : message,
      });
    }
  });

  app.post('/api/compliance/documents/:id/confirm-analysis', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const doc = store.complianceDocuments.find(
      (d) => d.id === req.params.id && d.businessId === business.id
    );
    if (!doc) {
      res.status(404).json({ error: 'Document not found or access denied.' });
      return;
    }

    const body = req.body ?? {};
    if (typeof body.title === 'string' && body.title.trim()) doc.title = body.title.trim();
    if (typeof body.documentType === 'string' && body.documentType.trim()) doc.documentType = body.documentType.trim();
    if (typeof body.issuingAuthority === 'string' && body.issuingAuthority.trim()) doc.issuingAuthority = body.issuingAuthority.trim();
    if (typeof body.referenceNumber === 'string') doc.referenceNumber = body.referenceNumber.trim() || undefined;
    if (typeof body.issueDate === 'string') doc.issueDate = body.issueDate.trim() || undefined;
    if (typeof body.expiryDate === 'string') doc.expiryDate = body.expiryDate.trim() || undefined;
    if (typeof body.relatedProductOrScope === 'string') doc.relatedProductOrScope = body.relatedProductOrScope.trim() || undefined;

    if (doc.aiAnalysis) {
      doc.aiAnalysis = {
        ...doc.aiAnalysis,
        confirmedByUser: true,
      };
    }
    doc.updatedAt = new Date().toISOString();
    saveStore();

    res.json({
      document: sanitizeComplianceDocument(doc),
      workspace: buildComplianceWorkspaceForBusiness(business),
    });
  });

  app.delete('/api/compliance/documents/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const idx = store.complianceDocuments.findIndex(
      (d) => d.id === req.params.id && d.businessId === business.id
    );
    if (idx === -1) {
      res.status(404).json({ error: 'Document not found or access denied.' });
      return;
    }

    const [removed] = store.complianceDocuments.splice(idx, 1);
    deleteStoredDocumentFile(business.id, removed.storageKey);
    saveStore();

    res.json({
      ok: true,
      workspace: buildComplianceWorkspaceForBusiness(business),
    });
  });

  // Experience & Performance Evidence Routes
  app.post('/api/compliance/experience', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const body = req.body ?? {};
    if (!body.projectOrContractTitle || typeof body.projectOrContractTitle !== 'string' || body.projectOrContractTitle.trim().length < 2) {
      res.status(400).json({ error: 'Please provide the project or contract title.' });
      return;
    }
    if (!body.clientOrContractingOrg || typeof body.clientOrContractingOrg !== 'string' || !body.clientOrContractingOrg.trim()) {
      res.status(400).json({ error: 'Please specify the client or contracting organisation.' });
      return;
    }

    let supportingStorageKey: string | undefined;
    let supportingFileName: string | undefined;
    let supportingMimeType: string | undefined;
    let supportingFileSizeBytes: number | undefined;

    if (body.base64Content && body.mimeType) {
      try {
        const saved = validateAndSaveBase64Document({
          businessId: business.id,
          base64Content: String(body.base64Content),
          mimeType: String(body.mimeType),
          fileName: typeof body.supportingFileName === 'string' ? body.supportingFileName : 'evidence',
        });
        supportingStorageKey = saved.storageKey;
        supportingMimeType = saved.mimeType;
        supportingFileSizeBytes = saved.fileSizeBytes;
        supportingFileName =
          typeof body.supportingFileName === 'string' && body.supportingFileName.trim()
            ? body.supportingFileName.trim()
            : 'supporting-evidence';
      } catch (err: unknown) {
        res.status(400).json({
          error: err instanceof Error ? err.message : 'Invalid supporting evidence file.',
        });
        return;
      }
    }

    const now = new Date().toISOString();
    const record: StoredExperienceEvidence = {
      id: `exp_${crypto.randomUUID()}`,
      businessId: business.id,
      evidenceType: (body.evidenceType as ExperienceEvidenceType) || 'Certificate of Completion',
      clientOrContractingOrg: String(body.clientOrContractingOrg).trim(),
      projectOrContractTitle: String(body.projectOrContractTitle).trim(),
      sector: typeof body.sector === 'string' && body.sector.trim() ? body.sector.trim() : business.industry,
      contractPeriod: typeof body.contractPeriod === 'string' ? body.contractPeriod.trim() : '',
      completionDate: typeof body.completionDate === 'string' ? body.completionDate.trim() : '',
      natureOfDelivery: typeof body.natureOfDelivery === 'string' ? body.natureOfDelivery.trim() : '',
      issuingOrganisation:
        typeof body.issuingOrganisation === 'string' && body.issuingOrganisation.trim()
          ? body.issuingOrganisation.trim()
          : String(body.clientOrContractingOrg).trim(),
      supportingFileName,
      supportingMimeType,
      supportingFileSizeBytes,
      supportingStorageKey,
      // Explicitly never auto-verified
      verificationStatus: 'Uploaded (Unverified)',
      publicDisplay: Boolean(body.publicDisplay) && Boolean(body.confidentialityConfirmed),
      confidentialityConfirmed: Boolean(body.confidentialityConfirmed),
      createdAt: now,
      updatedAt: now,
    };

    store.experienceRecords.push(record);
    saveStore();

    res.status(201).json({
      record: sanitizeExperienceRecord(record),
      workspace: buildComplianceWorkspaceForBusiness(business),
    });
  });

  app.put('/api/compliance/experience/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const rec = store.experienceRecords.find(
      (r) => r.id === req.params.id && r.businessId === business.id
    );
    if (!rec) {
      res.status(404).json({ error: 'Experience record not found or access denied.' });
      return;
    }

    const body = req.body ?? {};
    if (typeof body.publicDisplay === 'boolean') {
      rec.publicDisplay = body.publicDisplay && (typeof body.confidentialityConfirmed === 'boolean' ? body.confidentialityConfirmed : rec.confidentialityConfirmed);
    }
    if (typeof body.confidentialityConfirmed === 'boolean') {
      rec.confidentialityConfirmed = body.confidentialityConfirmed;
      if (!rec.confidentialityConfirmed) rec.publicDisplay = false;
    }
    if (typeof body.projectOrContractTitle === 'string' && body.projectOrContractTitle.trim()) {
      rec.projectOrContractTitle = body.projectOrContractTitle.trim();
    }
    if (typeof body.clientOrContractingOrg === 'string' && body.clientOrContractingOrg.trim()) {
      rec.clientOrContractingOrg = body.clientOrContractingOrg.trim();
    }
    if (typeof body.sector === 'string') rec.sector = body.sector.trim();
    if (typeof body.contractPeriod === 'string') rec.contractPeriod = body.contractPeriod.trim();
    if (typeof body.completionDate === 'string') rec.completionDate = body.completionDate.trim();
    if (typeof body.natureOfDelivery === 'string') rec.natureOfDelivery = body.natureOfDelivery.trim();
    if (typeof body.issuingOrganisation === 'string') rec.issuingOrganisation = body.issuingOrganisation.trim();

    rec.updatedAt = new Date().toISOString();
    saveStore();

    res.json({
      record: sanitizeExperienceRecord(rec),
      workspace: buildComplianceWorkspaceForBusiness(business),
    });
  });

  app.get('/api/compliance/experience/:id/file', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const rec = store.experienceRecords.find(
      (r) => r.id === req.params.id && r.businessId === business.id
    );
    if (!rec || !rec.supportingStorageKey || !rec.supportingMimeType) {
      res.status(404).json({ error: 'Supporting file not found or access denied.' });
      return;
    }

    const buffer = readStoredDocumentBuffer(business.id, rec.supportingStorageKey);
    if (!buffer) {
      res.status(404).json({ error: 'Stored file could not be located.' });
      return;
    }

    const downloadMode = req.query.download === '1';
    const safeName = (rec.supportingFileName || 'evidence').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', rec.supportingMimeType);
    res.setHeader(
      'Content-Disposition',
      `${downloadMode ? 'attachment' : 'inline'}; filename="${safeName}"`
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  });

  app.delete('/api/compliance/experience/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const idx = store.experienceRecords.findIndex(
      (r) => r.id === req.params.id && r.businessId === business.id
    );
    if (idx === -1) {
      res.status(404).json({ error: 'Experience record not found or access denied.' });
      return;
    }

    const [removed] = store.experienceRecords.splice(idx, 1);
    deleteStoredDocumentFile(business.id, removed.supportingStorageKey);
    saveStore();

    res.json({
      ok: true,
      workspace: buildComplianceWorkspaceForBusiness(business),
    });
  });

  app.post('/api/compliance/assistant', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const business = getBusinessForUser(user.id);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (question.length < 4) {
      res.status(400).json({ error: 'Please ask a specific compliance, licensing, or trade document question.' });
      return;
    }

    try {
      const workspace = buildComplianceWorkspaceForBusiness(business);
      const response = await answerComplianceQuestionWithAi({
        question,
        businessName: business.name,
        profile: workspace.requirementsProfile,
        checklist: workspace.checklist,
        documents: workspace.documents,
      });
      res.json({ assistantResponse: response });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to answer compliance question right now.';
      const isKeyError =
        message.includes('API_KEY') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('403') ||
        message.includes('configured');
      const status = isKeyError
        ? 503
        : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
          ? 429
          : 500;
      res.status(status).json({
        error:
          status === 503
            ? 'AI Compliance Assistant requires a valid GEMINI_API_KEY configured in Settings > Secrets.'
            : status === 429
              ? 'AI rate limit reached. Please wait a moment and try again.'
              : message,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TradeSquare server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

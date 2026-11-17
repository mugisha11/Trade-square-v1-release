export type WorkspacePage =
  | 'home'
  | 'discover'
  | 'opportunities'
  | 'messages'
  | 'my-business'
  | 'publish-opportunity';

export type WorkspaceLanguage = 'en' | 'fr' | 'rw';

export type BusinessCategory =
  | 'Buyer'
  | 'Supplier'
  | 'Manufacturer'
  | 'Distributor'
  | 'Importer / Exporter'
  | 'Agricultural Producer'
  | 'Cooperative'
  | 'Service Provider'
  | 'SME';

export type OpportunityType =
  | 'Buyer Request'
  | 'Supplier Offer'
  | 'Distribution'
  | 'Procurement'
  | 'Partnership'
  | 'Export Opportunity'
  | 'Service Request';

export type OpportunityStatus = 'draft' | 'published' | 'paused' | 'closed' | 'fulfilled';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  language: WorkspaceLanguage;
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  ownerUserId: string;
  name: string;
  businessType: BusinessCategory;
  industry: string;
  country: string;
  city: string;
  description: string;
  productsAndServices: string[];
  targetMarkets: string[];
  requirements: string;
  logoUrl?: string;
  coverUrl?: string;
  verifiedRecord: boolean;
  updatedAt: string;
}

export interface SessionPayload {
  user: UserProfile;
  business: BusinessProfile;
  sessionToken?: string;
}

export interface OpportunityRecord {
  id: string;
  businessId: string;
  businessName: string;
  businessLocation: string;
  businessLogoUrl?: string;
  verifiedRecord: boolean;
  type: OpportunityType;
  productOrService: string;
  description: string;
  quantityAndSpecs?: string;
  destinationMarket?: string;
  deadline?: string;
  industry: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  status: OpportunityStatus;
  technicalSpecs?: string;
  qualityRequirements?: string;
  quantity?: string;
  unit?: string;
  capacity?: string;
  moq?: string;
  budgetOrPrice?: string;
  currency?: string;
  paymentTerms?: string;
  priceNegotiable?: boolean;
  originLocation?: string;
  deliveryTimeline?: string;
  requiredCertifications?: string;
  eligibilityRequirements?: string;
  preferredPartnerTraits?: string;
  contactPreference?: string;
  showPublicContact?: boolean;
  savedByMe: boolean;
  interestExpressedByMe: boolean;
  isOwnOpportunity: boolean;
}

export interface OpportunityAssistSuggestion {
  productOrService?: string;
  description?: string;
  industry?: string;
  quantityAndSpecs?: string;
  quantity?: string;
  unit?: string;
  destinationMarket?: string;
  originLocation?: string;
  deliveryTimeline?: string;
  deadline?: string;
  technicalSpecs?: string;
  qualityRequirements?: string;
  requiredCertifications?: string;
  budgetOrPrice?: string;
  currency?: string;
  paymentTerms?: string;
  clarificationQuestions: string[];
  missingInformation: string[];
  qualityNotes: string[];
  suggestedCategory?: string;
}

export interface OpportunityQualityReview {
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: Array<{ title: string; reason: string }>;
  readyToPublish: boolean;
}

export interface BusinessRecommendation {
  business: BusinessProfile;
  explanation: string;
}

export interface ActivityItem {
  id: string;
  kind: 'enquiry' | 'response' | 'message' | 'saved_update';
  title: string;
  detail: string;
  createdAt: string;
  relatedPage: WorkspacePage;
  relatedId?: string;
}

export interface MessageEntry {
  id: string;
  threadId: string;
  senderUserId: string;
  senderName: string;
  senderBusinessName: string;
  body: string;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  participantUserIds: string[];
  counterpartyName: string;
  counterpartyBusinessName: string;
  counterpartyLocation: string;
  subject: string;
  opportunityId?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  messages: MessageEntry[];
}

export interface RegionalIntelligencePayload {
  liveMetrics: {
    activeBuyerRequests: number;
    activeSupplierOffers: number;
    confirmedEnquiries: number;
    registeredEnterprises: number;
  };
  marketAnalysis: {
    region: string;
    label: string;
    items: Array<{
      category: 'Historical Trade Pattern' | 'Market Analysis' | 'Potential Opportunity';
      title: string;
      detail: string;
    }>;
  } | null;
  analysisError?: string;
}

export interface AiAssistResult {
  summary: string;
  keyInsights: string[];
  recommendedActions: string[];
  suggestedSearchQuery?: string;
  matchedBusinesses: Array<{
    businessId: string;
    businessName: string;
    reason: string;
  }>;
  matchedOpportunities: Array<{
    opportunityId: string;
    title: string;
    reason: string;
  }>;
}

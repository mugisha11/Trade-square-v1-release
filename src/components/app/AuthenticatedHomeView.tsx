import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  ChevronRight,
  Factory,
  FilePlus2,
  Globe2,
  Handshake,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type {
  ActivityItem,
  AiAssistResult,
  BusinessProfile,
  BusinessRecommendation,
  OpportunityRecord,
  OpportunityType,
  RegionalIntelligencePayload,
  UserProfile,
  WorkspacePage,
} from '../../types/workspace';
import { opportunityTypeLabel } from '../../lib/opportunityFields';
import { OpportunityCard } from './OpportunityCard';
import { VerifiedBadge } from './VerifiedBadge';
import {
  OpportunityCardSkeleton,
  RecommendedBusinessSkeleton,
  RegionalInsightsSkeleton,
} from './WorkspaceSkeletons';
import { authFetch } from '../../lib/authClient';
import landingShowcaseVideo from '../../assets/images/dX8B1.mp4';

interface AuthenticatedHomeViewProps {
  user: UserProfile;
  business: BusinessProfile;
  onNavigate: (page: WorkspacePage) => void;
  onOpenDiscover: (query?: string, businessType?: string) => void;
  onOpenPublish: (initialType?: OpportunityType) => void;
  onViewOpportunity: (opp: OpportunityRecord) => void;
  onContactOpportunity: (opp: OpportunityRecord) => void;
  onExpressInterest: (opp: OpportunityRecord) => void;
  onToggleSave: (opp: OpportunityRecord) => void;
  onConnectBusiness: (biz: BusinessProfile) => void;
  opportunities: OpportunityRecord[];
  opportunitiesLoading: boolean;
  opportunitiesError: string | null;
  onReloadOpportunities: () => void;
  busyOpportunityId: string | null;
  activityVersion?: number;
}

function getGreeting(language: UserProfile['language']): string {
  const hour = new Date().getHours();
  if (language === 'fr') {
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
  if (language === 'rw') {
    if (hour < 12) return 'Mwaramutse';
    if (hour < 18) return 'Mwiriwe';
    return 'Mwiriwe neza';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const CATEGORIES: Array<{
  label: string;
  icon: typeof Factory;
  discoverType?: string;
  query?: string;
}> = [
  { label: 'Manufacturers', icon: Factory, discoverType: 'Manufacturer' },
  { label: 'Buyers', icon: Users, discoverType: 'Buyer' },
  { label: 'Suppliers', icon: Store, discoverType: 'Supplier' },
  { label: 'Distributors', icon: Truck, discoverType: 'Distributor' },
  { label: 'Agri & Food', icon: Package, query: 'agriculture food' },
  { label: 'Partnerships', icon: Handshake, query: 'partnership' },
  { label: 'Export', icon: Globe2, query: 'export' },
  { label: 'Services', icon: Briefcase, discoverType: 'Service Provider' },
];

const SOURCING_INTENTS = [
  {
    label: 'Find potential buyers',
    intent:
      'Identify potential buyers and active buyer requests suited to my business profile and products.',
  },
  {
    label: 'Source suppliers',
    intent:
      'Find relevant suppliers, manufacturers, or producers matching my commercial needs in Rwanda and East Africa.',
  },
  {
    label: 'Expand to new markets',
    intent:
      'Analyze cross-border East African market expansion opportunities for my products and services.',
  },
  {
    label: 'Strengthen my profile',
    intent:
      'Review my current TradeSquare business profile and suggest concrete improvements to attract serious counterparties.',
  },
];

export function AuthenticatedHomeView({
  user,
  business,
  onNavigate,
  onOpenDiscover,
  onOpenPublish,
  onViewOpportunity,
  onContactOpportunity,
  onExpressInterest,
  onToggleSave,
  onConnectBusiness,
  opportunities,
  opportunitiesLoading,
  opportunitiesError,
  onReloadOpportunities,
  busyOpportunityId,
  activityVersion = 0,
}: AuthenticatedHomeViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [feedFilter, setFeedFilter] = useState<'all' | 'Buyer Request' | 'Supplier Offer' | 'saved'>(
    'all',
  );

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [recommendations, setRecommendations] = useState<BusinessRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);

  const [regionalData, setRegionalData] = useState<RegionalIntelligencePayload | null>(null);
  const [regionalLoading, setRegionalLoading] = useState(true);

  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiAssistResult | null>(null);

  const loadSecondaryData = useCallback(async () => {
    setRecsLoading(true);
    setRegionalLoading(true);
    try {
      const [actRes, discRes, regRes] = await Promise.all([
        authFetch('/api/activity'),
        authFetch('/api/discover'),
        authFetch('/api/intelligence/regional'),
      ]);

      if (actRes.ok) {
        const actJson = await actRes.json();
        setActivities(actJson.activities ?? []);
      }
      if (discRes.ok) {
        const discJson = await discRes.json();
        setRecommendations((discJson.businesses ?? []).slice(0, 4));
      }
      if (regRes.ok) {
        const regJson = await regRes.json();
        setRegionalData(regJson);
      }
    } catch {
      // Handled by empty states
    } finally {
      setRecsLoading(false);
      setRegionalLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecondaryData();
  }, [loadSecondaryData, opportunities.length, activityVersion]);

  async function runAiAssist(queryText: string) {
    if (queryText.trim().length < 4) {
      setAiError('Enter at least a short commercial sourcing question.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await authFetch('/api/ai/discover-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to run sourcing intelligence right now.');
      }
      setAiResult(data.result);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach TradeSquare intelligence.');
    } finally {
      setAiLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    const type =
      searchCategory === 'All'
        ? undefined
        : searchCategory === 'Buyers'
          ? 'Buyer'
          : searchCategory === 'Suppliers'
            ? 'Supplier'
            : searchCategory;
    if (!trimmed) {
      onOpenDiscover('', type);
      return;
    }
    onOpenDiscover(trimmed, type);
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    const status = opp.status ?? 'published';
    if (status !== 'published' && feedFilter !== 'saved') return false;
    if (feedFilter === 'saved') return opp.savedByMe && status === 'published';
    if (feedFilter === 'Buyer Request')
      return (
        opp.type === 'Buyer Request' ||
        opp.type === 'Procurement' ||
        opp.type === 'Service Request'
      );
    if (feedFilter === 'Supplier Offer')
      return opp.type === 'Supplier Offer' || opp.type === 'Export Opportunity';
    return true;
  });

  const profileIncomplete = !business.description || business.productsAndServices.length === 0;
  const locationLabel = [business.city, business.country].filter(Boolean).join(', ');
  const publishedCount = opportunities.filter((o) => (o.status ?? 'published') === 'published').length;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* ===== Alibaba-style commerce search strip ===== */}
      <section className="relative bg-[#0A66C2] px-4 sm:px-6 lg:px-8 pt-5 pb-8 overflow-hidden">
        <img
          src="/assets/aistudio/zpOfz2UylT0Qpgjy08EJlPSqdTG5v4YZp26Hog71ME2EdnQ6C8YfPZIUEKnZIrAnfpG65yHp-Pgs6aaWExaHEjYUtair2-Xd3VoPUtHQj6PJxb6N-N66n3fce78UFIWOyDEB2xKlSYFtplaX78vtsibcLieh3Cma2ySaGIpFN_63KjwuTQlrLWy6_5VW3Wx_.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="relative z-10 max-w-[1128px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div className="max-w-xl rounded-xl bg-white/95 border border-white/80 shadow-[0_8px_28px_rgba(0,65,130,0.18)] px-4 py-3.5 sm:px-5 sm:py-4">
              <p className="text-[12px] sm:text-[13px] font-semibold text-[#0A66C2] tracking-wide">
                {business.name}
                {locationLabel ? ` · ${locationLabel}` : ''}
                {business.verifiedRecord ? ' · Verified record' : ''}
              </p>
              <h1 className="mt-1 text-[22px] sm:text-[28px] font-semibold tracking-tight leading-tight text-[#191919]">
                {getGreeting(user.language)}, {user.firstName}
              </h1>
              <p className="mt-1 text-[13px] sm:text-[14px] text-[#525866] max-w-xl">
                Source partners, post RFQs, and grow across East African trade corridors.
              </p>
            </div>
            {profileIncomplete && (
              <button
                type="button"
                onClick={() => onNavigate('my-business')}
                className="self-start sm:self-auto h-9 px-4 rounded-full bg-white hover:bg-[#F3F6F8] border border-[#E0E0E0] text-[#004182] text-[13px] font-semibold shadow-sm cursor-pointer"
              >
                Complete profile
              </button>
            )}
          </div>

          {/* Mega search — Alibaba pattern */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white rounded-lg shadow-[0_8px_28px_rgba(0,65,130,0.35)] overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="sm:w-[148px] shrink-0 border-b sm:border-b-0 sm:border-r border-[#E8E8E8]">
              <label className="sr-only" htmlFor="home-search-category">
                Category
              </label>
              <select
                id="home-search-category"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full h-12 sm:h-[52px] px-3 text-[14px] font-medium text-[#191919] bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All categories</option>
                <option value="Buyers">Buyers</option>
                <option value="Suppliers">Suppliers</option>
                <option value="Manufacturer">Manufacturers</option>
                <option value="Distributor">Distributors</option>
                <option value="Service Provider">Services</option>
              </select>
            </div>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C8C] pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, buyers, suppliers, or markets..."
                className="w-full h-12 sm:h-[52px] pl-10 pr-3 text-[15px] text-[#191919] placeholder:text-[#8C8C8C] focus:outline-none"
              />
            </div>
            <div className="flex shrink-0">
              <button
                type="submit"
                className="flex-1 sm:flex-none h-12 sm:h-[52px] px-6 sm:px-8 bg-[#0A66C2] hover:bg-[#004182] text-white text-[15px] font-semibold transition-colors cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => onOpenPublish('Buyer Request')}
                className="flex-1 sm:flex-none h-12 sm:h-[52px] px-4 sm:px-5 bg-[#004182] hover:bg-[#003066] text-white text-[14px] font-semibold border-l border-white/20 transition-colors cursor-pointer"
              >
                Post RFQ
              </button>
            </div>
          </form>

          {/* Category rail */}
          <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() =>
                    onOpenDiscover(cat.query || '', cat.discoverType || 'All')
                  }
                  className="shrink-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white hover:bg-[#F3F6F8] border border-[#E0E0E0] text-[13px] font-semibold text-[#191919] shadow-sm transition-colors cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-[#0A66C2]" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-[1128px] mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* ===== Main marketplace column ===== */}
          <div className="lg:col-span-8 space-y-4 min-w-0">
            {/* Promo banners — Alibaba dual hero */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <motion.button
                type="button"
                onClick={() => onOpenPublish('Buyer Request')}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                className="sm:col-span-3 relative min-h-[168px] sm:min-h-[200px] rounded-xl overflow-hidden text-left cursor-pointer shadow-[0_4px_20px_rgba(10,102,194,0.18)] group"
              >
                <video
                  src={landingShowcaseVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-[#004182]/88 via-[#0A66C2]/55 to-[#004182]/25"
                />
                <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#70B5F9]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Request for quotation
                    </span>
                    <h2 className="mt-2 text-[22px] sm:text-[26px] font-semibold text-white leading-tight max-w-md drop-shadow-sm">
                      Tell the network what you need to buy
                    </h2>
                    <p className="mt-2 text-[13px] sm:text-[14px] text-white/90 max-w-sm leading-relaxed drop-shadow-sm">
                      Structured RFQs attract serious suppliers — not generic ads.
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 self-start h-9 px-4 rounded-full bg-white text-[#004182] text-[13px] font-semibold group-hover:bg-[#F3F6F8] transition-colors">
                    Start RFQ
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.button>

              <div className="sm:col-span-2 grid grid-rows-2 gap-3">
                <button
                  type="button"
                  onClick={() => onOpenPublish('Supplier Offer')}
                  className="relative rounded-xl overflow-hidden bg-white border border-[#E0E0E0] p-4 text-left hover:border-[#70B5F9] hover:shadow-[0_6px_18px_rgba(10,102,194,0.12)] transition-all cursor-pointer group"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0A66C2]">
                    Sell / supply
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-[#191919] leading-snug">
                    List products & capacity
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#004182] group-hover:gap-1.5 transition-all">
                    Publish offer <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDiscover('', 'All')}
                  className="relative rounded-xl overflow-hidden bg-[#F3F6F8] border border-[#E0E0E0] p-4 text-left hover:border-[#70B5F9] hover:bg-white hover:shadow-[0_6px_18px_rgba(10,102,194,0.12)] transition-all cursor-pointer group"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0A66C2]">
                    Discover
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-[#191919] leading-snug">
                    Browse verified enterprises
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#004182] group-hover:gap-1.5 transition-all">
                    Open marketplace <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>

            {/* Sourcing solution tiles */}
            <section className="bg-white rounded-xl border border-[#E0E0E0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-[16px] sm:text-[17px] font-semibold text-[#191919]">
                  Sourcing solutions
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('opportunities')}
                  className="text-[13px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                >
                  View all opportunities
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    title: 'Post buying request',
                    desc: 'RFQ to suppliers',
                    icon: FilePlus2,
                    action: () => onOpenPublish('Buyer Request'),
                  },
                  {
                    title: 'Find buyers',
                    desc: 'Active demand',
                    icon: Users,
                    action: () => onOpenDiscover('', 'Buyer'),
                  },
                  {
                    title: 'Find suppliers',
                    desc: 'Capacity & stock',
                    icon: Store,
                    action: () => onOpenDiscover('', 'Supplier'),
                  },
                  {
                    title: 'My business',
                    desc: 'Profile & trust',
                    icon: Building2,
                    action: () => onNavigate('my-business'),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={item.action}
                      className="rounded-lg border border-[#E8E8E8] bg-[#FAFBFC] hover:bg-white hover:border-[#70B5F9] hover:shadow-sm p-3 text-left transition-all cursor-pointer"
                    >
                      <span className="w-9 h-9 rounded-lg bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center mb-2">
                        <Icon className="w-4 h-4" />
                      </span>
                      <p className="text-[13px] font-semibold text-[#191919] leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#666666] mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Opportunities feed */}
            <section aria-labelledby="opportunities-feed-heading" className="space-y-3">
              <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2
                    id="opportunities-feed-heading"
                    className="text-[17px] sm:text-[18px] font-semibold text-[#191919]"
                  >
                    Opportunities for you
                  </h2>
                  <p className="text-[12px] sm:text-[13px] text-[#666666]">
                    {publishedCount} live listing{publishedCount === 1 ? '' : 's'} across the network
                  </p>
                </div>
                <div className="inline-flex p-0.5 bg-[#F3F6F8] rounded-full border border-[#E8E8E8] overflow-x-auto max-w-full">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'Buyer Request', label: 'Demand' },
                      { id: 'Supplier Offer', label: 'Supply' },
                      { id: 'saved', label: 'Saved' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFeedFilter(tab.id)}
                      className={`h-8 px-3.5 rounded-full text-[12px] sm:text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        feedFilter === tab.id
                          ? 'bg-[#0A66C2] text-white shadow-sm'
                          : 'text-[#666666] hover:text-[#191919]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {opportunitiesLoading ? (
                <OpportunityCardSkeleton count={3} />
              ) : opportunitiesError ? (
                <div className="bg-white rounded-xl border border-red-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#191919]">
                        Unable to load opportunities
                      </h3>
                      <p className="text-[13px] text-[#666666] mt-0.5">{opportunitiesError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onReloadOpportunities}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-semibold text-[#0A66C2] bg-[#E8F3FC] rounded-full cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E0E0E0] p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#191919]">
                    {feedFilter === 'saved'
                      ? 'No saved opportunities yet'
                      : 'No matching opportunities yet'}
                  </h3>
                  <p className="mt-1.5 text-[14px] text-[#666666] max-w-md mx-auto">
                    Post an RFQ or supplier offer so verified counterparties can discover your business.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPublish('Buyer Request')}
                      className="h-9 px-4 rounded-full bg-[#0A66C2] text-white text-[13px] font-semibold cursor-pointer"
                    >
                      Post RFQ
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPublish('Supplier Offer')}
                      className="h-9 px-4 rounded-full border border-[#0A66C2] text-[#0A66C2] text-[13px] font-semibold cursor-pointer"
                    >
                      List supply
                    </button>
                  </div>
                </div>
              ) : (
                <motion.div layout={!prefersReducedMotion} className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredOpportunities.map((opp, idx) => (
                      <OpportunityCard
                        key={opp.id}
                        opportunity={opp}
                        index={idx}
                        onView={onViewOpportunity}
                        onContact={onContactOpportunity}
                        onExpressInterest={onExpressInterest}
                        onToggleSave={onToggleSave}
                        busyId={busyOpportunityId}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>

            {/* Activity */}
            <section className="bg-white rounded-xl border border-[#E0E0E0] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0A66C2]" />
                  <h2 className="text-[16px] font-semibold text-[#191919]">Business activity</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('messages')}
                  className="text-[13px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                >
                  Messages
                </button>
              </div>
              {activities.length === 0 ? (
                <p className="text-[13px] text-[#666666]">
                  Enquiries, responses, and saved updates will appear here as you trade on the network.
                </p>
              ) : (
                <ul className="divide-y divide-[#F0F0F0]">
                  {activities.slice(0, 5).map((item) => (
                    <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onNavigate(item.relatedPage)}
                          className="text-left text-[14px] font-semibold text-[#191919] hover:text-[#0A66C2] cursor-pointer"
                        >
                          {item.title}
                        </button>
                        <p className="text-[12px] text-[#666666] mt-0.5 truncate">{item.detail}</p>
                      </div>
                      <span className="text-[11px] text-[#8C8C8C] shrink-0 tabular-nums">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* ===== Right rail — Alibaba AI sourcing panel ===== */}
          <aside className="lg:col-span-4 space-y-4 min-w-0 lg:sticky lg:top-[72px]">
            <section className="rounded-xl overflow-hidden border border-[#E0E0E0] bg-white shadow-[0_2px_12px_rgba(10,102,194,0.08)]">
              <div className="bg-gradient-to-r from-[#004182] to-[#0A66C2] px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#70B5F9]" />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-semibold text-white">Smart sourcing</h2>
                    <p className="text-[11px] text-[#70B5F9]">TradeSquare commercial intelligence</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <p className="text-[12px] text-[#666666] leading-relaxed">
                  Describe a sourcing goal. Results stay grounded in your network — no invented partners.
                </p>
                {SOURCING_INTENTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={aiLoading}
                    onClick={() => {
                      setAiQuery(item.label);
                      runAiAssist(item.intent);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-[#E8E8E8] bg-[#FAFBFC] hover:border-[#70B5F9] hover:bg-[#E8F3FC] text-[13px] font-medium text-[#191919] flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#0A66C2] shrink-0" />
                  </button>
                ))}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runAiAssist(aiQuery);
                  }}
                  className="pt-2 flex gap-2"
                >
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="e.g. packaging suppliers in Kigali..."
                    className="flex-1 min-w-0 h-10 rounded-lg border border-[#D0D0D0] px-3 text-[13px] text-[#191919] placeholder:text-[#8C8C8C] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="h-10 px-3.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-white text-[13px] font-semibold shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
                  </button>
                </form>

                {aiError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-[12px] text-red-800 flex gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                <AnimatePresence>
                  {aiResult && !aiLoading && (
                    <motion.div
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                      className="pt-2 border-t border-[#F0F0F0] space-y-2 text-[13px]"
                    >
                      <p className="font-medium text-[#191919] leading-relaxed">{aiResult.summary}</p>
                      {aiResult.keyInsights.length > 0 && (
                        <ul className="space-y-1 text-[#666666]">
                          {aiResult.keyInsights.slice(0, 4).map((insight, idx) => (
                            <li key={idx}>· {insight}</li>
                          ))}
                        </ul>
                      )}
                      {aiResult.matchedBusinesses.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[12px] font-semibold text-[#0A66C2]">Matched businesses</p>
                          {aiResult.matchedBusinesses.map((match) => (
                            <div
                              key={match.businessId}
                              className="rounded-lg bg-[#F3F6F8] border border-[#E8E8E8] p-2.5"
                            >
                              <p className="font-semibold text-[#191919] text-[13px]">
                                {match.businessName}
                              </p>
                              <p className="text-[12px] text-[#666666] mt-0.5">{match.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {aiResult.suggestedSearchQuery && (
                        <button
                          type="button"
                          onClick={() => onOpenDiscover(aiResult.suggestedSearchQuery)}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                        >
                          Open in Discover <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Recommended enterprises */}
            <section className="bg-white rounded-xl border border-[#E0E0E0] p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-[15px] font-semibold text-[#191919]">Recommended enterprises</h2>
                <button
                  type="button"
                  onClick={() => onOpenDiscover()}
                  className="text-[12px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                >
                  See all
                </button>
              </div>
              {recsLoading ? (
                <RecommendedBusinessSkeleton count={3} />
              ) : recommendations.length === 0 ? (
                <p className="text-[12px] text-[#666666] leading-relaxed">
                  As more businesses join your corridors, explainable recommendations appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendations.map(({ business: recBiz, explanation }) => (
                    <div
                      key={recBiz.id}
                      className="pb-3 last:pb-0 border-b last:border-b-0 border-[#F0F0F0]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#E8F3FC] text-[#0A66C2] flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              <h3 className="text-[13px] font-semibold text-[#191919] truncate">
                                {recBiz.name}
                              </h3>
                              {recBiz.verifiedRecord && <VerifiedBadge size="sm" />}
                            </div>
                            <p className="text-[11px] text-[#666666] truncate">
                              {recBiz.industry} ·{' '}
                              {[recBiz.city, recBiz.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onConnectBusiness(recBiz)}
                          className="shrink-0 h-8 px-2.5 rounded-full bg-[#0A66C2] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Connect
                        </button>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#666666] leading-snug line-clamp-2">
                        {explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Corridor metrics */}
            <section className="bg-white rounded-xl border border-[#E0E0E0] p-4">
              <h2 className="text-[15px] font-semibold text-[#191919]">Corridor pulse</h2>
              <p className="text-[11px] text-[#666666] mt-0.5">Rwanda & East Africa — live network</p>
              {regionalLoading ? (
                <RegionalInsightsSkeleton />
              ) : regionalData ? (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#F3F6F8] border border-[#E8E8E8] p-3">
                      <p className="text-[11px] text-[#666666]">Buyer requests</p>
                      <p className="text-[20px] font-semibold text-[#004182] tabular-nums mt-0.5">
                        {regionalData.liveMetrics.activeBuyerRequests}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#F3F6F8] border border-[#E8E8E8] p-3">
                      <p className="text-[11px] text-[#666666]">Enquiries</p>
                      <p className="text-[20px] font-semibold text-[#0A66C2] tabular-nums mt-0.5">
                        {regionalData.liveMetrics.confirmedEnquiries}
                      </p>
                    </div>
                  </div>
                  {regionalData.marketAnalysis?.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="pb-2 border-b last:border-0 border-[#F0F0F0]">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0A66C2]">
                        {item.category}
                      </p>
                      <p className="text-[13px] font-semibold text-[#191919] mt-0.5">{item.title}</p>
                      <p className="text-[11px] text-[#666666] mt-0.5 line-clamp-2">{item.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[12px] text-[#666666]">Corridor insights unavailable right now.</p>
              )}
            </section>

            {/* Featured type chips from feed */}
            {filteredOpportunities.length > 0 && (
              <section className="rounded-xl border border-[#E0E0E0] bg-[#F3F6F8] p-4">
                <p className="text-[12px] font-semibold text-[#666666] mb-2">Active types nearby</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(filteredOpportunities.map((o) => o.type)))
                    .slice(0, 5)
                    .map((type) => (
                      <span
                        key={type}
                        className="inline-flex h-7 px-2.5 rounded-full bg-white border border-[#E0E0E0] text-[11px] font-semibold text-[#004182]"
                      >
                        {opportunityTypeLabel(type)}
                      </span>
                    ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

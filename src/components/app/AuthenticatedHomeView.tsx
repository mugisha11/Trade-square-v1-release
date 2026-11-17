import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Compass,
  FilePlus2,
  Globe2,
  Loader2,
  MessageSquare,
  PackagePlus,
  RefreshCw,
  Search,
  Sparkles,
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
import { OpportunityCard } from './OpportunityCard';
import { VerifiedBadge } from './VerifiedBadge';
import {
  OpportunityCardSkeleton,
  RecommendedBusinessSkeleton,
  RegionalInsightsSkeleton,
} from './WorkspaceSkeletons';
import { authFetch } from '../../lib/authClient';

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

const AI_SHORTCUTS = [
  {
    label: 'Find potential buyers',
    intent:
      'Identify potential buyers and active buyer requests suited to my business profile and products.',
  },
  {
    label: 'Discover suppliers',
    intent:
      'Find relevant suppliers, manufacturers, or producers matching my commercial needs in Rwanda and East Africa.',
  },
  {
    label: 'Explore regional markets',
    intent:
      'Analyze cross-border East African market expansion opportunities for my products and services.',
  },
  {
    label: 'Improve my business profile',
    intent:
      'Review my current TradeSquare business profile and suggest concrete improvements to attract serious counterparties.',
  },
  {
    label: 'Understand trade opportunities',
    intent:
      'Explain the requirements and commercial readiness steps needed for current regional trade opportunities.',
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
  const [feedFilter, setFeedFilter] = useState<'all' | 'Buyer Request' | 'Supplier Offer' | 'saved'>(
    'all'
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
      // Handled gracefully by card fallback states
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
      setAiError('Enter at least a short commercial question or search.');
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
        throw new Error(data.error || 'Unable to run business intelligence right now.');
      }
      setAiResult(data.result);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach TradeSquare AI.');
    } finally {
      setAiLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      onOpenDiscover();
      return;
    }
    onOpenDiscover(trimmed);
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
  const businessInitials = business.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ================================================================= */}
      {/* CENTER COLUMN: Commercial Trading Feed & Discovery                */}
      {/* ================================================================= */}
      <div className="lg:col-span-8 space-y-4 min-w-0">
        {/* A. Personalized Commercial Welcome & Discovery Search Card */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white dark:bg-[#16181C] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_2px_8px_rgba(11,31,58,0.05)] dark:shadow-none p-5 sm:p-6 overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#0B1F3A] via-[#0E7C5B] to-[#D97706] dark:from-[#1D9BF0] dark:via-[#00BA7C] dark:to-[#1D9BF0]"
          />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                <p className="text-[13px] sm:text-[14px] font-semibold text-[#0E7C5B] dark:text-[#00BA7C]">
                  {business.name} · {[business.city, business.country].filter(Boolean).join(', ')}
                </p>
                {business.verifiedRecord && <VerifiedBadge size="sm" />}
              </div>
              <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold tracking-tight text-[#0B1F3A] dark:text-[#E7E9EA] leading-tight">
                {getGreeting(user.language)}, {user.firstName}
              </h1>
              <p className="mt-1.5 text-[15px] sm:text-[16px] text-[#52606D] dark:text-[#71767B] leading-snug">
                Discover opportunities, connect with businesses and grow beyond your market.
              </p>
            </div>

            {profileIncomplete && (
              <motion.button
                type="button"
                onClick={() => onNavigate('my-business')}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                className="self-start inline-flex items-center gap-1.5 px-4 py-2 text-[13px] sm:text-[14px] font-semibold text-[#B45309] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] dark:text-[#FBBF24] dark:bg-[#F59E0B]/15 dark:hover:bg-[#F59E0B]/25 dark:border-[#F59E0B]/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Complete business profile
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-4">
            <label htmlFor="home-discover-search" className="sr-only">
              Find buyers, suppliers, products or business partners
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#64748B] dark:text-[#71767B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="home-discover-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find buyers, suppliers, products or business partners..."
                  className="w-full h-11 pl-11 pr-4 rounded-full bg-[#F4F7FA] hover:bg-[#EDF2F7] focus:bg-white dark:bg-[#202327] dark:hover:bg-[#272B30] dark:focus:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] focus:border-[#0B1F3A] dark:focus:border-[#1D9BF0] text-[15px] text-[#0B1F3A] dark:text-[#E7E9EA] placeholder:text-[#64748B] dark:placeholder:text-[#71767B] focus:outline-none transition-all"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                className="h-11 px-6 rounded-full bg-[#0B1F3A] hover:bg-[#13325C] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-[15px] font-semibold shadow-[0_2px_8px_rgba(11,31,58,0.22)] dark:shadow-none transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Search
              </motion.button>
            </div>
          </form>
        </motion.section>

        {/* B. Commercial Composer & Quick Trade Actions */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : 0.06, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Commercial actions and opportunity composer"
          className="bg-white dark:bg-[#16181C] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_3px_rgba(11,31,58,0.05)] dark:shadow-none p-4 sm:p-5"
        >
          {/* Composer Input Trigger Row */}
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              onClick={() => onNavigate('my-business')}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              title={business.name}
              className="w-10 h-10 rounded-full bg-[#0B1F3A] dark:bg-[#1D9BF0] text-white font-bold text-[13px] flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
            >
              {businessInitials || <Building2 className="w-4 h-4" />}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onOpenPublish('Buyer Request')}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              className="flex-1 h-11 px-4 rounded-full bg-[#F4F7FA] hover:bg-[#E8EEF5] dark:bg-[#202327] dark:hover:bg-[#272B30] border border-[#E2E8F0]/80 dark:border-[#2F3336] text-left text-[15px] sm:text-[16px] text-[#52606D] dark:text-[#71767B] transition-colors truncate cursor-pointer"
            >
              Publish a buying request, supplier offer, or partnership...
            </motion.button>
          </div>

          <div className="border-t border-[#E6ECF3] dark:border-[#2F3336] my-3.5" />

          {/* Commercial Quick Actions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
            <motion.button
              type="button"
              onClick={() => onOpenDiscover('', 'Buyer')}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              className="flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-lg hover:bg-[#EFF6FF] dark:hover:bg-[#1D9BF0]/10 text-[14px] font-semibold text-[#52606D] dark:text-[#E7E9EA] hover:text-[#0F52BA] dark:hover:text-[#1D9BF0] transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#0F52BA] dark:text-[#1D9BF0] shrink-0" />
              <span className="truncate">Find buyers</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onOpenDiscover('', 'Supplier')}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              className="flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-lg hover:bg-[#ECFDF5] dark:hover:bg-[#00BA7C]/10 text-[14px] font-semibold text-[#52606D] dark:text-[#E7E9EA] hover:text-[#0E7C5B] dark:hover:text-[#00BA7C] transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#0E7C5B] dark:text-[#00BA7C] shrink-0" />
              <span className="truncate">Find suppliers</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onOpenPublish('Buyer Request')}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              className="flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-lg hover:bg-[#ECFDF5] dark:hover:bg-[#00BA7C]/10 text-[14px] font-semibold text-[#52606D] dark:text-[#E7E9EA] hover:text-[#047857] dark:hover:text-[#00BA7C] transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4 text-[#059669] dark:text-[#00BA7C] shrink-0" />
              <span className="truncate">Publish a buying request</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onOpenPublish('Supplier Offer')}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              className="flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-lg hover:bg-[#FFFBEB] dark:hover:bg-[#F59E0B]/10 text-[14px] font-semibold text-[#52606D] dark:text-[#E7E9EA] hover:text-[#B45309] dark:hover:text-[#FBBF24] transition-colors cursor-pointer"
            >
              <PackagePlus className="w-4 h-4 text-[#D97706] dark:text-[#FBBF24] shrink-0" />
              <span className="truncate">List a product or service</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onOpenDiscover('', 'All')}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-lg hover:bg-[#F4F7FA] dark:hover:bg-[#202327] text-[14px] font-semibold text-[#52606D] dark:text-[#E7E9EA] hover:text-[#0B1F3A] dark:hover:text-[#1D9BF0] transition-colors cursor-pointer"
            >
              <Globe2 className="w-4 h-4 text-[#0B1F3A] dark:text-[#1D9BF0] shrink-0" />
              <span className="truncate">Explore markets</span>
            </motion.button>
          </div>
        </motion.section>

        {/* C. Commercial Highlights Strip (100% B2B Trade Corridors) */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : 0.12, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Commercial market shortcuts"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        >
          <motion.button
            type="button"
            onClick={() => onOpenPublish('Buyer Request')}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className="group relative h-[150px] sm:h-[172px] rounded-xl overflow-hidden bg-white dark:bg-[#16181C] border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_4px_rgba(11,31,58,0.06)] dark:shadow-none hover:shadow-[0_10px_24px_rgba(11,31,58,0.1)] text-left flex flex-col justify-between transition-shadow cursor-pointer"
          >
            <div className="h-24 w-full overflow-hidden bg-[#0B1F3A] dark:bg-[#000000]">
              <img
                src="/src/assets/images/enterprise_production_1794883004798.jpg"
                alt="Publish commercial mandate"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>
            <div className="relative flex-1 bg-white dark:bg-[#16181C] px-2.5 pt-4 pb-2 flex items-center justify-center text-center">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0E7C5B] dark:bg-[#1D9BF0] border-[3px] border-white dark:border-[#16181C] text-white flex items-center justify-center shadow-xs">
                <FilePlus2 className="w-3.5 h-3.5" />
              </span>
              <span className="text-[13px] sm:text-[14px] font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] leading-tight">
                Post Opportunity
              </span>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => onOpenDiscover('', 'Buyer')}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className="group relative h-[150px] sm:h-[172px] rounded-xl overflow-hidden bg-[#0B1F3A] shadow-[0_1px_4px_rgba(11,31,58,0.1)] hover:shadow-[0_10px_24px_rgba(11,31,58,0.18)] text-left transition-shadow cursor-pointer"
          >
            <img
              src="/src/assets/images/hero_african_commerce_1794883004897.jpg"
              alt="Regional buyers and procurement teams"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/90 via-[#0B1F3A]/35 to-black/15" />
            <span className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full border-2 border-[#0E7C5B] bg-white/95 text-[#0E7C5B] flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </span>
            <div className="absolute inset-x-3 bottom-3">
              <p className="text-[13px] sm:text-[14px] font-semibold text-white leading-tight">
                Buyers &amp; Procurement
              </p>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => onOpenDiscover('', 'Supplier')}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className="group relative h-[150px] sm:h-[172px] rounded-xl overflow-hidden bg-[#0B1F3A] shadow-[0_1px_4px_rgba(11,31,58,0.1)] hover:shadow-[0_10px_24px_rgba(11,31,58,0.18)] text-left transition-shadow cursor-pointer"
          >
            <img
              src="/src/assets/images/problem_trade_corridor_1794883004849.jpg"
              alt="Manufacturers and regional suppliers"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/90 via-[#0B1F3A]/35 to-black/15" />
            <span className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full border-2 border-[#D97706] bg-white/95 text-[#B45309] flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </span>
            <div className="absolute inset-x-3 bottom-3">
              <p className="text-[13px] sm:text-[14px] font-semibold text-white leading-tight">
                Regional Suppliers
              </p>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => onNavigate('my-business')}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className="group relative h-[150px] sm:h-[172px] rounded-xl overflow-hidden bg-gradient-to-br from-[#0B1F3A] via-[#102A43] to-[#163C63] shadow-[0_2px_6px_rgba(11,31,58,0.14)] hover:shadow-[0_10px_24px_rgba(11,31,58,0.22)] text-left p-3.5 flex flex-col justify-between transition-shadow cursor-pointer"
          >
            <span className="w-8 h-8 rounded-full bg-white/12 border border-[#FBBF24]/45 text-[#FBBF24] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[12px] text-[#34D399] font-semibold truncate">{business.country}</p>
              <p className="text-[13px] sm:text-[14px] font-semibold text-white leading-tight mt-0.5 line-clamp-2">
                Manage {business.name}
              </p>
            </div>
          </motion.button>
        </motion.section>

        {/* D. Main Business Opportunity Feed */}
        <section aria-labelledby="opportunities-feed-heading" className="space-y-4">
          <div className="bg-white dark:bg-[#000000] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_3px_rgba(11,31,58,0.05)] dark:shadow-none px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2
                id="opportunities-feed-heading"
                className="text-[18px] sm:text-[20px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA]"
              >
                Opportunities for your business
              </h2>
              <p className="text-[13px] text-[#52606D] dark:text-[#71767B]">
                Active buyer requests, supplier offers, distribution &amp; partnership mandates
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="inline-flex p-1 bg-[#F4F7FA] dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-lg">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'Buyer Request', label: 'Buyers' },
                    { id: 'Supplier Offer', label: 'Suppliers' },
                    { id: 'saved', label: 'Saved' },
                  ] as const
                ).map((tab) => {
                  const isActive = feedFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFeedFilter(tab.id)}
                      className={`relative px-3.5 py-1.5 text-[13px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'text-[#0B1F3A] dark:text-[#E7E9EA]'
                          : 'text-[#52606D] dark:text-[#71767B] hover:text-[#0B1F3A] dark:hover:text-[#E7E9EA]'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="home-feed-filter-pill"
                          transition={
                            prefersReducedMotion
                              ? { duration: 0.01 }
                              : { type: 'spring', stiffness: 440, damping: 34 }
                          }
                          className="absolute inset-0 bg-white dark:bg-[#202327] rounded-md shadow-xs"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {opportunitiesLoading ? (
            <OpportunityCardSkeleton count={3} />
          ) : opportunitiesError ? (
            <div className="bg-white dark:bg-[#16181C] rounded-xl border border-red-200 dark:border-[#F4212E]/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-[#F4212E] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0B1F3A] dark:text-[#E7E9EA]">
                    Unable to load opportunities
                  </h3>
                  <p className="text-[14px] text-[#52606D] dark:text-[#71767B] mt-0.5">
                    {opportunitiesError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onReloadOpportunities}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] bg-[#F4F7FA] dark:bg-[#202327] border border-[#DCE3EC] dark:border-[#2F3336] rounded-lg hover:bg-[#E6ECF3] dark:hover:bg-[#2F3336] cursor-pointer self-start"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28 }}
              className="bg-white dark:bg-[#000000] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_3px_rgba(11,31,58,0.05)] dark:shadow-none p-8 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] dark:bg-[#1D9BF0]/15 flex items-center justify-center mx-auto mb-3 text-[#0E7C5B] dark:text-[#1D9BF0]">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-[18px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA]">
                {feedFilter === 'saved'
                  ? 'No saved opportunities yet'
                  : 'No published opportunities in the network yet'}
              </h3>
              <p className="mt-1.5 text-[15px] text-[#52606D] dark:text-[#71767B] max-w-md mx-auto leading-relaxed">
                {feedFilter === 'saved'
                  ? 'Save relevant buyer requests or supplier offers from the feed to track them here.'
                  : 'Publish your first buying request, supplier offer, or regional partnership requirement so verified counterparties in Rwanda and East Africa can discover your business.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenPublish('Buyer Request')}
                  className="px-5 py-2.5 text-[14px] font-semibold text-white bg-[#0E7C5B] hover:bg-[#047857] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] rounded-lg transition-colors cursor-pointer"
                >
                  Publish a buying request
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPublish('Supplier Offer')}
                  className="px-5 py-2.5 text-[14px] font-semibold text-[#B45309] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] dark:text-[#E7E9EA] dark:bg-[#16181C] dark:hover:bg-[#202327] dark:border-[#2F3336] rounded-lg transition-colors cursor-pointer"
                >
                  List a product or service
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div layout={!prefersReducedMotion} className="space-y-4">
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

        {/* E. Relevant Business Activity */}
        <section className="bg-white dark:bg-[#16181C] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_3px_rgba(11,31,58,0.05)] dark:shadow-none p-5">
          <div className="flex items-center justify-between gap-4 mb-3.5">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#0E7C5B] dark:text-[#1D9BF0]" />
              <h2 className="text-[18px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA]">
                Relevant business activity
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="text-[14px] font-semibold text-[#0F52BA] dark:text-[#1D9BF0] hover:underline cursor-pointer"
            >
              Open messages
            </button>
          </div>

          {activities.length === 0 ? (
            <p className="text-[14px] sm:text-[15px] text-[#52606D] dark:text-[#71767B]">
              No recent enquiries, responses, or saved opportunity updates yet. When you connect
              with businesses or publish requests, real activity appears here.
            </p>
          ) : (
            <ul className="divide-y divide-[#EDF2F7] dark:divide-[#2F3336]">
              {activities.slice(0, 5).map((item) => (
                <li
                  key={item.id}
                  className="py-3 -mx-2 px-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#202327] transition-colors flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(item.relatedPage)}
                      className="text-left text-[15px] font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] hover:text-[#0F52BA] dark:hover:text-[#1D9BF0] transition-colors cursor-pointer"
                    >
                      {item.title}
                    </button>
                    <p className="text-[13px] text-[#52606D] dark:text-[#71767B] mt-0.5 truncate">
                      {item.detail}
                    </p>
                  </div>
                  <span className="text-[12px] text-[#64748B] dark:text-[#71767B] shrink-0 tabular-nums">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ================================================================= */}
      {/* RIGHT RAIL: Commercial Trade Intelligence & Discovery             */}
      {/* ================================================================= */}
      <aside className="lg:col-span-4 space-y-4 min-w-0 lg:sticky lg:top-[72px]">
        {/* A. TradeSquare AI Compact Assistant Panel */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#16181C] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_3px_rgba(11,31,58,0.05)] dark:shadow-none p-4 sm:p-5"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-[#0B1F3A] dark:bg-[#1D9BF0]/15 text-[#34D399] dark:text-[#1D9BF0] flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-[17px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA] leading-snug">
              Your business intelligence assistant
            </h2>
          </div>
          <p className="text-[13px] sm:text-[14px] text-[#52606D] dark:text-[#71767B] leading-relaxed">
            Find relevant opportunities and make smarter business connections.
          </p>

          <div className="mt-3.5 space-y-1.5">
            {AI_SHORTCUTS.map((shortcut) => (
              <motion.button
                key={shortcut.label}
                type="button"
                disabled={aiLoading}
                onClick={() => {
                  setAiQuery(shortcut.label);
                  runAiAssist(shortcut.intent);
                }}
                whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className="group w-full text-left px-3.5 py-2.5 rounded-lg bg-[#F4F7FA] hover:bg-[#E8EEF5] dark:bg-[#202327] dark:hover:bg-[#272B30] text-[13px] sm:text-[14px] font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                <span className="truncate">{shortcut.label}</span>
                <ArrowRight className="w-4 h-4 text-[#0E7C5B] dark:text-[#1D9BF0] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
              </motion.button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAiAssist(aiQuery);
            }}
            className="mt-3.5 pt-3.5 border-t border-[#E6ECF3] dark:border-[#2F3336] flex gap-2"
          >
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask about buyers, suppliers, or markets..."
              className="flex-1 min-w-0 h-10 rounded-full bg-[#F4F7FA] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] px-4 text-[14px] text-[#0B1F3A] dark:text-[#E7E9EA] placeholder:text-[#64748B] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#1D9BF0] focus:bg-white dark:focus:bg-[#000000] transition-colors"
            />
            <motion.button
              type="submit"
              disabled={aiLoading}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              className="h-10 px-4 rounded-full bg-[#0E7C5B] hover:bg-[#047857] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-[13px] sm:text-[14px] font-semibold shrink-0 transition-colors cursor-pointer"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
            </motion.button>
          </form>

          {aiError && (
            <div className="mt-3 rounded-lg border border-red-200 dark:border-[#F4212E]/40 bg-red-50 dark:bg-[#F4212E]/10 p-3 text-[13px] text-red-800 dark:text-[#F4212E] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-[#F4212E] mt-0.5" />
              <span>{aiError}</span>
            </div>
          )}

          <AnimatePresence>
            {aiResult && !aiLoading && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 pt-3.5 border-t border-[#E6ECF3] dark:border-[#2F3336] space-y-2.5 text-[13px] sm:text-[14px]"
              >
                <p className="text-[#0B1F3A] dark:text-[#E7E9EA] leading-relaxed font-medium">
                  {aiResult.summary}
                </p>

                {aiResult.keyInsights.length > 0 && (
                  <ul className="space-y-1 text-[#52606D] dark:text-[#71767B]">
                    {aiResult.keyInsights.map((insight, idx) => (
                      <li key={idx} className="leading-relaxed">
                        · {insight}
                      </li>
                    ))}
                  </ul>
                )}

                {aiResult.matchedBusinesses.length > 0 && (
                  <div className="pt-1.5 space-y-1.5">
                    <p className="font-semibold text-[#0E7C5B] dark:text-[#1D9BF0]">
                      Matched Businesses
                    </p>
                    {aiResult.matchedBusinesses.map((match) => {
                      const matchedBiz = recommendations.find(
                        (rec) => rec.business.id === match.businessId
                      )?.business;
                      return (
                        <div
                          key={match.businessId}
                          className="rounded-lg bg-[#F4F7FA] dark:bg-[#000000] p-3 border border-[#E2E8F0] dark:border-[#2F3336]"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-[#0B1F3A] dark:text-[#E7E9EA]">
                              {match.businessName}
                            </p>
                            {matchedBiz?.verifiedRecord && <VerifiedBadge size="sm" />}
                          </div>
                          <p className="text-[#52606D] dark:text-[#71767B] mt-0.5">{match.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {aiResult.suggestedSearchQuery && (
                  <button
                    type="button"
                    onClick={() => onOpenDiscover(aiResult.suggestedSearchQuery)}
                    className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-semibold text-[#0F52BA] dark:text-[#1D9BF0] hover:underline cursor-pointer"
                  >
                    Open in Discover
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* B. Businesses Worth Discovering */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#16181C] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_3px_rgba(11,31,58,0.05)] dark:shadow-none p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <h2 className="text-[17px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA]">
              Businesses worth discovering
            </h2>
            <button
              type="button"
              onClick={() => onOpenDiscover()}
              className="text-[13px] sm:text-[14px] font-semibold text-[#0F52BA] dark:text-[#1D9BF0] hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          {recsLoading ? (
            <RecommendedBusinessSkeleton count={3} />
          ) : recommendations.length === 0 ? (
            <div className="rounded-lg bg-[#F4F7FA] dark:bg-[#000000] dark:border dark:border-[#2F3336] p-4 text-[13px] sm:text-[14px] text-[#52606D] dark:text-[#71767B] leading-relaxed">
              No other businesses have registered yet in this workspace. As suppliers, buyers, and
              cooperatives join, explainable recommendations appear here based on your industry and
              target markets.
            </div>
          ) : (
            <div className="space-y-3.5">
              {recommendations.map(({ business: recBiz, explanation }) => (
                <div
                  key={recBiz.id}
                  className="pb-3.5 last:pb-0 border-b last:border-b-0 border-[#EDF2F7] dark:border-[#2F3336]"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#0B1F3A]/[0.08] dark:bg-[#202327] text-[#0B1F3A] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-[15px] font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] truncate">
                            {recBiz.name}
                          </h3>
                          {recBiz.verifiedRecord && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-[13px] text-[#52606D] dark:text-[#71767B] truncate">
                          {recBiz.industry} · {[recBiz.city, recBiz.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={() => onConnectBusiness(recBiz)}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] dark:bg-[#E7E9EA] dark:hover:bg-[#D7D9DB] text-[13px] font-semibold text-[#047857] dark:text-[#0F1419] transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Connect
                    </motion.button>
                  </div>
                  <p className="mt-1.5 text-[13px] text-[#52606D] dark:text-[#71767B] leading-snug">
                    {explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* C. Regional Trade Insights */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#16181C] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_3px_rgba(11,31,58,0.05)] dark:shadow-none p-4 sm:p-5"
        >
          <h2 className="text-[17px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA]">
            Regional trade insights
          </h2>
          <p className="text-[13px] text-[#52606D] dark:text-[#71767B] mt-0.5">
            Rwanda &amp; East African corridor context
          </p>

          {regionalLoading ? (
            <RegionalInsightsSkeleton />
          ) : regionalData ? (
            <div className="mt-3.5 space-y-4">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-[#F4F7FA] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336]">
                <div>
                  <p className="text-[12px] sm:text-[13px] text-[#52606D] dark:text-[#71767B] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0E7C5B] dark:bg-[#00BA7C] shrink-0" aria-hidden="true" />
                    Active Buyer Requests
                  </p>
                  <p className="text-[20px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA] tabular-nums mt-0.5">
                    {regionalData.liveMetrics.activeBuyerRequests}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] sm:text-[13px] text-[#52606D] dark:text-[#71767B] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D97706] dark:bg-[#1D9BF0] shrink-0" aria-hidden="true" />
                    Confirmed Enquiries
                  </p>
                  <p className="text-[20px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA] tabular-nums mt-0.5">
                    {regionalData.liveMetrics.confirmedEnquiries}
                  </p>
                </div>
              </div>

              {regionalData.marketAnalysis ? (
                <div className="space-y-3">
                  {regionalData.marketAnalysis.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="pb-3 last:pb-0 border-b last:border-b-0 border-[#EDF2F7] dark:border-[#2F3336]"
                    >
                      <span className="text-[12px] font-semibold text-[#B45309] dark:text-[#1D9BF0]">
                        {item.category}
                      </span>
                      <h3 className="text-[14px] font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] mt-0.5">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-[#52606D] dark:text-[#71767B] mt-1 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-[#52606D] dark:text-[#71767B] leading-relaxed">
                  {regionalData.analysisError ||
                    'Market analysis is currently unavailable. Live network metrics above remain accurate.'}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-[#52606D] dark:text-[#71767B]">
              Regional trade insights could not be loaded right now.
            </p>
          )}
        </motion.section>
      </aside>
    </div>
  );
}

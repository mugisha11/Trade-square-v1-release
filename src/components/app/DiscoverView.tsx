import { useCallback, useEffect, useState } from 'react';
import { Building2, Loader2, MapPin, MessageSquare, Search, Sparkles } from 'lucide-react';
import type {
  AiAssistResult,
  BusinessProfile,
  BusinessRecommendation,
  OpportunityRecord,
} from '../../types/workspace';
import { OpportunityCard } from './OpportunityCard';
import { VerifiedBadge } from './VerifiedBadge';
import { DiscoverBusinessSkeleton, OpportunityCardSkeleton } from './WorkspaceSkeletons';
import { authFetch } from '../../lib/authClient';

interface DiscoverViewProps {
  initialQuery?: string;
  initialBusinessType?: string;
  onViewOpportunity: (opp: OpportunityRecord) => void;
  onContactOpportunity: (opp: OpportunityRecord) => void;
  onExpressInterest: (opp: OpportunityRecord) => void;
  onToggleSave: (opp: OpportunityRecord) => void;
  onConnectBusiness: (biz: BusinessProfile) => void;
  busyOpportunityId: string | null;
}

const BUSINESS_TYPES = [
  'All',
  'Buyer',
  'Supplier',
  'Manufacturer',
  'Distributor',
  'Importer / Exporter',
  'Agricultural Producer',
  'Cooperative',
  'Service Provider',
  'SME',
];

const COUNTRIES = ['All', 'Rwanda', 'Kenya', 'Uganda', 'Tanzania', 'Burundi', 'DRC'];

export function DiscoverView({
  initialQuery = '',
  initialBusinessType = 'All',
  onViewOpportunity,
  onContactOpportunity,
  onExpressInterest,
  onToggleSave,
  onConnectBusiness,
  busyOpportunityId,
}: DiscoverViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [country, setCountry] = useState('All');

  const [businesses, setBusinesses] = useState<BusinessRecommendation[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aiResult, setAiResult] = useState<AiAssistResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setBusinessType(initialBusinessType);
  }, [initialBusinessType]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (businessType !== 'All') params.set('businessType', businessType);
      if (country !== 'All') params.set('country', country);

      const res = await authFetch(`/api/discover?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load discovery results.');
      }
      setBusinesses(data.businesses ?? []);
      setOpportunities(data.opportunities ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Discovery search failed.');
    } finally {
      setLoading(false);
    }
  }, [query, businessType, country]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  async function handleAiInterpret() {
    if (query.trim().length < 4) return;
    setAiLoading(true);
    try {
      const res = await authFetch('/api/ai/discover-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiResult(data.result);
      }
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
          Discover Businesses &amp; Opportunities
        </h1>
        <p className="text-sm text-[#525866] dark:text-[#71767B] mt-1">
          Search across Rwanda and East African enterprises, products, services, and commercial requests.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          className="mt-4 flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] dark:text-[#71767B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search businesses, products, capabilities, or natural-language needs..."
              className="w-full min-h-[42px] pl-10 pr-4 rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-[#F3F6F8] focus:bg-white dark:bg-[#000000] dark:focus:bg-[#000000] text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
            />
          </div>

          <select
            aria-label="Filter by business type"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
          >
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'All' ? 'All Business Types' : type}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Markets' : c}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={aiLoading || query.trim().length < 4}
            onClick={handleAiInterpret}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 rounded-lg border border-[#0A66C2] dark:border-[#1D9BF0] text-[#0A66C2] dark:text-[#1D9BF0] hover:bg-[#0A66C2]/5 dark:hover:bg-[#1D9BF0]/10 disabled:opacity-50 text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Match
          </button>
        </form>

        {aiResult && (
          <div className="mt-4 p-4 rounded-xl bg-[#F3F6F8] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] space-y-2 text-xs">
            <p className="font-semibold text-[#004182] dark:text-[#1D9BF0]">
              TradeSquare AI Interpretation
            </p>
            <p className="text-[#191919] dark:text-[#E7E9EA] leading-relaxed">{aiResult.summary}</p>
            {aiResult.recommendedActions.length > 0 && (
              <ul className="space-y-1 text-[#475569] dark:text-[#71767B]">
                {aiResult.recommendedActions.map((act, i) => (
                  <li key={i}>· {act}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="h-5 w-32 rounded-md apple-skeleton" />
            <DiscoverBusinessSkeleton count={3} />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="h-5 w-36 rounded-md apple-skeleton" />
            <OpportunityCardSkeleton count={2} />
          </div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#16181C] border border-red-200 dark:border-[#F4212E]/40 rounded-xl p-6 text-sm text-red-700 dark:text-[#F4212E]">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Matching Businesses */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Businesses ({businesses.length})
            </h2>
            {businesses.length === 0 ? (
              <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-6 text-sm text-[#525866] dark:text-[#71767B]">
                No matching businesses found for your current filters.
              </div>
            ) : (
              businesses.map(({ business, explanation }) => (
                <article
                  key={business.id}
                  className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/10 dark:bg-[#1D9BF0]/15 text-[#004182] dark:text-[#1D9BF0] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA] truncate">
                          {business.name}
                        </h3>
                        {business.verifiedRecord && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-[#525866] dark:text-[#71767B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {[business.city, business.country].filter(Boolean).join(', ')} ·{' '}
                        {business.businessType}
                      </p>
                    </div>
                  </div>
                  {business.description && (
                    <p className="text-xs text-[#475569] dark:text-[#E7E9EA]/85 leading-relaxed">
                      {business.description}
                    </p>
                  )}
                  <p className="text-[11px] text-[#004182] dark:text-[#1D9BF0]">{explanation}</p>
                  <button
                    type="button"
                    onClick={() => onConnectBusiness(business)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0A66C2]/35 dark:border-[#1D9BF0]/40 text-xs font-medium text-[#0A66C2] dark:text-[#1D9BF0] hover:bg-[#0A66C2]/5 dark:hover:bg-[#1D9BF0]/10 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message Business
                  </button>
                </article>
              ))
            )}
          </div>

          {/* Matching Opportunities */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Opportunities ({opportunities.length})
            </h2>
            {opportunities.length === 0 ? (
              <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-6 text-sm text-[#525866] dark:text-[#71767B]">
                No matching opportunities found.
              </div>
            ) : (
              opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onView={onViewOpportunity}
                  onContact={onContactOpportunity}
                  onExpressInterest={onExpressInterest}
                  onToggleSave={onToggleSave}
                  busyId={busyOpportunityId}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

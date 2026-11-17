import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Filter,
  Handshake,
  MapPin,
  MessageSquare,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from 'lucide-react';
import type {
  OpportunityRecord,
  OpportunityStatus,
  OpportunityType,
} from '../../types/workspace';
import { OPPORTUNITY_TYPE_OPTIONS, opportunityTypeLabel } from '../../lib/opportunityFields';
import { VerifiedBadge } from './VerifiedBadge';

interface OpportunitiesViewProps {
  opportunities: OpportunityRecord[];
  loading: boolean;
  onOpenPublish: (initialType?: OpportunityType) => void;
  onResumeDraft: (opp: OpportunityRecord) => void;
  onManageStatus: (opp: OpportunityRecord, status: OpportunityStatus) => void;
  onViewOpportunity: (opp: OpportunityRecord) => void;
  onContactOpportunity: (opp: OpportunityRecord) => void;
  onExpressInterest: (opp: OpportunityRecord) => void;
  onToggleSave: (opp: OpportunityRecord) => void;
  busyOpportunityId: string | null;
}

type ScopeTab = 'all' | 'saved' | 'mine';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export function OpportunitiesView({
  opportunities,
  loading,
  onOpenPublish,
  onResumeDraft,
  onManageStatus,
  onViewOpportunity,
  onContactOpportunity,
  onExpressInterest,
  onToggleSave,
  busyOpportunityId,
}: OpportunitiesViewProps) {
  const [scope, setScope] = useState<ScopeTab>('all');
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | OpportunityType>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const loc = locationQuery.trim().toLowerCase();
    return opportunities.filter((o) => {
      const status = o.status ?? 'published';
      if (scope === 'saved') {
        if (!(o.savedByMe && status === 'published')) return false;
      } else if (scope === 'mine') {
        if (!o.isOwnOpportunity) return false;
      } else if (status !== 'published') {
        return false;
      }
      if (typeFilter !== 'All' && o.type !== typeFilter) return false;
      if (q) {
        const hay = [
          o.productOrService,
          o.description,
          o.businessName,
          o.industry,
          o.type,
          o.destinationMarket ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (loc) {
        const place = `${o.businessLocation} ${o.destinationMarket ?? ''} ${o.originLocation ?? ''}`.toLowerCase();
        if (!place.includes(loc)) return false;
      }
      return true;
    });
  }, [opportunities, scope, typeFilter, query, locationQuery]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((o) => o.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((o) => o.id === selectedId) ?? null;

  function selectOpportunity(opp: OpportunityRecord) {
    setSelectedId(opp.id);
    setMobileShowDetail(true);
  }

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    for (const opt of OPPORTUNITY_TYPE_OPTIONS) counts[opt.value] = 0;
    for (const o of opportunities) {
      if ((o.status ?? 'published') !== 'published' && !o.isOwnOpportunity) continue;
      if (scope === 'saved' && !o.savedByMe) continue;
      if (scope === 'mine' && !o.isOwnOpportunity) continue;
      if (scope === 'all' && (o.status ?? 'published') !== 'published') continue;
      counts.All += 1;
      counts[o.type] = (counts[o.type] || 0) + 1;
    }
    return counts;
  }, [opportunities, scope]);

  return (
    <div className="min-h-[calc(100dvh-8rem)]">
      {/* LinkedIn Jobs–style sticky search header */}
      <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 lg:-mx-8 mb-3 border-b border-[#E0E0E0] dark:border-[#2F3336] bg-[#F4F2EE]/95 dark:bg-[#000000]/95 backdrop-blur-md">
        <div className="max-w-[1128px] mx-auto px-4 sm:px-6 py-3 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <label className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-[#71767B]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, product, or business"
                  className="w-full h-11 sm:h-12 pl-10 pr-3 rounded-lg border border-[#8C8C8C66] dark:border-[#2F3336] bg-white dark:bg-[#16181C] text-[15px] text-[#191919] dark:text-[#E7E9EA] placeholder:text-[#00000099] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
              </label>
              <label className="relative sm:w-[220px] shrink-0">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-[#71767B]" />
                <input
                  type="search"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="City, country, or market"
                  className="w-full h-11 sm:h-12 pl-10 pr-3 rounded-lg border border-[#8C8C8C66] dark:border-[#2F3336] bg-white dark:bg-[#16181C] text-[15px] text-[#191919] dark:text-[#E7E9EA] placeholder:text-[#00000099] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="lg:hidden h-11 px-3.5 rounded-full border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#E8F3FC] cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <button
                type="button"
                onClick={() => onOpenPublish('Buyer Request')}
                className="h-11 px-4 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Post opportunity</span>
                <span className="sm:hidden">Post</span>
              </button>
            </div>
          </div>

          {/* Scope tabs — LinkedIn pill row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {(
              [
                { id: 'all', label: 'For you' },
                { id: 'saved', label: 'Saved' },
                { id: 'mine', label: 'My posts' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setScope(tab.id);
                  setMobileShowDetail(false);
                }}
                className={`shrink-0 h-8 px-3.5 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                  scope === tab.id
                    ? 'bg-[#01754F] border-[#01754F] text-white'
                    : 'bg-white dark:bg-[#16181C] border-[#8C8C8C66] dark:border-[#2F3336] text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] hover:border-[#191919]'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="hidden sm:inline w-px h-5 bg-[#E0E0E0] dark:bg-[#2F3336] mx-1" />
            <button
              type="button"
              onClick={() => setTypeFilter('All')}
              className={`shrink-0 h-8 px-3.5 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                typeFilter === 'All'
                  ? 'bg-[#0A66C2] border-[#0A66C2] text-white'
                  : 'bg-white dark:bg-[#16181C] border-[#8C8C8C66] dark:border-[#2F3336] text-[#191919] dark:text-[#E7E9EA]'
              }`}
            >
              All types
            </button>
            {OPPORTUNITY_TYPE_OPTIONS.slice(0, 4).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTypeFilter(opt.value)}
                className={`shrink-0 h-8 px-3.5 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                  typeFilter === opt.value
                    ? 'bg-[#0A66C2] border-[#0A66C2] text-white'
                    : 'bg-white dark:bg-[#16181C] border-[#8C8C8C66] dark:border-[#2F3336] text-[#191919] dark:text-[#E7E9EA]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1128px] mx-auto">
        {/* Open to work–style promo (LinkedIn) */}
        <div className="mb-3 rounded-xl border border-[#E0E0E0] dark:border-[#2F3336] bg-white dark:bg-[#16181C] overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#70B5F9] flex items-center justify-center shrink-0 shadow-sm">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] sm:text-[18px] font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Open to commercial opportunities
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#666666] dark:text-[#71767B] mt-0.5">
                Share a buying request, supplier offer, or partnership — structured for discovery and matching.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenPublish('Buyer Request')}
              className="h-10 px-4 rounded-full border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold hover:bg-[#E8F3FC] dark:hover:bg-[#1D9BF0]/10 cursor-pointer shrink-0 self-start sm:self-center"
            >
              Get started
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* Left filters — LinkedIn jobs sidebar */}
          <aside
            className={`${
              filtersOpen ? 'block' : 'hidden'
            } lg:block lg:col-span-3 space-y-3`}
          >
            <div className="rounded-xl border border-[#E0E0E0] dark:border-[#2F3336] bg-white dark:bg-[#16181C] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[16px] font-semibold text-[#191919] dark:text-[#E7E9EA] inline-flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#666666]" />
                  Filters
                </p>
                <button
                  type="button"
                  className="lg:hidden w-8 h-8 rounded-full hover:bg-[#F3F6F8] dark:hover:bg-[#202327] flex items-center justify-center cursor-pointer"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#666666] dark:text-[#71767B] mb-2">
                Opportunity type
              </p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('All')}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-[14px] flex items-center justify-between cursor-pointer ${
                      typeFilter === 'All'
                        ? 'bg-[#E8F3FC] dark:bg-[#1D9BF0]/15 text-[#0A66C2] font-semibold'
                        : 'text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F3F6F8] dark:hover:bg-[#202327]'
                    }`}
                  >
                    <span>All</span>
                    <span className="text-[12px] text-[#666666]">{typeCounts.All || 0}</span>
                  </button>
                </li>
                {OPPORTUNITY_TYPE_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter(opt.value);
                        setFiltersOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-[14px] flex items-center justify-between cursor-pointer ${
                        typeFilter === opt.value
                          ? 'bg-[#E8F3FC] dark:bg-[#1D9BF0]/15 text-[#0A66C2] font-semibold'
                          : 'text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F3F6F8] dark:hover:bg-[#202327]'
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      <span className="text-[12px] text-[#666666]">{typeCounts[opt.value] || 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden lg:block rounded-xl border border-[#E0E0E0] dark:border-[#2F3336] bg-white dark:bg-[#16181C] p-4">
              <p className="text-[15px] font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Prefer relevant matches
              </p>
              <p className="text-[13px] text-[#666666] dark:text-[#71767B] mt-1 leading-relaxed">
                Complete commercial details on your posts so TradeSquare can surface them to the right buyers and suppliers.
              </p>
            </div>
          </aside>

          {/* Center list + right detail — LinkedIn split pane */}
          <div className="lg:col-span-9">
            <div className="rounded-xl border border-[#E0E0E0] dark:border-[#2F3336] bg-white dark:bg-[#16181C] overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.04)] min-h-[520px]">
              <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[520px]">
                {/* Job list */}
                <div
                  className={`xl:col-span-5 border-b xl:border-b-0 xl:border-r border-[#E0E0E0] dark:border-[#2F3336] ${
                    mobileShowDetail ? 'hidden xl:block' : 'block'
                  }`}
                >
                  <div className="px-4 py-3 border-b border-[#E0E0E0] dark:border-[#2F3336] flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[16px] font-semibold text-[#191919] dark:text-[#E7E9EA]">
                        {scope === 'mine' ? 'My opportunities' : 'Top opportunities for you'}
                      </p>
                      <p className="text-[12px] text-[#666666] dark:text-[#71767B]">
                        {loading ? 'Loading…' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="divide-y divide-[#E0E0E0] dark:divide-[#2F3336]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 animate-pulse space-y-2">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[#E8E8E8] dark:bg-[#202327]" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-[#E8E8E8] dark:bg-[#202327] rounded w-3/4" />
                              <div className="h-3 bg-[#E8E8E8] dark:bg-[#202327] rounded w-1/2" />
                              <div className="h-3 bg-[#E8E8E8] dark:bg-[#202327] rounded w-2/3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="p-10 text-center">
                      <Briefcase className="w-10 h-10 text-[#0A66C2] mx-auto mb-3 opacity-80" />
                      <h3 className="text-[16px] font-semibold text-[#191919] dark:text-[#E7E9EA]">
                        No opportunities match
                      </h3>
                      <p className="text-[14px] text-[#666666] dark:text-[#71767B] mt-1 max-w-xs mx-auto">
                        Try another filter, or post an opportunity so businesses can find you.
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenPublish('Buyer Request')}
                        className="mt-4 h-10 px-4 rounded-full bg-[#0A66C2] text-white text-sm font-semibold cursor-pointer"
                      >
                        Post opportunity
                      </button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-[#E0E0E0] dark:divide-[#2F3336] max-h-[70vh] xl:max-h-[calc(100dvh-16rem)] overflow-y-auto">
                      {filtered.map((opp) => {
                        const active = opp.id === selectedId;
                        const status = opp.status ?? 'published';
                        return (
                          <li key={opp.id}>
                            <button
                              type="button"
                              onClick={() => selectOpportunity(opp)}
                              className={`w-full text-left p-4 transition-colors cursor-pointer border-l-4 ${
                                active
                                  ? 'bg-[#E8F3FC]/70 dark:bg-[#1D9BF0]/10 border-l-[#0A66C2]'
                                  : 'border-l-transparent hover:bg-[#F3F6F8] dark:hover:bg-[#0A0A0A]'
                              }`}
                            >
                              <div className="flex gap-3">
                                {opp.businessLogoUrl ? (
                                  <img
                                    src={opp.businessLogoUrl}
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover border border-[#E0E0E0] dark:border-[#2F3336] shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-[#F3F6F8] dark:bg-[#202327] text-[#0A66C2] font-semibold flex items-center justify-center shrink-0 border border-[#E0E0E0] dark:border-[#2F3336]">
                                    {initials(opp.businessName) || <Building2 className="w-5 h-5" />}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[15px] font-semibold text-[#0A66C2] dark:text-[#1D9BF0] leading-snug line-clamp-2">
                                    {opp.productOrService}
                                  </p>
                                  <p className="text-[14px] text-[#191919] dark:text-[#E7E9EA] mt-0.5 truncate inline-flex items-center gap-1">
                                    {opp.businessName}
                                    {opp.verifiedRecord && <VerifiedBadge size="sm" />}
                                  </p>
                                  <p className="text-[13px] text-[#666666] dark:text-[#71767B] mt-0.5 truncate inline-flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    {opp.destinationMarket || opp.businessLocation}
                                  </p>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    <span className="text-[12px] font-medium text-[#01754F] dark:text-[#00BA7C]">
                                      {opportunityTypeLabel(opp.type)}
                                    </span>
                                    <span className="text-[#8C8C8C]">·</span>
                                    <span className="text-[12px] text-[#666666] dark:text-[#71767B]">
                                      {timeAgo(opp.createdAt)}
                                    </span>
                                    {scope === 'mine' && (
                                      <>
                                        <span className="text-[#8C8C8C]">·</span>
                                        <span className="text-[12px] capitalize text-[#666666]">{status}</span>
                                      </>
                                    )}
                                    {opp.savedByMe && scope !== 'mine' && (
                                      <BookmarkCheck className="w-3.5 h-3.5 text-[#0A66C2] ml-auto" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Detail pane */}
                <div
                  className={`xl:col-span-7 ${
                    mobileShowDetail ? 'block' : 'hidden xl:block'
                  }`}
                >
                  {!selected ? (
                    <div className="h-full min-h-[320px] flex items-center justify-center p-8 text-center">
                      <div>
                        <Briefcase className="w-12 h-12 text-[#CFCFCF] mx-auto mb-3" />
                        <p className="text-[16px] font-semibold text-[#191919] dark:text-[#E7E9EA]">
                          Select an opportunity
                        </p>
                        <p className="text-[14px] text-[#666666] dark:text-[#71767B] mt-1">
                          Choose a listing to see full commercial details.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <OpportunitySplitDetail
                      opportunity={selected}
                      busy={busyOpportunityId === selected.id}
                      showBack
                      onBack={() => setMobileShowDetail(false)}
                      onView={() => onViewOpportunity(selected)}
                      onContact={() => onContactOpportunity(selected)}
                      onExpressInterest={() => onExpressInterest(selected)}
                      onToggleSave={() => onToggleSave(selected)}
                      onResumeDraft={() => onResumeDraft(selected)}
                      onManageStatus={(status) => onManageStatus(selected, status)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpportunitySplitDetail({
  opportunity,
  busy,
  showBack,
  onBack,
  onView,
  onContact,
  onExpressInterest,
  onToggleSave,
  onResumeDraft,
  onManageStatus,
}: {
  opportunity: OpportunityRecord;
  busy: boolean;
  showBack: boolean;
  onBack: () => void;
  onView: () => void;
  onContact: () => void;
  onExpressInterest: () => void;
  onToggleSave: () => void;
  onResumeDraft: () => void;
  onManageStatus: (status: OpportunityStatus) => void;
}) {
  const status = opportunity.status ?? 'published';
  const qty =
    opportunity.quantityAndSpecs ||
    [opportunity.quantity, opportunity.unit].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col max-h-[70vh] xl:max-h-[calc(100dvh-16rem)]">
      <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-[#E0E0E0] dark:border-[#2F3336] flex items-center gap-2 xl:hidden">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full hover:bg-[#F3F6F8] dark:hover:bg-[#202327] flex items-center justify-center cursor-pointer"
            aria-label="Back to list"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <p className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] truncate">
          Opportunity details
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="flex items-start gap-3">
          {opportunity.businessLogoUrl ? (
            <img
              src={opportunity.businessLogoUrl}
              alt=""
              className="w-14 h-14 rounded-lg object-cover border border-[#E0E0E0] dark:border-[#2F3336]"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-[#E8F3FC] text-[#0A66C2] font-semibold flex items-center justify-center border border-[#E0E0E0]">
              {initials(opportunity.businessName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#191919] dark:text-[#E7E9EA] leading-snug">
              {opportunity.productOrService}
            </h2>
            <p className="text-[15px] text-[#191919] dark:text-[#E7E9EA] mt-1 inline-flex items-center gap-1.5 flex-wrap">
              <span className="font-medium">{opportunity.businessName}</span>
              {opportunity.verifiedRecord && <VerifiedBadge size="sm" />}
            </p>
            <p className="text-[13px] text-[#666666] dark:text-[#71767B] mt-0.5 flex flex-wrap items-center gap-x-1.5">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {opportunity.businessLocation}
              </span>
              <span>·</span>
              <span>{opportunity.industry}</span>
              <span>·</span>
              <span>{opportunityTypeLabel(opportunity.type)}</span>
            </p>
          </div>
        </div>

        {/* Facebook/LinkedIn action row */}
        <div className="mt-4 flex flex-wrap gap-2">
          {!opportunity.isOwnOpportunity ? (
            <>
              <button
                type="button"
                disabled={busy || opportunity.interestExpressedByMe}
                onClick={onExpressInterest}
                className={`h-10 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                  opportunity.interestExpressedByMe
                    ? 'bg-[#01754F]/15 text-[#01754F]'
                    : 'bg-[#0A66C2] hover:bg-[#004182] text-white'
                }`}
              >
                <Handshake className="w-4 h-4" />
                {opportunity.interestExpressedByMe ? 'Interest sent' : 'Easy apply'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onContact}
                className="h-10 px-4 rounded-full border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#E8F3FC] dark:hover:bg-[#1D9BF0]/10 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            </>
          ) : (
            <>
              {(status === 'draft' || status === 'paused' || status === 'published') && (
                <button
                  type="button"
                  onClick={onResumeDraft}
                  className="h-10 px-4 rounded-full bg-[#0A66C2] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  {status === 'draft' ? 'Resume draft' : 'Edit'}
                </button>
              )}
              {status === 'published' && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onManageStatus('paused')}
                    className="h-10 px-3.5 rounded-full border border-[#8C8C8C66] text-[#191919] dark:text-[#E7E9EA] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onManageStatus('fulfilled')}
                    className="h-10 px-3.5 rounded-full border border-[#8C8C8C66] text-[#191919] dark:text-[#E7E9EA] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Fulfilled
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onManageStatus('closed')}
                    className="h-10 px-3.5 rounded-full border border-[#FECACA] text-[#B91C1C] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Close
                  </button>
                </>
              )}
              {status === 'paused' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onManageStatus('published')}
                  className="h-10 px-4 rounded-full bg-[#01754F] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onToggleSave}
            className="h-10 px-3.5 rounded-full border border-[#8C8C8C66] dark:border-[#2F3336] text-[#191919] dark:text-[#E7E9EA] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#F3F6F8] dark:hover:bg-[#202327] cursor-pointer"
          >
            {opportunity.savedByMe ? (
              <BookmarkCheck className="w-4 h-4 text-[#0A66C2]" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            {opportunity.savedByMe ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="mt-5 pt-5 border-t border-[#E0E0E0] dark:border-[#2F3336] space-y-4">
          <div>
            <h3 className="text-[16px] font-semibold text-[#191919] dark:text-[#E7E9EA]">About the opportunity</h3>
            <p className="mt-2 text-[14px] sm:text-[15px] text-[#191919]/90 dark:text-[#E7E9EA]/90 leading-relaxed whitespace-pre-wrap">
              {opportunity.description || 'No description provided.'}
            </p>
          </div>

          {(qty ||
            opportunity.budgetOrPrice ||
            opportunity.destinationMarket ||
            opportunity.originLocation ||
            opportunity.deadline ||
            opportunity.deliveryTimeline ||
            opportunity.requiredCertifications ||
            opportunity.paymentTerms) && (
            <div>
              <h3 className="text-[16px] font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Commercial details
              </h3>
              <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {qty && (
                  <div className="rounded-lg bg-[#F3F6F8] dark:bg-[#0A0A0A] border border-[#E0E0E0] dark:border-[#2F3336] p-3">
                    <dt className="text-[12px] text-[#666666]">Quantity & specs</dt>
                    <dd className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] mt-0.5">
                      {qty}
                    </dd>
                  </div>
                )}
                {opportunity.budgetOrPrice && (
                  <div className="rounded-lg bg-[#F3F6F8] dark:bg-[#0A0A0A] border border-[#E0E0E0] dark:border-[#2F3336] p-3">
                    <dt className="text-[12px] text-[#666666]">Budget / price</dt>
                    <dd className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] mt-0.5">
                      {[opportunity.currency, opportunity.budgetOrPrice].filter(Boolean).join(' ')}
                      {opportunity.priceNegotiable ? ' · negotiable' : ''}
                    </dd>
                  </div>
                )}
                {opportunity.originLocation && (
                  <div className="rounded-lg bg-[#F3F6F8] dark:bg-[#0A0A0A] border border-[#E0E0E0] dark:border-[#2F3336] p-3">
                    <dt className="text-[12px] text-[#666666]">Origin</dt>
                    <dd className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] mt-0.5">
                      {opportunity.originLocation}
                    </dd>
                  </div>
                )}
                {opportunity.destinationMarket && (
                  <div className="rounded-lg bg-[#F3F6F8] dark:bg-[#0A0A0A] border border-[#E0E0E0] dark:border-[#2F3336] p-3">
                    <dt className="text-[12px] text-[#666666]">Destination / markets</dt>
                    <dd className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] mt-0.5">
                      {opportunity.destinationMarket}
                    </dd>
                  </div>
                )}
                {opportunity.deliveryTimeline && (
                  <div className="rounded-lg bg-[#F3F6F8] dark:bg-[#0A0A0A] border border-[#E0E0E0] dark:border-[#2F3336] p-3">
                    <dt className="text-[12px] text-[#666666]">Timeline</dt>
                    <dd className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] mt-0.5">
                      {opportunity.deliveryTimeline}
                    </dd>
                  </div>
                )}
                {opportunity.deadline && (
                  <div className="rounded-lg bg-[#F3F6F8] dark:bg-[#0A0A0A] border border-[#E0E0E0] dark:border-[#2F3336] p-3">
                    <dt className="text-[12px] text-[#666666]">Deadline</dt>
                    <dd className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] mt-0.5 inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#B45309]" />
                      {opportunity.deadline}
                    </dd>
                  </div>
                )}
                {opportunity.paymentTerms && (
                  <div className="rounded-lg bg-[#F3F6F8] dark:bg-[#0A0A0A] border border-[#E0E0E0] dark:border-[#2F3336] p-3">
                    <dt className="text-[12px] text-[#666666]">Payment terms</dt>
                    <dd className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] mt-0.5">
                      {opportunity.paymentTerms}
                    </dd>
                  </div>
                )}
                {opportunity.requiredCertifications && (
                  <div className="sm:col-span-2 rounded-lg bg-[#F3F6F8] dark:bg-[#0A0A0A] border border-[#E0E0E0] dark:border-[#2F3336] p-3">
                    <dt className="text-[12px] text-[#666666]">Certifications / docs</dt>
                    <dd className="text-[14px] font-semibold text-[#191919] dark:text-[#E7E9EA] mt-0.5">
                      {opportunity.requiredCertifications}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <button
            type="button"
            onClick={onView}
            className="text-[14px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
          >
            Open full opportunity view
          </button>
        </div>
      </div>
    </div>
  );
}

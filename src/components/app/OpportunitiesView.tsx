import { useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import type { OpportunityRecord, OpportunityType } from '../../types/workspace';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityCardSkeleton } from './WorkspaceSkeletons';

interface OpportunitiesViewProps {
  opportunities: OpportunityRecord[];
  loading: boolean;
  onOpenPublish: (initialType?: OpportunityType) => void;
  onViewOpportunity: (opp: OpportunityRecord) => void;
  onContactOpportunity: (opp: OpportunityRecord) => void;
  onExpressInterest: (opp: OpportunityRecord) => void;
  onToggleSave: (opp: OpportunityRecord) => void;
  busyOpportunityId: string | null;
}

export function OpportunitiesView({
  opportunities,
  loading,
  onOpenPublish,
  onViewOpportunity,
  onContactOpportunity,
  onExpressInterest,
  onToggleSave,
  busyOpportunityId,
}: OpportunitiesViewProps) {
  const [scope, setScope] = useState<'all' | 'saved' | 'mine'>('all');

  const filtered = opportunities.filter((o) => {
    if (scope === 'saved') return o.savedByMe;
    if (scope === 'mine') return o.isOwnOpportunity;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
            Opportunities
          </h1>
          <p className="text-sm text-[#525866] dark:text-[#71767B] mt-1">
            Browse active buyer requests, supplier offers, and regional partnership mandates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenPublish('Buyer Request')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Publish Opportunity
        </button>
      </div>

      <div className="inline-flex p-1 bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-lg">
        {(
          [
            { id: 'all', label: 'All Opportunities' },
            { id: 'saved', label: 'Saved' },
            { id: 'mine', label: 'My Published' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setScope(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              scope === tab.id
                ? 'bg-[#0A66C2] dark:bg-[#1D9BF0] text-white'
                : 'text-[#525866] dark:text-[#71767B] hover:text-[#191919] dark:hover:text-[#E7E9EA]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <OpportunityCardSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-10 text-center">
          <Briefcase className="w-8 h-8 text-[#0A66C2] dark:text-[#1D9BF0] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
            No opportunities in this view
          </h2>
          <p className="text-sm text-[#525866] dark:text-[#71767B] mt-1 max-w-md mx-auto">
            Publish a buying request or supplier offer to connect with verified enterprises.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onView={onViewOpportunity}
              onContact={onContactOpportunity}
              onExpressInterest={onExpressInterest}
              onToggleSave={onToggleSave}
              busyId={busyOpportunityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

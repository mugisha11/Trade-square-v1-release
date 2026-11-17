import { Calendar, MapPin, MessageSquare, X } from 'lucide-react';
import type { OpportunityRecord } from '../../types/workspace';
import { VerifiedBadge } from './VerifiedBadge';

interface OpportunityDetailModalProps {
  opportunity: OpportunityRecord;
  onClose: () => void;
  onContact: (opp: OpportunityRecord) => void;
  onExpressInterest: (opp: OpportunityRecord) => void;
}

export function OpportunityDetailModal({
  opportunity,
  onClose,
  onContact,
  onExpressInterest,
}: OpportunityDetailModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 dark:bg-[#5B7083]/40 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#16181C] rounded-2xl border border-[#E2E8F0] dark:border-[#2F3336] shadow-xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close opportunity details"
          className="absolute top-4 right-4 w-9 h-9 rounded-lg text-[#64748B] dark:text-[#71767B] hover:text-[#191919] dark:hover:text-[#E7E9EA] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-8">
          <p className="text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0]">
            {opportunity.type}
          </p>
          <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA] mt-1">
            {opportunity.productOrService}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#525866] dark:text-[#71767B]">
            <span className="font-medium text-[#191919] dark:text-[#E7E9EA]">
              {opportunity.businessName}
            </span>
            {opportunity.verifiedRecord && <VerifiedBadge size="sm" />}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {opportunity.businessLocation}
            </span>
            <span aria-hidden="true">·</span>
            <span>{opportunity.industry}</span>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[#E8EDF2] dark:border-[#2F3336]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#71767B]">
            Commercial Details
          </h3>
          <p className="mt-2 text-sm text-[#334155] dark:text-[#E7E9EA] leading-relaxed whitespace-pre-line">
            {opportunity.description}
          </p>

          {(opportunity.quantityAndSpecs || opportunity.destinationMarket || opportunity.deadline) && (
            <dl className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F3F6F8] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] text-xs">
              {opportunity.quantityAndSpecs && (
                <div>
                  <dt className="text-[#64748B] dark:text-[#71767B]">Quantity &amp; Specs</dt>
                  <dd className="font-semibold text-[#191919] dark:text-[#E7E9EA] mt-1">
                    {opportunity.quantityAndSpecs}
                  </dd>
                </div>
              )}
              {opportunity.destinationMarket && (
                <div>
                  <dt className="text-[#64748B] dark:text-[#71767B]">Destination Market</dt>
                  <dd className="font-semibold text-[#191919] dark:text-[#E7E9EA] mt-1">
                    {opportunity.destinationMarket}
                  </dd>
                </div>
              )}
              {opportunity.deadline && (
                <div>
                  <dt className="text-[#64748B] dark:text-[#71767B]">Deadline</dt>
                  <dd className="font-semibold text-[#191919] dark:text-[#E7E9EA] mt-1 inline-flex items-center gap-1 tabular-nums">
                    <Calendar className="w-3 h-3" />
                    {opportunity.deadline}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#E8EDF2] dark:border-[#2F3336] flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#525866] dark:text-[#71767B] hover:text-[#191919] dark:hover:text-[#E7E9EA] rounded-lg cursor-pointer"
          >
            Close
          </button>

          {!opportunity.isOwnOpportunity && (
            <>
              <button
                type="button"
                onClick={() => onContact(opportunity)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#0A66C2] dark:text-[#1D9BF0] border border-[#0A66C2]/35 dark:border-[#1D9BF0]/40 hover:bg-[#0A66C2]/5 dark:hover:bg-[#1D9BF0]/10 rounded-lg cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Contact business
              </button>
              <button
                type="button"
                disabled={opportunity.interestExpressedByMe}
                onClick={() => onExpressInterest(opportunity)}
                className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
                  opportunity.interestExpressedByMe
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#00BA7C]/15 dark:text-[#00BA7C] dark:border-[#00BA7C]/30 cursor-default'
                    : 'bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white'
                }`}
              >
                {opportunity.interestExpressedByMe ? 'Interest sent' : 'Express interest'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

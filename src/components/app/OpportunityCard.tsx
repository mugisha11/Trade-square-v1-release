import {
  Bookmark,
  Building2,
  Calendar,
  Eye,
  Handshake,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { OpportunityRecord } from '../../types/workspace';
import { opportunityTypeLabel } from '../../lib/opportunityFields';
import { VerifiedBadge } from './VerifiedBadge';

interface OpportunityCardProps {
  opportunity: OpportunityRecord;
  index?: number;
  onView: (opp: OpportunityRecord) => void;
  onContact: (opp: OpportunityRecord) => void;
  onExpressInterest: (opp: OpportunityRecord) => void;
  onToggleSave: (opp: OpportunityRecord) => void;
  busyId?: string | null;
}

function getOpportunityTypeStyle(type: OpportunityRecord['type']): string {
  if (type === 'Buyer Request' || type === 'Procurement' || type === 'Service Request') {
    return 'text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0]/70 dark:text-[#00BA7C] dark:bg-[#00BA7C]/15 dark:border-[#00BA7C]/30';
  }
  if (type === 'Supplier Offer' || type === 'Export Opportunity') {
    return 'text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A]/80 dark:text-[#FBBF24] dark:bg-[#F59E0B]/15 dark:border-[#F59E0B]/30';
  }
  return 'text-[#0F52BA] bg-[#EFF6FF] border border-[#BFDBFE]/80 dark:text-[#1D9BF0] dark:bg-[#1D9BF0]/15 dark:border-[#1D9BF0]/30';
}

export function OpportunityCard({
  opportunity,
  index = 0,
  onView,
  onContact,
  onExpressInterest,
  onToggleSave,
  busyId,
}: OpportunityCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const isBusy = busyId === opportunity.id;
  const initials = opportunity.businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <motion.article
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
      transition={{
        duration: 0.34,
        delay: prefersReducedMotion ? 0 : Math.min(index * 0.045, 0.22),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -2, transition: { type: 'spring', stiffness: 360, damping: 28 } }
      }
      className="bg-white dark:bg-[#000000] rounded-xl border border-[#DCE3EC] dark:border-[#2F3336] shadow-[0_1px_3px_rgba(11,31,58,0.05)] dark:shadow-none hover:shadow-[0_10px_28px_rgba(11,31,58,0.09)] dark:hover:shadow-none hover:border-[#CBD5E1] dark:hover:border-[#3E4144] dark:hover:bg-[#08090B] transition-all duration-300 overflow-hidden"
    >
      {/* Post Header: Circular Business Avatar + Identity + Save Action */}
      <div className="px-4 sm:px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {opportunity.businessLogoUrl ? (
            <img
              src={opportunity.businessLogoUrl}
              alt={opportunity.businessName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-[#DCE3EC] dark:border-[#2F3336] shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#0B1F3A]/[0.08] dark:bg-[#202327] text-[#0B1F3A] dark:text-[#E7E9EA] font-semibold text-sm flex items-center justify-center shrink-0">
              {initials || <Building2 className="w-5 h-5" />}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] truncate">
                  {opportunity.businessName}
                </h3>
                {opportunity.verifiedRecord && <VerifiedBadge size="md" />}
              </div>
              <span
                className={`text-[12.5px] font-semibold px-2.5 py-0.5 rounded-md ${getOpportunityTypeStyle(
                  opportunity.type
                )}`}
              >
                {opportunityTypeLabel(opportunity.type)}
              </span>
            </div>

            <p className="text-[13px] text-[#52606D] dark:text-[#71767B] mt-0.5 flex flex-wrap items-center gap-x-1.5">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#64748B] dark:text-[#71767B]" />
                {opportunity.businessLocation}
              </span>
              <span aria-hidden="true">·</span>
              <span>{opportunity.industry}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {new Date(opportunity.createdAt).toLocaleDateString()}
              </span>
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={() => onToggleSave(opportunity)}
          disabled={isBusy}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
          aria-label={opportunity.savedByMe ? 'Remove from saved opportunities' : 'Save opportunity'}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
            opportunity.savedByMe
              ? 'bg-[#0B1F3A] text-white dark:bg-[#1D9BF0] dark:text-white shadow-xs'
              : 'bg-[#F4F7FA] text-[#52606D] hover:bg-[#E6ECF3] hover:text-[#0B1F3A] dark:bg-[#202327] dark:text-[#E7E9EA] dark:hover:bg-[#2F3336]'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${opportunity.savedByMe ? 'fill-current' : ''}`} />
          <span>{opportunity.savedByMe ? 'Saved' : 'Save'}</span>
        </motion.button>
      </div>

      {/* Commercial Post Content */}
      <div className="px-4 sm:px-5 pb-4">
        <button
          type="button"
          onClick={() => onView(opportunity)}
          className="text-left text-[18px] sm:text-[20px] font-bold text-[#0B1F3A] dark:text-[#E7E9EA] hover:text-[#0F52BA] dark:hover:text-[#1D9BF0] transition-colors leading-snug cursor-pointer"
        >
          {opportunity.productOrService}
        </button>
        <p className="mt-2 text-[15px] sm:text-[16px] text-[#1F2933] dark:text-[#E7E9EA]/90 leading-relaxed">
          {opportunity.description}
        </p>

        {/* Commercial Specifications Attachment Block (only when real fields exist) */}
        {(opportunity.quantityAndSpecs || opportunity.destinationMarket || opportunity.deadline) && (
          <dl className="mt-3.5 rounded-xl bg-[#F6F8FA] dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] border-l-[3px] border-l-[#0B1F3A] dark:border-l-[#1D9BF0] p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px] sm:text-[14px]">
            {opportunity.quantityAndSpecs && (
              <div>
                <dt className="text-[#52606D] dark:text-[#71767B] font-medium">Quantity &amp; Specs</dt>
                <dd className="font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] mt-0.5">
                  {opportunity.quantityAndSpecs}
                </dd>
              </div>
            )}
            {opportunity.destinationMarket && (
              <div>
                <dt className="text-[#52606D] dark:text-[#71767B] font-medium">Destination Market</dt>
                <dd className="font-semibold text-[#0B1F3A] dark:text-[#E7E9EA] mt-0.5">
                  {opportunity.destinationMarket}
                </dd>
              </div>
            )}
            {opportunity.deadline && (
              <div>
                <dt className="text-[#52606D] dark:text-[#71767B] font-medium">Deadline</dt>
                <dd className="font-semibold text-[#B45309] dark:text-[#FBBF24] mt-0.5 inline-flex items-center gap-1 tabular-nums">
                  <Calendar className="w-3.5 h-3.5 text-[#D97706] dark:text-[#FBBF24]" />
                  {opportunity.deadline}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Commercial Bottom Action Strip */}
      <div className="px-2 sm:px-3 py-1.5 border-t border-[#E6ECF3] dark:border-[#2F3336] bg-[#FAFCFE] dark:bg-[#16181C]/65 grid grid-cols-1 sm:grid-cols-3 gap-1">
        <motion.button
          type="button"
          onClick={() => onView(opportunity)}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          className="h-10 px-3 rounded-lg hover:bg-[#EDF2F7] dark:hover:bg-[#1D9BF0]/10 text-[14px] sm:text-[15px] font-semibold text-[#52606D] dark:text-[#71767B] hover:text-[#0B1F3A] dark:hover:text-[#1D9BF0] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>View opportunity</span>
        </motion.button>

        {!opportunity.isOwnOpportunity && (
          <>
            <motion.button
              type="button"
              onClick={() => onExpressInterest(opportunity)}
              disabled={isBusy || opportunity.interestExpressedByMe}
              whileTap={
                prefersReducedMotion || opportunity.interestExpressedByMe
                  ? undefined
                  : { scale: 0.97 }
              }
              className={`h-10 px-3 rounded-lg text-[14px] sm:text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                opportunity.interestExpressedByMe
                  ? 'bg-[#ECFDF5] text-[#047857] dark:bg-[#00BA7C]/15 dark:text-[#00BA7C] cursor-default'
                  : 'hover:bg-[#ECFDF5] text-[#0E7C5B] dark:text-[#71767B] dark:hover:bg-[#00BA7C]/12 dark:hover:text-[#00BA7C] cursor-pointer'
              }`}
            >
              <Handshake className="w-4 h-4" />
              <span>{opportunity.interestExpressedByMe ? 'Interest sent' : 'Express interest'}</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onContact(opportunity)}
              disabled={isBusy}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              className="h-10 px-3 rounded-lg hover:bg-[#EFF6FF] dark:hover:bg-[#1D9BF0]/10 text-[14px] sm:text-[15px] font-semibold text-[#52606D] dark:text-[#71767B] hover:text-[#0F52BA] dark:hover:text-[#1D9BF0] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact business</span>
            </motion.button>
          </>
        )}
      </div>
    </motion.article>
  );
}

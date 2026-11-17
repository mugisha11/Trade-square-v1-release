import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileUp,
  HelpCircle,
  Info,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import type {
  ChecklistItem,
  ComplianceReadinessSummary,
  DocumentCategory,
  RequirementClassification,
} from '../../../types/compliance';
import {
  CATEGORY_LABELS,
  ClassificationBadge,
  DocumentStatusBadge,
} from './ComplianceBadges';

interface ComplianceChecklistTabProps {
  checklist: ChecklistItem[];
  summary: ComplianceReadinessSummary;
  rulesLastReviewed: string;
  onUploadForRule: (item: ChecklistItem) => void;
  onViewDocument: (docId: string) => void;
  onToggleNotApplicable: (ruleId: string, markNA: boolean, reason?: string) => Promise<void>;
  onAskClarification: (item: ChecklistItem) => void;
  onOpenProfileEditor: () => void;
}

export function ComplianceChecklistTab({
  checklist,
  summary,
  rulesLastReviewed,
  onUploadForRule,
  onViewDocument,
  onToggleNotApplicable,
  onAskClarification,
  onOpenProfileEditor,
}: ComplianceChecklistTabProps) {
  const [scopeFilter, setScopeFilter] = useState<'ALL' | ChecklistItem['scopeLabel']>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DocumentCategory>('ALL');
  const [classFilter, setClassFilter] = useState<'ALL' | RequirementClassification>('ALL');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [naInputRuleId, setNaInputRuleId] = useState<string | null>(null);
  const [naReason, setNaReason] = useState('');
  const [busyRuleId, setBusyRuleId] = useState<string | null>(null);

  const filteredChecklist = useMemo(() => {
    return checklist.filter((item) => {
      if (scopeFilter !== 'ALL' && item.scopeLabel !== scopeFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (classFilter !== 'ALL' && item.effectiveClassification !== classFilter) return false;
      return true;
    });
  }, [checklist, scopeFilter, categoryFilter, classFilter]);

  const categoriesPresent = useMemo(() => {
    const set = new Set(checklist.map((c) => c.category));
    return Array.from(set);
  }, [checklist]);

  async function submitNotApplicable(ruleId: string, markNA: boolean) {
    setBusyRuleId(ruleId);
    try {
      await onToggleNotApplicable(ruleId, markNA, naReason.trim() || undefined);
      setNaInputRuleId(null);
      setNaReason('');
    } finally {
      setBusyRuleId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Compliance Readiness Dashboard Strip */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#2F3336]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Trade &amp; Regulatory Readiness Overview
              </h2>
              <span className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B] tabular-nums">
                Rules reviewed {rulesLastReviewed}
              </span>
            </div>
            <p className="text-xs text-[#525866] dark:text-[#71767B] mt-1 max-w-3xl leading-relaxed">
              {summary.completenessExplanation}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B]">
                Checklist File Coverage
              </p>
              <p className="text-2xl font-bold text-[#0A66C2] dark:text-[#1D9BF0] tabular-nums">
                {summary.checklistCompletenessPercent}%
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenProfileEditor}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] text-xs font-medium text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Update Activities &amp; Markets
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336]">
            <p className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B]">
              Mandatory Rules
            </p>
            <p className="mt-1 text-lg font-bold text-rose-700 dark:text-[#F4212E] tabular-nums">
              {summary.mandatoryCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336]">
            <p className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B]">
              Conditional / Buyer
            </p>
            <p className="mt-1 text-lg font-bold text-[#191919] dark:text-[#E7E9EA] tabular-nums">
              {summary.conditionalCount + summary.buyerRequiredCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336]">
            <p className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B]">
              Needs Confirmation
            </p>
            <p className="mt-1 text-lg font-bold text-orange-700 dark:text-orange-400 tabular-nums">
              {summary.needsConfirmationCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336]">
            <p className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B]">
              Missing Files
            </p>
            <p className="mt-1 text-lg font-bold text-[#191919] dark:text-[#E7E9EA] tabular-nums">
              {summary.missingCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336]">
            <p className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B]">
              Expiring / Expired
            </p>
            <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              {summary.expiringSoonCount + summary.expiredCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336]">
            <p className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B]">
              Experience Records
            </p>
            <p className="mt-1 text-lg font-bold text-[#0A66C2] dark:text-[#1D9BF0] tabular-nums">
              {summary.experienceRecordsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              'ALL',
              'Origin Country',
              'Destination Country',
              'Procurement / Buyer',
              'Credibility',
            ] as const
          ).map((scope) => {
            const active = scopeFilter === scope;
            return (
              <button
                key={scope}
                type="button"
                onClick={() => setScopeFilter(scope)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0A66C2] text-white dark:bg-[#1D9BF0]'
                    : 'bg-[#F0F2F5] text-[#525866] hover:text-[#191919] dark:bg-[#202327] dark:text-[#71767B] dark:hover:text-[#E7E9EA]'
                }`}
              >
                {scope === 'ALL' ? `All Scopes (${checklist.length})` : scope}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by document category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | DocumentCategory)}
            className="min-h-[36px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-2.5 text-xs text-[#191919] dark:text-[#E7E9EA]"
          >
            <option value="ALL">All Categories</option>
            {categoriesPresent.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by requirement classification"
            value={classFilter}
            onChange={(e) =>
              setClassFilter(e.target.value as 'ALL' | RequirementClassification)
            }
            className="min-h-[36px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-2.5 text-xs text-[#191919] dark:text-[#E7E9EA]"
          >
            <option value="ALL">All Classifications</option>
            <option value="MANDATORY">Mandatory</option>
            <option value="CONDITIONAL">Conditional</option>
            <option value="BUYER-REQUIRED">Buyer-Required</option>
            <option value="RECOMMENDED">Recommended</option>
            <option value="NEEDS_CONFIRMATION">Needs Confirmation</option>
            <option value="NOT_APPLICABLE">Not Applicable</option>
          </select>
        </div>
      </div>

      {/* Checklist Cards */}
      {filteredChecklist.length === 0 ? (
        <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-[#191919] dark:text-[#E7E9EA]">
            No checklist requirements match the selected filter combination.
          </p>
          <p className="text-xs text-[#525866] dark:text-[#71767B] mt-1">
            Reset the scope or classification filters above, or update your Business Requirements Profile.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChecklist.map((item) => {
            const isExpanded = expandedRuleId === item.ruleId;
            const isNA = item.effectiveClassification === 'NOT_APPLICABLE';
            const showingNaBox = naInputRuleId === item.ruleId;

            return (
              <div
                key={item.ruleId}
                className={`bg-white dark:bg-[#16181C] border rounded-xl transition-colors ${
                  isNA
                    ? 'border-[#E2E8F0]/70 dark:border-[#2F3336]/60 opacity-75'
                    : 'border-[#E2E8F0] dark:border-[#2F3336]'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <ClassificationBadge classification={item.effectiveClassification} />
                        <DocumentStatusBadge status={item.status} />
                        <span className="text-[11px] font-medium text-[#525866] dark:text-[#71767B]">
                          {item.scopeLabel} · {item.destinationJurisdiction ?? item.jurisdiction}
                        </span>
                        <span className="text-[11px] text-[#65676B] dark:text-[#71767B]">
                          · {CATEGORY_LABELS[item.category]}
                        </span>
                      </div>

                      <h3 className="text-[15px] font-semibold text-[#191919] dark:text-[#E7E9EA] leading-snug">
                        {item.documentName}
                      </h3>

                      <p className="text-xs text-[#334155] dark:text-[#E7E9EA]/90 leading-relaxed">
                        <span className="font-medium text-[#191919] dark:text-white">Why it applies: </span>
                        {item.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#525866] dark:text-[#71767B]">
                        <span>
                          <strong className="font-medium text-[#334155] dark:text-[#E7E9EA]">
                            Authority:
                          </strong>{' '}
                          {item.responsibleAuthority}
                        </span>
                        {item.relevantActivities.length > 0 && (
                          <span>
                            <strong className="font-medium text-[#334155] dark:text-[#E7E9EA]">
                              Triggered by:
                            </strong>{' '}
                            {item.relevantActivities.join(', ')}
                          </span>
                        )}
                        {item.relevantProducts.length > 0 && (
                          <span>
                            <strong className="font-medium text-[#334155] dark:text-[#E7E9EA]">
                              Products:
                            </strong>{' '}
                            {item.relevantProducts.join(', ')}
                          </span>
                        )}
                      </div>

                      {isNA && item.userAction?.notApplicableReason && (
                        <p className="text-xs text-[#65676B] dark:text-[#71767B] italic">
                          Marked Not Applicable: &ldquo;{item.userAction.notApplicableReason}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Right Action Column */}
                    <div className="flex flex-wrap lg:flex-col items-stretch lg:items-end gap-2 shrink-0">
                      {!isNA && (
                        <>
                          {item.linkedDocumentId ? (
                            <button
                              type="button"
                              onClick={() => onViewDocument(item.linkedDocumentId!)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E7F3FF] hover:bg-[#D8EBFF] text-[#0A66C2] dark:bg-[#1D9BF0]/15 dark:hover:bg-[#1D9BF0]/25 dark:text-[#1D9BF0] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Manage Uploaded File
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onUploadForRule(item)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <FileUp className="w-3.5 h-3.5" />
                              Upload Document
                            </button>
                          )}
                        </>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRuleId(isExpanded ? null : item.ruleId)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#334155] dark:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Hide Details' : 'View Requirements'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onAskClarification(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#334155] dark:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          Clarify
                        </button>

                        {isNA ? (
                          <button
                            type="button"
                            disabled={busyRuleId === item.ruleId}
                            onClick={() => submitNotApplicable(item.ruleId, false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#0A66C2] dark:text-[#1D9BF0] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setNaInputRuleId(showingNaBox ? null : item.ruleId);
                              setNaReason('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#65676B] dark:text-[#71767B] hover:text-[#191919] dark:hover:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Not Applicable
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline Mark Not Applicable Confirmation */}
                  {showingNaBox && (
                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#2F3336] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={naReason}
                        onChange={(e) => setNaReason(e.target.value)}
                        placeholder="Optional note: why does this requirement not apply to your operations?"
                        className="flex-1 min-h-[36px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNaInputRuleId(null)}
                          className="px-3 py-1.5 text-xs text-[#65676B] dark:text-[#71767B] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={busyRuleId === item.ruleId}
                          onClick={() => submitNotApplicable(item.ruleId, true)}
                          className="px-3 py-1.5 rounded-lg bg-[#191919] dark:bg-[#E7E9EA] text-white dark:text-[#000000] text-xs font-semibold cursor-pointer"
                        >
                          Confirm Not Applicable
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded Requirements & Official Provenance Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2F3336] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2.5">
                        <div>
                          <p className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
                            What This Requirement Covers
                          </p>
                          <p className="text-[#525866] dark:text-[#71767B] mt-0.5 leading-relaxed">
                            {item.requirementText}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
                            Conditions &amp; Limitations
                          </p>
                          <p className="text-[#525866] dark:text-[#71767B] mt-0.5 leading-relaxed flex items-start gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>{item.conditionsAndLimitations}</span>
                          </p>
                        </div>

                        {item.documentsNeededToApply.length > 0 && (
                          <div>
                            <p className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
                              Typically Required to Apply
                            </p>
                            <ul className="mt-1 space-y-1 text-[#525866] dark:text-[#71767B] list-disc list-inside">
                              {item.documentsNeededToApply.map((reqDoc) => (
                                <li key={reqDoc}>{reqDoc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] rounded-lg p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
                            Authoritative Source Record
                          </span>
                          <span className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B] tabular-nums">
                            Reviewed {item.lastReviewedDate}
                          </span>
                        </div>

                        <p className="text-[#525866] dark:text-[#71767B]">
                          <strong className="text-[#191919] dark:text-[#E7E9EA]">Source: </strong>
                          {item.sourceName}
                        </p>

                        <p className="text-[#525866] dark:text-[#71767B]">
                          <strong className="text-[#191919] dark:text-[#E7E9EA]">Confidence: </strong>
                          {item.confidence}
                        </p>

                        {item.validityPeriod && (
                          <p className="text-[#525866] dark:text-[#71767B]">
                            <strong className="text-[#191919] dark:text-[#E7E9EA]">Validity: </strong>
                            {item.validityPeriod}
                          </p>
                        )}

                        {item.renewalRequirements && (
                          <p className="text-[#525866] dark:text-[#71767B]">
                            <strong className="text-[#191919] dark:text-[#E7E9EA]">Renewal: </strong>
                            {item.renewalRequirements}
                          </p>
                        )}

                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <a
                            href={item.officialSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline"
                          >
                            Official Source Portal
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {item.applicationUrl && item.applicationUrl !== item.officialSourceUrl && (
                            <a
                              href={item.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline"
                            >
                              Application / Filing Portal
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {item.effectiveClassification === 'NEEDS_CONFIRMATION' && (
                          <div className="mt-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-800 dark:text-orange-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                              This requirement needs confirmation with the official portal or contracting authority before relying on it for shipment or bid submission.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

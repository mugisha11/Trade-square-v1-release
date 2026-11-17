import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Loader2,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type {
  ComplianceAssistantResponse,
  RegulatoryRuleRecord,
  RegulatorySourceRecord,
} from '../../../types/compliance';
import { authFetch } from '../../../lib/authClient';
import {
  CATEGORY_LABELS,
  ClassificationBadge,
  SOURCE_CATEGORY_LABEL,
} from './ComplianceBadges';

interface ComplianceAssistantAndSourcesTabProps {
  sourceRegistry: RegulatorySourceRecord[];
  rulesCatalogCount: number;
  rulesLastReviewed: string;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

const EXAMPLE_PROMPTS = [
  'Which documents are legally mandatory vs recommended for my current products and target markets?',
  'Do I need both Rwanda FDA approval and RSB S-Mark, or when does each apply?',
  'If I export from Rwanda to Kenya or Uganda, what changes between origin and destination requirements?',
  'Which documents are tender-specific for Rwanda Umucyo public procurement vs everyday business registration?',
];

export function ComplianceAssistantAndSourcesTab({
  sourceRegistry,
  rulesCatalogCount,
  rulesLastReviewed,
  initialQuestion,
  onClearInitialQuestion,
}: ComplianceAssistantAndSourcesTabProps) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<ComplianceAssistantResponse | null>(null);

  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'REGULATORY' | 'STATISTICAL'>('ALL');
  const [showRulesAudit, setShowRulesAudit] = useState(false);
  const [rulesAudit, setRulesAudit] = useState<{
    version: string;
    lastReviewed: string;
    rules: RegulatoryRuleRecord[];
  } | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);

  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      setQuestion(initialQuestion);
      onClearInitialQuestion?.();
    }
  }, [initialQuestion, onClearInitialQuestion]);

  async function askAssistant(promptText: string) {
    const clean = promptText.trim();
    if (clean.length < 4) return;
    setAsking(true);
    setError(null);
    try {
      const res = await authFetch('/api/compliance/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to reach AI Compliance Assistant.');
      }
      setAnswer(data.assistantResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to answer right now.');
    } finally {
      setAsking(false);
    }
  }

  async function toggleRulesCatalog() {
    if (showRulesAudit) {
      setShowRulesAudit(false);
      return;
    }
    setShowRulesAudit(true);
    if (rulesAudit) return;

    setLoadingRules(true);
    try {
      const res = await authFetch('/api/compliance/rules');
      if (res.ok) {
        const data = await res.json();
        setRulesAudit({
          version: data.version,
          lastReviewed: data.lastReviewed,
          rules: data.rules ?? [],
        });
      }
    } finally {
      setLoadingRules(false);
    }
  }

  const filteredSources = sourceRegistry.filter((s) => {
    if (sourceFilter === 'REGULATORY') return s.canEstablishLegalObligation;
    if (sourceFilter === 'STATISTICAL') return !s.canEstablishLegalObligation;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Grounded AI Compliance Assistant */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0A66C2] dark:text-[#1D9BF0]" />
              <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                AI Compliance &amp; Trade Requirements Assistant
              </h2>
            </div>
            <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5">
              Interprets only TradeSquare&apos;s retrieved authoritative rules and official sources tailored to your enterprise profile. Flags unconfirmed cases as Needs Confirmation.
            </p>
          </div>
          <span className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B] tabular-nums shrink-0">
            {rulesCatalogCount} authoritative rules · Reviewed {rulesLastReviewed}
          </span>
        </div>

        {/* Example Question Chips */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setQuestion(chip);
                askAssistant(chip);
              }}
              className="text-left px-3 py-1.5 rounded-lg bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-[#202327] dark:hover:bg-[#2F3336] text-[11px] font-medium text-[#191919] dark:text-[#E7E9EA] transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askAssistant(question);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about a permit, destination rule, EAC Certificate of Origin, RSB S-Mark, or tender document..."
            className="flex-1 min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
          />
          <button
            type="submit"
            disabled={asking || question.trim().length < 4}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
          >
            {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Ask Compliance AI
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-[#F4212E]/10 border border-rose-200 dark:border-[#F4212E]/30 text-xs text-rose-700 dark:text-[#F4212E] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {answer && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#2F3336]">
              <div className="flex flex-wrap items-center gap-2">
                <ClassificationBadge classification={answer.requirementClassification} />
                <span className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  {answer.country}
                </span>
                <span className="text-[#525866] dark:text-[#71767B]">
                  · {answer.relevantBusinessActivity}
                </span>
              </div>
              <span className="text-[11px] text-[#65676B] dark:text-[#71767B] tabular-nums">
                Last checked: {answer.lastCheckedDate}
              </span>
            </div>

            <p className="text-sm text-[#191919] dark:text-[#E7E9EA] leading-relaxed">
              {answer.answerSummary}
            </p>

            {answer.actionableSteps.length > 0 && (
              <div>
                <p className="font-semibold text-[#191919] dark:text-[#E7E9EA] mb-1.5">
                  Practical Next Steps
                </p>
                <ul className="space-y-1 text-[#334155] dark:text-[#E7E9EA]/90 list-disc list-inside">
                  {answer.actionableSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Important Limitations: </span>
                <span>{answer.importantLimitations}</span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-[#191919] dark:text-[#E7E9EA] mb-2">
                Authoritative Official Sources Cited
              </p>
              <div className="flex flex-wrap gap-2">
                {answer.citations.map((c) => (
                  <a
                    key={c.officialUrl}
                    href={c.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#16181C] border border-[#CBD5E1] dark:border-[#2F3336] text-[#0A66C2] dark:text-[#1D9BF0] font-medium hover:underline"
                  >
                    <span>{c.sourceName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authoritative Official Source Registry */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Official Source Library &amp; Institutional Registry
            </h2>
            <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5">
              TradeSquare strictly distinguishes authoritative regulatory sources from statistical and market intelligence databases. Market statistics are never cited as proof of legal obligation.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(
              [
                { id: 'ALL', label: `All (${sourceRegistry.length})` },
                { id: 'REGULATORY', label: 'Regulatory & Statutory' },
                { id: 'STATISTICAL', label: 'Market Intelligence & Stats' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSourceFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  sourceFilter === f.id
                    ? 'bg-[#0A66C2] text-white dark:bg-[#1D9BF0]'
                    : 'bg-[#F0F2F5] text-[#525866] dark:bg-[#202327] dark:text-[#71767B]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSources.map((src) => (
            <div
              key={src.id}
              className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      src.canEstablishLegalObligation
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#00BA7C]/10 dark:text-[#00BA7C] dark:border-[#00BA7C]/30'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#202327] dark:text-[#71767B] dark:border-[#2F3336]'
                    }`}
                  >
                    {src.canEstablishLegalObligation ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <BookOpen className="w-3 h-3" />
                    )}
                    {SOURCE_CATEGORY_LABEL[src.sourceType]}
                  </span>
                  <span className="text-[11px] font-medium text-[#65676B] dark:text-[#71767B] tabular-nums">
                    {src.jurisdiction} · Checked {src.lastCheckedDate}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  {src.name}
                </h3>
                <p className="text-xs text-[#525866] dark:text-[#71767B] leading-relaxed">
                  {src.description}
                </p>
                <p className="text-[11px] text-[#65676B] dark:text-[#71767B]">
                  <strong className="text-[#334155] dark:text-[#E7E9EA]">Integration:</strong>{' '}
                  {src.integrationMethod}
                </p>
              </div>

              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline w-fit"
              >
                <span>{src.url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>

        {/* Versioned Rules Catalog Provenance Accordion */}
        <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#2F3336]">
          <button
            type="button"
            onClick={toggleRulesCatalog}
            className="text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
          >
            {showRulesAudit
              ? 'Hide Versioned Regulatory Rules Audit Catalog'
              : `Inspect All ${rulesCatalogCount} Versioned Regulatory Rules & Review History`}
          </button>

          {showRulesAudit && (
            <div className="mt-4 space-y-2">
              {loadingRules ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#65676B]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading versioned rules catalog...
                </div>
              ) : (
                rulesAudit?.rules.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-[#65676B] dark:text-[#71767B]">
                          {r.id} (v{r.version})
                        </span>
                        <ClassificationBadge classification={r.classification} />
                        <span className="text-[11px] font-medium text-[#525866] dark:text-[#71767B]">
                          {r.jurisdiction} · {CATEGORY_LABELS[r.category]}
                        </span>
                      </div>
                      <p className="font-medium text-[#191919] dark:text-[#E7E9EA] mt-1">
                        {r.documentName}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#65676B] dark:text-[#71767B] tabular-nums shrink-0">
                      Reviewed {r.lastReviewedDate}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

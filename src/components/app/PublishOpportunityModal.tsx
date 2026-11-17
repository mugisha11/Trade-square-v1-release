import { useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { OpportunityRecord, OpportunityType } from '../../types/workspace';
import { authFetch } from '../../lib/authClient';

interface PublishOpportunityModalProps {
  initialType?: OpportunityType;
  defaultIndustry: string;
  onClose: () => void;
  onCreated: (opp: OpportunityRecord) => void;
}

const OPPORTUNITY_TYPES: OpportunityType[] = [
  'Buyer Request',
  'Supplier Offer',
  'Distribution',
  'Procurement',
  'Partnership',
];

export function PublishOpportunityModal({
  initialType = 'Buyer Request',
  defaultIndustry,
  onClose,
  onCreated,
}: PublishOpportunityModalProps) {
  const [type, setType] = useState<OpportunityType>(initialType);
  const [productOrService, setProductOrService] = useState('');
  const [description, setDescription] = useState('');
  const [quantityAndSpecs, setQuantityAndSpecs] = useState('');
  const [destinationMarket, setDestinationMarket] = useState('Rwanda & East Africa');
  const [deadline, setDeadline] = useState('');
  const [industry, setIndustry] = useState(defaultIndustry || 'General Trade & Manufacturing');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (productOrService.trim().length < 3) {
      setError('Please enter a product or service title.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please describe your commercial requirement or offer (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          productOrService: productOrService.trim(),
          description: description.trim(),
          quantityAndSpecs: quantityAndSpecs.trim() || undefined,
          destinationMarket: destinationMarket.trim() || undefined,
          deadline: deadline.trim() || undefined,
          industry: industry.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish opportunity.');
      }
      onCreated(data.opportunity);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to publish opportunity right now.');
    } finally {
      setSubmitting(false);
    }
  }

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
          aria-label="Close modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-lg text-[#64748B] dark:text-[#71767B] hover:text-[#191919] dark:hover:text-[#E7E9EA] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
          Publish a business opportunity
        </h2>
        <p className="text-sm text-[#525866] dark:text-[#71767B] mt-1">
          Share a real buying request, supplier offer, or regional partnership requirement.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="opp-type"
                className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
              >
                Opportunity Type
              </label>
              <select
                id="opp-type"
                value={type}
                onChange={(e) => setType(e.target.value as OpportunityType)}
                className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
              >
                {OPPORTUNITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="opp-industry"
                className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
              >
                Industry
              </label>
              <input
                id="opp-industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="opp-title"
              className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
            >
              Product or Service
            </label>
            <input
              id="opp-title"
              type="text"
              required
              value={productOrService}
              onChange={(e) => setProductOrService(e.target.value)}
              placeholder="e.g. Food-grade corrugated export cartons or Arabica washed green beans"
              className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
            />
          </div>

          <div>
            <label
              htmlFor="opp-desc"
              className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
            >
              Description &amp; Commercial Requirements
            </label>
            <textarea
              id="opp-desc"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline technical standards, delivery expectations, or partnership scope..."
              className="w-full rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 py-2.5 text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="opp-qty"
                className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
              >
                Quantity &amp; Specs (optional)
              </label>
              <input
                id="opp-qty"
                type="text"
                value={quantityAndSpecs}
                onChange={(e) => setQuantityAndSpecs(e.target.value)}
                placeholder="e.g. 5 MT / month"
                className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
              />
            </div>

            <div>
              <label
                htmlFor="opp-dest"
                className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
              >
                Target Market (optional)
              </label>
              <input
                id="opp-dest"
                type="text"
                value={destinationMarket}
                onChange={(e) => setDestinationMarket(e.target.value)}
                placeholder="e.g. Kigali, Kampala"
                className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
              />
            </div>

            <div>
              <label
                htmlFor="opp-deadline"
                className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
              >
                Deadline (optional)
              </label>
              <input
                id="opp-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] dark:[color-scheme:dark] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-[#F4212E]/40 bg-red-50 dark:bg-[#F4212E]/10 p-3 text-xs text-red-800 dark:text-[#F4212E]">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-[#F4212E] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#525866] dark:text-[#71767B] hover:text-[#191919] dark:hover:text-[#E7E9EA] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

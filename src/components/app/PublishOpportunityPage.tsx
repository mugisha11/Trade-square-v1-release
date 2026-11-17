import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type {
  OpportunityQualityReview,
  OpportunityRecord,
  OpportunityType,
} from '../../types/workspace';
import { authFetch } from '../../lib/authClient';
import {
  OPPORTUNITY_TYPE_OPTIONS,
  buildQuantityAndSpecs,
  emptyOpportunityForm,
  fieldImportance,
  isFieldVisible,
  opportunityTypeLabel,
  validateOpportunityForm,
  type OpportunityFormState,
} from '../../lib/opportunityFields';

type WizardStep = 'type' | 'details' | 'commercial' | 'ai' | 'preview' | 'done';

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 'type', label: 'Type' },
  { id: 'details', label: 'Details' },
  { id: 'commercial', label: 'Terms' },
  { id: 'ai', label: 'AI review' },
  { id: 'preview', label: 'Preview' },
];

interface PublishOpportunityPageProps {
  initialType?: OpportunityType;
  defaultIndustry: string;
  businessName: string;
  businessLocation: string;
  businessLogoUrl?: string;
  verifiedRecord?: boolean;
  draftToResume?: OpportunityRecord | null;
  onCancel: () => void;
  onPublishedNavigate: () => void;
  onCreated: (opp: OpportunityRecord) => void;
  onUpdated?: (opp: OpportunityRecord) => void;
}

type SuggestionMap = Partial<Record<keyof OpportunityFormState, string | boolean>>;

const inputClass =
  'w-full min-h-[48px] rounded-md border border-[#8C8C8C66] bg-white px-3.5 text-[15px] text-[#191919] placeholder:text-[#00000099] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]';
const labelClass = 'block text-[14px] font-semibold text-[#191919] mb-1.5';
const textareaClass =
  'w-full rounded-md border border-[#8C8C8C66] bg-white px-3.5 py-3 text-[15px] text-[#191919] placeholder:text-[#00000099] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]';
const cardClass = 'bg-white rounded-lg border border-[#E0E0E0] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]';

function FieldMark({ importance }: { importance: 'mandatory' | 'recommended' | 'optional' }) {
  if (importance === 'mandatory') {
    return <span className="text-[#DC2626]">*</span>;
  }
  if (importance === 'recommended') {
    return <span className="ml-1 text-[10px] font-medium uppercase tracking-wide text-[#0A66C2]">Recommended</span>;
  }
  return <span className="ml-1 text-[10px] font-medium uppercase tracking-wide text-[#64748B]">Optional</span>;
}

export function PublishOpportunityPage({
  initialType = 'Buyer Request',
  defaultIndustry,
  businessName,
  businessLocation,
  businessLogoUrl,
  verifiedRecord,
  draftToResume = null,
  onCancel,
  onPublishedNavigate,
  onCreated,
  onUpdated,
}: PublishOpportunityPageProps) {
  const [step, setStep] = useState<WizardStep>(draftToResume ? 'details' : 'type');
  const [form, setForm] = useState<OpportunityFormState>(() => {
    if (draftToResume) {
      return {
        ...emptyOpportunityForm(draftToResume.type),
        type: draftToResume.type,
        productOrService: draftToResume.productOrService === 'Untitled draft' ? '' : draftToResume.productOrService,
        industry: draftToResume.industry || defaultIndustry,
        description: draftToResume.description || '',
        technicalSpecs: draftToResume.technicalSpecs || '',
        qualityRequirements: draftToResume.qualityRequirements || '',
        quantity: draftToResume.quantity || '',
        unit: draftToResume.unit || '',
        quantityAndSpecs: draftToResume.quantityAndSpecs || '',
        capacity: draftToResume.capacity || '',
        moq: draftToResume.moq || '',
        budgetOrPrice: draftToResume.budgetOrPrice || '',
        currency: draftToResume.currency || 'USD',
        paymentTerms: draftToResume.paymentTerms || '',
        priceNegotiable: draftToResume.priceNegotiable ?? true,
        originLocation: draftToResume.originLocation || '',
        destinationMarket: draftToResume.destinationMarket || '',
        deliveryTimeline: draftToResume.deliveryTimeline || '',
        deadline: draftToResume.deadline || '',
        requiredCertifications: draftToResume.requiredCertifications || '',
        eligibilityRequirements: draftToResume.eligibilityRequirements || '',
        preferredPartnerTraits: draftToResume.preferredPartnerTraits || '',
        contactPreference: draftToResume.contactPreference || 'Respond through TradeSquare',
        showPublicContact: draftToResume.showPublicContact ?? false,
      };
    }
    return {
      ...emptyOpportunityForm(initialType),
      industry: defaultIndustry || 'General Trade & Manufacturing',
    };
  });
  const [draftId, setDraftId] = useState<string | null>(draftToResume?.id ?? null);
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionMap>({});
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [qualityReview, setQualityReview] = useState<OpportunityQualityReview | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedOpp, setPublishedOpp] = useState<OpportunityRecord | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<'English' | 'Kinyarwanda'>('English');

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const patchForm = useCallback((patch: Partial<OpportunityFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const payloadFromForm = useMemo(() => {
    const quantityAndSpecs = buildQuantityAndSpecs(form);
    return {
      type: form.type,
      productOrService: form.productOrService.trim(),
      description: form.description.trim(),
      industry: form.industry.trim(),
      quantityAndSpecs: quantityAndSpecs || undefined,
      technicalSpecs: form.technicalSpecs.trim() || undefined,
      qualityRequirements: form.qualityRequirements.trim() || undefined,
      quantity: form.quantity.trim() || undefined,
      unit: form.unit.trim() || undefined,
      capacity: form.capacity.trim() || undefined,
      moq: form.moq.trim() || undefined,
      budgetOrPrice: form.budgetOrPrice.trim() || undefined,
      currency: form.currency.trim() || undefined,
      paymentTerms: form.paymentTerms.trim() || undefined,
      priceNegotiable: form.priceNegotiable,
      originLocation: form.originLocation.trim() || undefined,
      destinationMarket: form.destinationMarket.trim() || undefined,
      deliveryTimeline: form.deliveryTimeline.trim() || undefined,
      deadline: form.deadline.trim() || undefined,
      requiredCertifications: form.requiredCertifications.trim() || undefined,
      eligibilityRequirements: form.eligibilityRequirements.trim() || undefined,
      preferredPartnerTraits: form.preferredPartnerTraits.trim() || undefined,
      contactPreference: form.contactPreference.trim() || undefined,
      showPublicContact: form.showPublicContact,
    };
  }, [form]);

  async function saveDraft(): Promise<OpportunityRecord | null> {
    setError(null);
    const draftErrors = validateOpportunityForm(form, 'draft');
    if (draftErrors.length) {
      setError(draftErrors[0]);
      return null;
    }
    setSavingDraft(true);
    try {
      const keepPublished = draftToResume?.status === 'published' || draftToResume?.status === 'paused';
      if (draftId) {
        const res = await authFetch(`/api/opportunities/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payloadFromForm,
            ...(keepPublished ? {} : { status: 'draft' }),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save draft.');
        onUpdated?.(data.opportunity);
        return data.opportunity as OpportunityRecord;
      }
      const res = await authFetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payloadFromForm, publish: false, status: 'draft' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save draft.');
      setDraftId(data.opportunity.id);
      onUpdated?.(data.opportunity);
      return data.opportunity as OpportunityRecord;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save draft.');
      return null;
    } finally {
      setSavingDraft(false);
    }
  }

  async function runAssist(mode: 'extract' | 'improve' | 'quality' | 'translate') {
    setAiBusy(true);
    setError(null);
    try {
      const res = await authFetch('/api/opportunities/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          naturalLanguage,
          opportunity: payloadFromForm,
          targetLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI assistant unavailable.');

      const suggestion = (data.suggestion ?? {}) as Record<string, unknown>;
      if (mode === 'translate') {
        const next: SuggestionMap = {};
        if (data.translatedTitle) next.productOrService = data.translatedTitle;
        if (data.translatedDescription) next.description = data.translatedDescription;
        setSuggestions((prev) => ({ ...prev, ...next }));
      } else if (mode !== 'quality') {
        const cleaned: SuggestionMap = {};
        for (const [key, value] of Object.entries(suggestion)) {
          if (key === 'suggestedCategory') continue;
          if (value === undefined || value === null || value === '') continue;
          cleaned[key as keyof OpportunityFormState] = value as string | boolean;
        }
        if (typeof suggestion.suggestedCategory === 'string' && suggestion.suggestedCategory) {
          cleaned.industry = suggestion.suggestedCategory;
        }
        setSuggestions((prev) => ({ ...prev, ...cleaned }));
      }

      setClarifications(
        Array.isArray(data.clarificationQuestions) ? data.clarificationQuestions.filter(Boolean) : [],
      );
      setMissingInfo(
        Array.isArray(data.missingInformation) ? data.missingInformation.filter(Boolean) : [],
      );
      if (data.qualityReview && typeof data.qualityReview === 'object') {
        setQualityReview(data.qualityReview as OpportunityQualityReview);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI assistant unavailable.');
    } finally {
      setAiBusy(false);
    }
  }

  function acceptSuggestion(key: keyof OpportunityFormState) {
    const value = suggestions[key];
    if (value === undefined) return;
    patchForm({ [key]: value } as Partial<OpportunityFormState>);
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function acceptAllSuggestions() {
    const patch: Partial<OpportunityFormState> = {};
    for (const [key, value] of Object.entries(suggestions)) {
      if (value === undefined) continue;
      (patch as Record<string, unknown>)[key] = value;
    }
    patchForm(patch);
    setSuggestions({});
  }

  function goNext() {
    setError(null);
    if (step === 'type') {
      setStep('details');
      return;
    }
    if (step === 'details') {
      if (!form.productOrService.trim() || !form.description.trim() || !form.industry.trim()) {
        setError('Title, category and description are required before continuing.');
        return;
      }
      setStep('commercial');
      return;
    }
    if (step === 'commercial') {
      setStep('ai');
      return;
    }
    if (step === 'ai') {
      setStep('preview');
      return;
    }
  }

  function goBack() {
    setError(null);
    if (step === 'details') setStep('type');
    else if (step === 'commercial') setStep('details');
    else if (step === 'ai') setStep('commercial');
    else if (step === 'preview') setStep('ai');
  }

  async function handlePublish() {
    setError(null);
    const errors = validateOpportunityForm(form, 'publish');
    if (errors.length) {
      setError(errors[0]);
      setStep('details');
      return;
    }
    if (!confirmPublish) {
      setError('Confirm that the preview is accurate before publishing.');
      return;
    }

    setSubmitting(true);
    try {
      let published: OpportunityRecord;
      if (draftId) {
        const res = await authFetch(`/api/opportunities/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payloadFromForm, publish: true, status: 'published' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Publication failed.');
        published = data.opportunity;
        onUpdated?.(published);
      } else {
        const res = await authFetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payloadFromForm, publish: true, status: 'published' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Publication failed.');
        published = data.opportunity;
      }
      setPublishedOpp(published);
      setStep('done');
      onCreated(published);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to publish opportunity.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (step === 'ai' || step === 'details' || step === 'commercial') {
      setAiPanelOpen(true);
    }
  }, [step]);

  const suggestionKeys = Object.keys(suggestions) as Array<keyof OpportunityFormState>;

  function renderTextField(
    key: keyof OpportunityFormState,
    label: string,
    opts?: { rows?: number; type?: string; placeholder?: string },
  ) {
    if (!isFieldVisible(form.type, key as never)) return null;
    const importance = fieldImportance(form.type, key as never) ?? 'optional';
    const value = form[key];
    const suggestion = suggestions[key];
    return (
      <div key={key}>
        <label className={labelClass}>
          {label} <FieldMark importance={importance} />
        </label>
        {opts?.rows ? (
          <textarea
            rows={opts.rows}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => patchForm({ [key]: e.target.value } as Partial<OpportunityFormState>)}
            placeholder={opts.placeholder}
            className={textareaClass}
          />
        ) : (
          <input
            type={opts?.type ?? 'text'}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => patchForm({ [key]: e.target.value } as Partial<OpportunityFormState>)}
            placeholder={opts?.placeholder}
            className={inputClass}
          />
        )}
        {typeof suggestion === 'string' && suggestion && suggestion !== value && (
          <div className="mt-1.5 flex items-start gap-2 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-2 text-xs text-[#1E3A5F]">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#0A66C2] mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">AI suggestion</p>
              <p className="mt-0.5 break-words">{suggestion}</p>
              <button
                type="button"
                onClick={() => acceptSuggestion(key)}
                className="mt-1.5 text-[#0A66C2] font-semibold hover:underline cursor-pointer"
              >
                Accept suggestion
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-10">
      {/* LinkedIn-style sticky compose header */}
      <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-4 border-b border-[#E0E0E0] bg-white/95 backdrop-blur-sm">
        <div className="max-w-[1128px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Back"
              className="w-10 h-10 rounded-full text-[#666666] hover:bg-[#00000014] flex items-center justify-center cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 id="publish-opp-title" className="text-[18px] sm:text-[20px] font-semibold text-[#191919] truncate">
                {step === 'done' ? 'Opportunity published' : 'Publish an opportunity'}
              </h1>
              <p className="text-[13px] text-[#666666] truncate">
                Structured commercial listing · visible to relevant businesses
              </p>
            </div>
          </div>
          {step !== 'done' && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={savingDraft}
                onClick={async () => {
                  const saved = await saveDraft();
                  if (saved) setError(null);
                }}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold hover:bg-[#E8F3FC] cursor-pointer disabled:opacity-60"
              >
                {savingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
                Save draft
              </button>
              {step === 'preview' ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePublish}
                  className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1128px] mx-auto">
        {/* Posting as — LinkedIn identity row */}
        <div className={`${cardClass} px-4 sm:px-5 py-4 mb-3 flex items-center gap-3`}>
          {businessLogoUrl ? (
            <img
              src={businessLogoUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-[#E0E0E0]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#0A66C2] text-white font-semibold flex items-center justify-center">
              {businessName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#191919] flex items-center gap-1.5 truncate">
              {businessName}
              {verifiedRecord && (
                <span className="text-[11px] font-semibold text-[#0A66C2] bg-[#E8F3FC] px-1.5 py-0.5 rounded">
                  Verified
                </span>
              )}
            </p>
            <p className="text-[13px] text-[#666666] truncate">
              Posting as · {businessLocation || 'Business profile'}
            </p>
          </div>
        </div>

        {/* Progress steps */}
        {step !== 'done' && (
          <div className={`${cardClass} px-2 sm:px-4 py-2 mb-3 overflow-x-auto`}>
            <ol className="flex items-stretch min-w-max">
              {STEPS.map((s, i) => {
                const active = s.id === step;
                const done = stepIndex > i;
                return (
                  <li key={s.id} className="flex-1 min-w-[110px]">
                    <div
                      className={`px-3 py-2.5 border-b-[3px] ${
                        active
                          ? 'border-[#0A66C2]'
                          : done
                            ? 'border-[#70B5F9]'
                            : 'border-transparent'
                      }`}
                    >
                      <p
                        className={`text-[12px] font-semibold ${
                          active ? 'text-[#0A66C2]' : done ? 'text-[#004182]' : 'text-[#666666]'
                        }`}
                      >
                        {done ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {s.label}
                          </span>
                        ) : (
                          `${i + 1}. ${s.label}`
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className={`${cardClass} px-4 sm:px-6 py-5`}>
            {step === 'type' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-[#191919]">Select opportunity type</h3>
                  <p className="text-sm text-[#525866] mt-1">
                    Fields adapt to the type you choose. Only complete what is commercially relevant.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OPPORTUNITY_TYPE_OPTIONS.map((opt) => {
                    const selected = form.type === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => patchForm({ type: opt.value })}
                        className={`text-left rounded-lg border p-4 transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#0A66C2] bg-[#E8F3FC] shadow-[inset_0_0_0_1px_#0A66C2]'
                            : 'border-[#E0E0E0] bg-[#F9FAFB] hover:border-[#0A66C2] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selected ? 'border-[#0A66C2]' : 'border-[#94A3B8]'
                            }`}
                          >
                            {selected && <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#191919]">{opt.label}</p>
                            <p className="text-xs text-[#525866] mt-1 leading-relaxed">{opt.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <h3 className="text-base font-semibold text-[#191919]">Opportunity information</h3>
                  <p className="text-sm text-[#525866] mt-1">
                    {opportunityTypeLabel(form.type)} — enter facts you know. Leave unknowns blank.
                  </p>
                </div>
                {renderTextField('productOrService', 'Opportunity title', {
                  placeholder: 'Clear commercial title',
                })}
                {renderTextField('industry', 'Product / service category', {
                  placeholder: 'e.g. Packaging, Agri-commodities, Logistics',
                })}
                {renderTextField('description', 'Description', {
                  rows: 5,
                  placeholder: 'What is needed or offered, and why a counterpart should respond',
                })}
                {renderTextField('technicalSpecs', 'Technical specifications', {
                  rows: 3,
                  placeholder: 'Grades, dimensions, materials, performance requirements',
                })}
                {renderTextField('qualityRequirements', 'Quality and standards', {
                  rows: 2,
                  placeholder: 'Standards, inspection, packing requirements',
                })}
              </div>
            )}

            {step === 'commercial' && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <h3 className="text-base font-semibold text-[#191919]">Commercial terms & requirements</h3>
                  <p className="text-sm text-[#525866] mt-1">
                    Mandatory fields depend on opportunity type. Do not invent values.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderTextField('quantity', 'Quantity')}
                  {renderTextField('unit', 'Unit of measurement', { placeholder: 'MT, units, hours…' })}
                </div>
                {renderTextField('quantityAndSpecs', 'Quantity and specs summary', {
                  placeholder: 'Optional free-text summary',
                })}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderTextField('capacity', 'Production or supply capacity')}
                  {renderTextField('moq', 'Minimum order quantity')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {renderTextField('budgetOrPrice', 'Indicative budget or price')}
                  {renderTextField('currency', 'Currency')}
                  {isFieldVisible(form.type, 'priceNegotiable') && (
                    <div>
                      <label className={labelClass}>
                        Price negotiable <FieldMark importance={fieldImportance(form.type, 'priceNegotiable') ?? 'optional'} />
                      </label>
                      <button
                        type="button"
                        onClick={() => patchForm({ priceNegotiable: !form.priceNegotiable })}
                        className={`w-full min-h-[42px] rounded-lg border px-3 text-sm font-medium cursor-pointer ${
                          form.priceNegotiable
                            ? 'border-[#0A66C2] bg-[#E8F3FC] text-[#004182]'
                            : 'border-[#CBD5E1] bg-white text-[#525866]'
                        }`}
                      >
                        {form.priceNegotiable ? 'Yes — negotiable' : 'No — fixed indication'}
                      </button>
                    </div>
                  )}
                </div>
                {renderTextField('paymentTerms', 'Payment terms', {
                  placeholder: 'e.g. LC at sight, 30% advance',
                })}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderTextField('originLocation', 'Origin / location')}
                  {renderTextField('destinationMarket', 'Target markets / destination')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderTextField('deliveryTimeline', 'Delivery or fulfilment timeline')}
                  {renderTextField('deadline', 'Closing deadline', { type: 'date' })}
                </div>
                {renderTextField('requiredCertifications', 'Required certifications and documentation', {
                  rows: 2,
                })}
                {renderTextField('eligibilityRequirements', 'Business eligibility requirements', {
                  rows: 2,
                })}
                {renderTextField('preferredPartnerTraits', 'Preferred partner characteristics', {
                  rows: 2,
                })}
                {renderTextField('contactPreference', 'Contact and response preferences')}
                {isFieldVisible(form.type, 'showPublicContact') && (
                  <label className="flex items-start gap-3 rounded-lg border border-[#DCE3EC] bg-white p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showPublicContact}
                      onChange={(e) => patchForm({ showPublicContact: e.target.checked })}
                      className="mt-0.5 accent-[#0A66C2]"
                    />
                    <span className="text-sm text-[#334155]">
                      Show my business contact preferences publicly on this opportunity.
                      Enquiries can still be sent privately through TradeSquare.
                    </span>
                  </label>
                )}
              </div>
            )}

            {step === 'ai' && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <h3 className="text-base font-semibold text-[#191919]">
                    Opportunity Intelligence
                  </h3>
                  <p className="text-sm text-[#525866] mt-1">
                    TradeSquare extracts structured fields from your words. Suggestions never overwrite
                    your fields until you accept them.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Describe the opportunity in your own words</label>
                  <textarea
                    rows={4}
                    value={naturalLanguage}
                    onChange={(e) => setNaturalLanguage(e.target.value)}
                    placeholder="e.g. We need 20 tonnes of food-grade corrugated cartons for Kigali delivery within 45 days…"
                    className={textareaClass}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={() => runAssist('extract')}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium px-3.5 py-2 cursor-pointer disabled:opacity-60"
                  >
                    {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Extract fields
                  </button>
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={() => runAssist('improve')}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white text-[#191919] text-sm font-medium px-3.5 py-2 cursor-pointer disabled:opacity-60"
                  >
                    Improve wording
                  </button>
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={() => runAssist('quality')}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white text-[#191919] text-sm font-medium px-3.5 py-2 cursor-pointer disabled:opacity-60"
                  >
                    Quality review
                  </button>
                  <div className="inline-flex items-center gap-2">
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value as 'English' | 'Kinyarwanda')}
                      className="min-h-[38px] rounded-lg border border-[#CBD5E1] bg-white px-2 text-sm"
                    >
                      <option value="English">English</option>
                      <option value="Kinyarwanda">Kinyarwanda</option>
                    </select>
                    <button
                      type="button"
                      disabled={aiBusy}
                      onClick={() => runAssist('translate')}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white text-[#191919] text-sm font-medium px-3.5 py-2 cursor-pointer disabled:opacity-60"
                    >
                      Translate
                    </button>
                  </div>
                </div>

                {suggestionKeys.length > 0 && (
                  <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#004182]">Pending AI suggestions</p>
                      <button
                        type="button"
                        onClick={acceptAllSuggestions}
                        className="text-xs font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                      >
                        Accept all
                      </button>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {suggestionKeys.map((key) => (
                        <li key={String(key)} className="text-xs text-[#1E3A5F] flex items-start justify-between gap-2">
                          <span>
                            <span className="font-semibold">{String(key)}</span>: {String(suggestions[key])}
                          </span>
                          <button
                            type="button"
                            onClick={() => acceptSuggestion(key)}
                            className="shrink-0 font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                          >
                            Accept
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {qualityReview && (
                  <div className="rounded-xl border border-[#DCE3EC] bg-white p-4 space-y-3">
                    <p className="text-sm font-semibold text-[#191919]">Quality review</p>
                    <p className="text-sm text-[#525866]">{qualityReview.summary}</p>
                    {qualityReview.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-[#047857]">Strengths</p>
                        <ul className="mt-1 space-y-1">
                          {qualityReview.strengths.map((s) => (
                            <li key={s} className="text-sm text-[#334155]">· {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {qualityReview.gaps?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-[#B45309]">Gaps</p>
                        <ul className="mt-1 space-y-1">
                          {qualityReview.gaps.map((s) => (
                            <li key={s} className="text-sm text-[#334155]">· {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {qualityReview.recommendations?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-[#0A66C2]">Recommendations</p>
                        <ul className="mt-1 space-y-2">
                          {qualityReview.recommendations.map((r) => (
                            <li key={r.title} className="text-sm text-[#334155]">
                              <span className="font-medium">{r.title}</span>
                              <span className="text-[#64748B]"> — {r.reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-[#64748B]">
                      {qualityReview.readyToPublish
                        ? 'Commercially clear enough to publish, based on provided details.'
                        : 'Add missing commercial details before publishing for better responses.'}
                    </p>
                  </div>
                )}

                {(missingInfo.length > 0 || clarifications.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {missingInfo.length > 0 && (
                      <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3">
                        <p className="text-xs font-semibold text-[#92400E]">Missing information</p>
                        <ul className="mt-1 space-y-1">
                          {missingInfo.map((m) => (
                            <li key={m} className="text-sm text-[#78350F]">· {m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {clarifications.length > 0 && (
                      <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3">
                        <p className="text-xs font-semibold text-[#1E3A5F]">Clarification questions</p>
                        <ul className="mt-1 space-y-1">
                          {clarifications.map((m) => (
                            <li key={m} className="text-sm text-[#1E3A5F]">· {m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <h3 className="text-base font-semibold text-[#191919]">Public preview</h3>
                  <p className="text-sm text-[#525866] mt-1">
                    This is how other businesses will see your opportunity after publication.
                  </p>
                </div>
                <article className="rounded-xl border border-[#DCE3EC] bg-white overflow-hidden shadow-sm">
                  <div className="px-5 pt-5 pb-4 flex items-start gap-3 border-b border-[#F1F5F9]">
                    {businessLogoUrl ? (
                      <img
                        src={businessLogoUrl}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover border border-[#E2E8F0]"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#E8F3FC] text-[#0A66C2] font-semibold flex items-center justify-center">
                        {businessName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-[#191919]">{businessName}</h4>
                        {verifiedRecord && (
                          <span className="text-[11px] font-semibold text-[#0A66C2] bg-[#E8F3FC] px-2 py-0.5 rounded">
                            Verified record
                          </span>
                        )}
                        <span className="text-[12px] font-semibold text-[#0A66C2] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-md">
                          {opportunityTypeLabel(form.type)}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {businessLocation} · {form.industry || 'Category pending'}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <h3 className="text-lg font-semibold text-[#191919]">
                      {form.productOrService || 'Untitled opportunity'}
                    </h3>
                    <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">
                      {form.description || 'No description provided yet.'}
                    </p>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {(form.quantity || form.unit) && (
                        <div>
                          <dt className="text-xs text-[#64748B]">Quantity</dt>
                          <dd className="font-medium text-[#191919]">
                            {[form.quantity, form.unit].filter(Boolean).join(' ')}
                          </dd>
                        </div>
                      )}
                      {form.budgetOrPrice && (
                        <div>
                          <dt className="text-xs text-[#64748B]">Indicative price / budget</dt>
                          <dd className="font-medium text-[#191919]">
                            {[form.currency, form.budgetOrPrice].filter(Boolean).join(' ')}
                            {form.priceNegotiable ? ' (negotiable)' : ''}
                          </dd>
                        </div>
                      )}
                      {form.originLocation && (
                        <div>
                          <dt className="text-xs text-[#64748B]">Origin</dt>
                          <dd className="font-medium text-[#191919]">{form.originLocation}</dd>
                        </div>
                      )}
                      {form.destinationMarket && (
                        <div>
                          <dt className="text-xs text-[#64748B]">Destination / markets</dt>
                          <dd className="font-medium text-[#191919]">{form.destinationMarket}</dd>
                        </div>
                      )}
                      {form.deadline && (
                        <div>
                          <dt className="text-xs text-[#64748B]">Deadline</dt>
                          <dd className="font-medium text-[#191919]">{form.deadline}</dd>
                        </div>
                      )}
                      {form.deliveryTimeline && (
                        <div>
                          <dt className="text-xs text-[#64748B]">Timeline</dt>
                          <dd className="font-medium text-[#191919]">{form.deliveryTimeline}</dd>
                        </div>
                      )}
                      {form.requiredCertifications && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-[#64748B]">Requirements</dt>
                          <dd className="font-medium text-[#191919]">{form.requiredCertifications}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="pt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-lg bg-[#0A66C2] text-white text-sm font-medium px-3.5 py-2">
                        Enquire / respond
                      </span>
                      {form.showPublicContact && form.contactPreference && (
                        <span className="inline-flex items-center rounded-lg border border-[#CBD5E1] text-sm text-[#334155] px-3 py-2">
                          {form.contactPreference}
                        </span>
                      )}
                    </div>
                  </div>
                </article>

                <label className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-white p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmPublish}
                    onChange={(e) => setConfirmPublish(e.target.checked)}
                    className="mt-0.5 accent-[#0A66C2]"
                  />
                  <span className="text-sm text-[#334155]">
                    I confirm this information is accurate and ready to publish. TradeSquare will create a live
                    opportunity record only after I publish.
                  </span>
                </label>
              </div>
            )}

            {step === 'done' && publishedOpp && (
              <div className="text-center py-10 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#047857]" />
                </div>
                <h3 className="text-xl font-semibold text-[#191919]">Published successfully</h3>
                <p className="text-sm text-[#666666]">
                  Your {opportunityTypeLabel(publishedOpp.type)} is now live for discovery.
                </p>
                <p className="text-[15px] font-semibold text-[#191919]">{publishedOpp.productOrService}</p>
                <p className="text-xs text-[#666666]">Opportunity ID: {publishedOpp.id}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onPublishedNavigate}
                    className="inline-flex items-center justify-center rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold px-5 py-2.5 cursor-pointer"
                  >
                    View opportunities
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center justify-center rounded-full border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold px-5 py-2.5 hover:bg-[#E8F3FC] cursor-pointer"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {step !== 'done' && (
              <div className="mt-6 pt-4 border-t border-[#E0E0E0] hidden sm:flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {step !== 'type' && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold text-[#666666] hover:bg-[#00000014] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onCancel}
                    className="h-9 px-4 rounded-full text-sm font-semibold text-[#666666] hover:bg-[#00000014] cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {step !== 'preview' ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold cursor-pointer"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handlePublish}
                      className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm & publish
                    </button>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* LinkedIn-style right rail */}
          <aside className="lg:col-span-4 space-y-3 lg:sticky lg:top-[7.5rem]">
            <div className={`${cardClass} p-4 space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0A66C2]" />
                  <p className="text-[15px] font-semibold text-[#191919]">Opportunity Intelligence</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiPanelOpen((v) => !v)}
                  className="lg:hidden text-[13px] font-semibold text-[#0A66C2] cursor-pointer"
                >
                  {aiPanelOpen ? 'Hide' : 'Show'}
                </button>
              </div>
              {aiPanelOpen && (
                <>
                  <p className="text-[12px] font-medium text-[#0A66C2]">
                    TradeSquare model · runs on your server
                  </p>
                  <p className="text-[13px] text-[#666666] leading-relaxed">
                    Describe your need in plain language on the AI step. Suggestions stay pending until you
                    accept them — nothing is overwritten silently. No external AI key required.
                  </p>
                  <ul className="text-[13px] text-[#191919] space-y-2">
                    <li className="flex gap-2"><span className="text-[#0A66C2]">•</span> Extract product, quantity, location</li>
                    <li className="flex gap-2"><span className="text-[#0A66C2]">•</span> Flag missing commercial details</li>
                    <li className="flex gap-2"><span className="text-[#0A66C2]">•</span> Suggest categories & certifications</li>
                    <li className="flex gap-2"><span className="text-[#0A66C2]">•</span> Translate English ↔ Kinyarwanda</li>
                  </ul>
                  {missingInfo.length > 0 && (
                    <div className="rounded-md bg-[#FFF3CD] border border-[#FFE69C] p-3">
                      <p className="text-[12px] font-semibold text-[#664D03]">Still missing</p>
                      <p className="text-[13px] text-[#664D03] mt-1">{missingInfo[0]}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={`${cardClass} p-4 space-y-2`}>
              <p className="text-[15px] font-semibold text-[#191919]">Why structure matters</p>
              <p className="text-[13px] text-[#666666] leading-relaxed">
                Clear quantities, destinations and deadlines help TradeSquare match you with relevant buyers
                and suppliers — without inventing commercial details.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile fixed bottom actions — LinkedIn compose pattern */}
      {step !== 'done' && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[#E0E0E0] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2">
          {step !== 'type' && (
            <button
              type="button"
              onClick={goBack}
              className="h-10 px-3 rounded-full text-sm font-semibold text-[#666666] hover:bg-[#00000014] cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            type="button"
            disabled={savingDraft}
            onClick={async () => {
              const saved = await saveDraft();
              if (saved) setError(null);
            }}
            className="h-10 px-3 rounded-full border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            Draft
          </button>
          {step !== 'preview' ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 h-10 rounded-full bg-[#0A66C2] text-white text-sm font-semibold cursor-pointer"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handlePublish}
              className="flex-1 h-10 rounded-full bg-[#0A66C2] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
            >
              Publish
            </button>
          )}
        </div>
      )}
    </div>
  );
}

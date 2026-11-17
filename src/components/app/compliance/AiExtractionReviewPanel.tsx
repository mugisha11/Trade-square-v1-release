import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Loader2,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  DocumentAiExtraction,
  DocumentExtractedField,
  DocumentProfileProposal,
  UploadedDocumentRecord,
} from '../../../types/compliance';
import { authFetch } from '../../../lib/authClient';

interface AiExtractionReviewPanelProps {
  doc: UploadedDocumentRecord;
  previewUrl?: string | null;
  onClose: () => void;
  onConfirmed: (payload: {
    document: UploadedDocumentRecord;
    business?: unknown;
  }) => void;
  onShowToast?: (kind: 'success' | 'error', text: string) => void;
}

function confidenceTone(confidence: DocumentExtractedField['confidence']) {
  if (confidence === 'high') return 'text-emerald-700 bg-emerald-50 dark:text-[#00BA7C] dark:bg-[#00BA7C]/15';
  if (confidence === 'needs_review') return 'text-amber-700 bg-amber-50 dark:text-[#FFAD1F] dark:bg-[#FFAD1F]/15';
  return 'text-[#65676B] bg-[#F0F2F5] dark:text-[#A8A8A8] dark:bg-[#202327]';
}

function confidenceLabel(confidence: DocumentExtractedField['confidence']) {
  if (confidence === 'high') return 'High confidence';
  if (confidence === 'needs_review') return 'Needs review';
  if (confidence === 'unreadable') return 'Unreadable';
  return 'Missing';
}

export function AiExtractionReviewPanel({
  doc,
  previewUrl,
  onClose,
  onConfirmed,
  onShowToast,
}: AiExtractionReviewPanelProps) {
  const ai = doc.aiAnalysis as DocumentAiExtraction;
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of ai.fields) initial[field.key] = field.value || '';
    return initial;
  });
  const [acceptedKeys, setAcceptedKeys] = useState<Set<string>>(() => {
    const next = new Set<string>();
    for (const field of ai.fields) {
      if (field.confidence === 'high' && field.value.trim()) next.add(field.key);
    }
    return next;
  });
  const [acceptedProposals, setAcceptedProposals] = useState<Set<string>>(() => new Set());
  const [linkChecklist, setLinkChecklist] = useState(Boolean(ai.suggestedChecklistRuleId));
  const [createExperience, setCreateExperience] = useState(ai.documentFamily === 'experience');
  const [submitForReview, setSubmitForReview] = useState(true);
  const [applyMode, setApplyMode] = useState<'merge' | 'replace'>('merge');
  const [saving, setSaving] = useState(false);

  const editableFields = useMemo(
    () => ai.fields.filter((f) => f.status !== 'not_applicable'),
    [ai.fields]
  );

  function toggleAccepted(key: string) {
    setAcceptedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function acceptAllHighConfidence() {
    setAcceptedKeys((prev) => {
      const next = new Set(prev);
      for (const field of ai.fields) {
        if (field.confidence === 'high' && (fieldValues[field.key] || field.value).trim()) {
          next.add(field.key);
        }
      }
      return next;
    });
  }

  function proposalKey(p: DocumentProfileProposal) {
    return `${p.target}:${p.field}:${p.sourceFieldKey}`;
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      const fieldEdits = editableFields.map((f) => ({
        key: f.key,
        value: fieldValues[f.key] ?? f.value,
      }));
      const acceptedProfileUpdates = ai.profileProposals
        .filter((p) => acceptedProposals.has(proposalKey(p)))
        .map((p) => ({
          target: p.target,
          field: p.field,
          value: p.proposedValue,
        }));

      const res = await authFetch(`/api/compliance/documents/${doc.id}/confirm-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptedFieldKeys: [...acceptedKeys],
          fieldEdits,
          acceptedProfileUpdates,
          checklistRuleId: linkChecklist ? ai.suggestedChecklistRuleId : undefined,
          createExperienceRecord: createExperience,
          submitForReview,
          applyMode,
          title: ai.extractedTitle,
          documentType: ai.detectedDocumentType,
          issuingAuthority: ai.extractedIssuingAuthority,
          referenceNumber: ai.extractedReferenceNumber,
          issueDate: ai.extractedIssueDate,
          expiryDate: ai.extractedExpiryDate,
          relatedProductOrScope: ai.relatedBusinessOrProduct,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not confirm extraction.');
      onConfirmed({ document: data.document, business: data.business });
      onShowToast?.('success', 'Confirmed fields saved. Checklist updated where linked.');
    } catch (err: unknown) {
      onShowToast?.(
        'error',
        err instanceof Error ? err.message : 'Unable to confirm extracted fields.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0] dark:border-[#2F3336]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0A66C2] dark:text-[#1D9BF0]" />
              <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Review AI extraction
              </h2>
            </div>
            <p className="text-xs text-[#65676B] dark:text-[#A8A8A8] mt-1">
              Confirm only values supported by the document. Nothing is saved to your business
              profile until you confirm.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-8 w-8 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.06] inline-flex items-center justify-center cursor-pointer"
            aria-label="Close review"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <div className="space-y-4">
            <section className="rounded-xl border border-[#E2E8F0] dark:border-[#2F3336] p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Document information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[#65676B] dark:text-[#A8A8A8]">Identified type</p>
                  <p className="font-medium text-[#191919] dark:text-[#E7E9EA]">
                    {ai.detectedDocumentType}
                  </p>
                </div>
                <div>
                  <p className="text-[#65676B] dark:text-[#A8A8A8]">Issuing authority</p>
                  <p className="font-medium text-[#191919] dark:text-[#E7E9EA]">
                    {ai.extractedIssuingAuthority || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[#65676B] dark:text-[#A8A8A8]">Country</p>
                  <p className="font-medium text-[#191919] dark:text-[#E7E9EA]">
                    {ai.issuingCountry || doc.countryOfIssue}
                  </p>
                </div>
                <div>
                  <p className="text-[#65676B] dark:text-[#A8A8A8]">Status</p>
                  <p className="font-medium text-[#191919] dark:text-[#E7E9EA] capitalize">
                    {(ai.processingStatus || 'ready_for_review').replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              {ai.documentPurposeSummary && (
                <p className="text-xs text-[#525866] dark:text-[#A8A8A8] leading-relaxed">
                  {ai.documentPurposeSummary}
                </p>
              )}
              {previewUrl && (
                <div className="rounded-lg overflow-hidden border border-[#E2E8F0] dark:border-[#2F3336] bg-[#F8FAFC] dark:bg-black h-48">
                  {doc.mimeType.startsWith('image/') ? (
                    <img src={previewUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <iframe title="Document preview" src={previewUrl} className="w-full h-full" />
                  )}
                </div>
              )}
            </section>

            {(ai.discrepancies.length > 0 ||
              ai.expiryWarnings.length > 0 ||
              ai.extractionWarnings.length > 0) && (
              <section className="rounded-xl border border-amber-200 dark:border-[#FFAD1F]/40 bg-amber-50/70 dark:bg-[#FFAD1F]/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-[#FFAD1F]">
                  <ShieldAlert className="w-4 h-4" />
                  Review flags
                </div>
                <ul className="space-y-1.5 text-xs text-amber-900 dark:text-[#FFAD1F]">
                  {ai.discrepancies.map((d) => (
                    <li key={`${d.fieldKey}-${d.message}`}>• {d.message}</li>
                  ))}
                  {ai.expiryWarnings.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                  {ai.extractionWarnings.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-xl border border-[#E2E8F0] dark:border-[#2F3336] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  Extracted information
                </h3>
                <button
                  type="button"
                  onClick={acceptAllHighConfidence}
                  className="text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
                >
                  Accept all high-confidence fields
                </button>
              </div>

              <div className="space-y-3">
                {editableFields.map((field) => {
                  const accepted = acceptedKeys.has(field.key);
                  const disabled =
                    field.confidence === 'missing' || field.confidence === 'unreadable';
                  return (
                    <div
                      key={field.key}
                      className="rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] p-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-[#191919] dark:text-[#E7E9EA]">
                          {field.label}
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidenceTone(
                              field.confidence
                            )}`}
                          >
                            {confidenceLabel(field.confidence)}
                          </span>
                          {typeof field.pageNumber === 'number' && (
                            <span className="text-[10px] text-[#65676B] dark:text-[#A8A8A8]">
                              Page {field.pageNumber}
                            </span>
                          )}
                          <label className="inline-flex items-center gap-1.5 text-[11px] text-[#525866] dark:text-[#A8A8A8] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={accepted}
                              disabled={disabled && !fieldValues[field.key]?.trim()}
                              onChange={() => toggleAccepted(field.key)}
                            />
                            Accept
                          </label>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={fieldValues[field.key] ?? ''}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={
                          field.confidence === 'unreadable'
                            ? 'Unreadable — enter manually if known'
                            : 'Not found in document'
                        }
                        className="w-full min-h-[38px] rounded-lg border border-[#CFD9DE] dark:border-[#2F3336] dark:bg-black px-3 text-sm text-[#191919] dark:text-[#E7E9EA]"
                      />
                      {(field.originalText || field.warning) && (
                        <p className="text-[11px] text-[#65676B] dark:text-[#A8A8A8]">
                          {field.warning || `Evidence: ${field.originalText}`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {ai.profileProposals.length > 0 && (
              <section className="rounded-xl border border-[#E2E8F0] dark:border-[#2F3336] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  Proposed business record updates
                </h3>
                <p className="text-xs text-[#65676B] dark:text-[#A8A8A8]">
                  Existing values are never overwritten unless you explicitly accept them.
                </p>
                {ai.profileProposals.map((p) => {
                  const key = proposalKey(p);
                  return (
                    <label
                      key={key}
                      className="flex items-start gap-2 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] p-3 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={acceptedProposals.has(key)}
                        onChange={() => {
                          setAcceptedProposals((prev) => {
                            const next = new Set(prev);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            return next;
                          });
                        }}
                      />
                      <span>
                        <span className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
                          {p.label}
                        </span>
                        <span className="block text-[#525866] dark:text-[#A8A8A8] mt-0.5">
                          Proposed: {p.proposedValue}
                          {p.existingValue ? ` · Current: ${p.existingValue}` : ' · Currently empty'}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[#E2E8F0] dark:border-[#2F3336] p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                <FileSearch className="w-4 h-4" />
                Checklist mapping
              </div>
              {ai.suggestedChecklistRuleName ? (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkChecklist}
                    onChange={(e) => setLinkChecklist(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Link to checklist item:
                    <span className="block font-medium text-[#191919] dark:text-[#E7E9EA] mt-0.5">
                      {ai.suggestedChecklistRuleName}
                    </span>
                  </span>
                </label>
              ) : (
                <p className="text-[#65676B] dark:text-[#A8A8A8]">
                  No automatic checklist match found. You can link manually later.
                </p>
              )}
              {ai.supportsChecklistItems.length > 0 && (
                <ul className="space-y-1 text-[#525866] dark:text-[#A8A8A8]">
                  {ai.supportsChecklistItems.map((item) => (
                    <li key={item}>• May support: {item}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-[#E2E8F0] dark:border-[#2F3336] p-4 space-y-3 text-xs">
              <p className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Save options
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="applyMode"
                  checked={applyMode === 'merge'}
                  onChange={() => setApplyMode('merge')}
                />
                Fill empty fields only (safer)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="applyMode"
                  checked={applyMode === 'replace'}
                  onChange={() => setApplyMode('replace')}
                />
                Replace accepted document fields
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={submitForReview}
                  onChange={(e) => setSubmitForReview(e.target.checked)}
                />
                Mark document as Pending review
              </label>
              {ai.documentFamily === 'experience' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createExperience}
                    onChange={(e) => setCreateExperience(e.target.checked)}
                  />
                  Create experience evidence draft
                </label>
              )}
              <p className="text-[11px] text-[#65676B] dark:text-[#A8A8A8] leading-relaxed">
                Model: {ai.modelUsed || 'tradesquare-docintel-v1'} · OCR:{' '}
                {ai.ocrMethod || 'tradesquare_pdf_text'}
              </p>
              <p className="text-[11px] text-[#65676B] dark:text-[#A8A8A8] leading-relaxed">
                {ai.disclaimer}
              </p>
            </section>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-[#E2E8F0] dark:border-[#2F3336]">
          <div className="text-xs text-[#65676B] dark:text-[#A8A8A8] inline-flex items-center gap-1.5">
            {ai.flaggedForHumanReview ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Flagged for human review
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ready to confirm accepted fields
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-9 px-4 rounded-full text-sm font-semibold text-[#65676B] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || acceptedKeys.size === 0}
              onClick={() => void handleConfirm()}
              className="h-9 px-5 rounded-full bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm &amp; save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

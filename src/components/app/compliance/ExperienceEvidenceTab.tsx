import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Download,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type {
  ExperienceEvidenceRecord,
  ExperienceEvidenceType,
} from '../../../types/compliance';
import { authFetch } from '../../../lib/authClient';
import { formatBytes, readFileAsBase64 } from './ComplianceBadges';

interface ExperienceEvidenceTabProps {
  records: ExperienceEvidenceRecord[];
  defaultSector: string;
  onWorkspaceRefresh: () => Promise<void>;
  onShowToast?: (kind: 'success' | 'error', text: string) => void;
}

const EVIDENCE_TYPES: ExperienceEvidenceType[] = [
  'Certificate of Completion',
  'Certificate of Good Performance',
  'Satisfactory Service Delivery Certificate',
  'Client Reference Letter',
  'Project Completion Report',
  'Contract Award',
  'Delivery and Acceptance Note',
];

export function ExperienceEvidenceTab({
  records,
  defaultSector,
  onWorkspaceRefresh,
  onShowToast,
}: ExperienceEvidenceTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState<ExperienceEvidenceType>('Certificate of Completion');
  const [clientOrContractingOrg, setClientOrContractingOrg] = useState('');
  const [projectOrContractTitle, setProjectOrContractTitle] = useState('');
  const [sector, setSector] = useState(defaultSector);
  const [contractPeriod, setContractPeriod] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [natureOfDelivery, setNatureOfDelivery] = useState('');
  const [issuingOrganisation, setIssuingOrganisation] = useState('');
  const [confidentialityConfirmed, setConfidentialityConfirmed] = useState(false);
  const [publicDisplay, setPublicDisplay] = useState(false);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{
    rec: ExperienceEvidenceRecord;
    blobUrl: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (previewState?.blobUrl) URL.revokeObjectURL(previewState.blobUrl);
    };
  }, [previewState]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!projectOrContractTitle.trim() || !clientOrContractingOrg.trim()) {
      setFormError('Project / Contract Title and Client Organisation are required.');
      return;
    }

    setSaving(true);
    try {
      let filePayload: Record<string, unknown> = {};
      if (supportingFile) {
        if (supportingFile.size > 8 * 1024 * 1024) {
          throw new Error('Supporting file exceeds 8 MB maximum size.');
        }
        const base64Content = await readFileAsBase64(supportingFile);
        filePayload = {
          base64Content,
          mimeType: supportingFile.type || 'application/pdf',
          supportingFileName: supportingFile.name,
        };
      }

      const res = await authFetch('/api/compliance/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidenceType,
          clientOrContractingOrg: clientOrContractingOrg.trim(),
          projectOrContractTitle: projectOrContractTitle.trim(),
          sector: sector.trim() || defaultSector,
          contractPeriod: contractPeriod.trim(),
          completionDate: completionDate.trim(),
          natureOfDelivery: natureOfDelivery.trim(),
          issuingOrganisation: issuingOrganisation.trim() || clientOrContractingOrg.trim(),
          confidentialityConfirmed,
          publicDisplay: confidentialityConfirmed ? publicDisplay : false,
          ...filePayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save experience record.');

      await onWorkspaceRefresh();
      setShowForm(false);
      setClientOrContractingOrg('');
      setProjectOrContractTitle('');
      setContractPeriod('');
      setCompletionDate('');
      setNatureOfDelivery('');
      setIssuingOrganisation('');
      setConfidentialityConfirmed(false);
      setPublicDisplay(false);
      setSupportingFile(null);
      onShowToast?.('success', 'Experience & performance record saved.');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to save record.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublicDisplay(rec: ExperienceEvidenceRecord) {
    if (!rec.confidentialityConfirmed && !rec.publicDisplay) {
      onShowToast?.(
        'error',
        'Non-confidentiality confirmation is required before displaying an experience summary.'
      );
      return;
    }
    setBusyId(rec.id);
    try {
      const res = await authFetch(`/api/compliance/experience/${rec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicDisplay: !rec.publicDisplay,
          confidentialityConfirmed: rec.confidentialityConfirmed,
        }),
      });
      if (!res.ok) throw new Error('Could not update visibility.');
      await onWorkspaceRefresh();
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePreviewFile(rec: ExperienceEvidenceRecord) {
    setBusyId(rec.id);
    try {
      const res = await authFetch(`/api/compliance/experience/${rec.id}/file`);
      if (!res.ok) throw new Error('Unable to preview supporting document.');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewState((prev) => {
        if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
        return { rec, blobUrl };
      });
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'Preview failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownloadFile(rec: ExperienceEvidenceRecord) {
    try {
      const res = await authFetch(`/api/compliance/experience/${rec.id}/file?download=1`);
      if (!res.ok) throw new Error('Unable to download file.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = rec.supportingFileName || 'experience-evidence';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'Download failed.');
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await authFetch(`/api/compliance/experience/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete record.');
      await onWorkspaceRefresh();
      onShowToast?.('success', 'Experience record deleted.');
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + Explicit Regulatory Distinction Notice */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
            Experience &amp; Performance Evidence
          </h2>
          <p className="text-xs text-[#525866] dark:text-[#71767B] max-w-2xl leading-relaxed">
            Upload Certificates of Project Completion, Certificates of Good Performance, Reference Letters, and Delivery Notes to demonstrate delivery history.{' '}
            <strong className="text-[#191919] dark:text-[#E7E9EA]">
              Important:
            </strong>{' '}
            These commercial credibility records are never statutory operating licences and are private unless you explicitly confirm non-confidentiality and enable summary display.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-xs font-semibold shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Performance Record
        </button>
      </div>

      {/* Add Record Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#16181C] border-2 border-[#0A66C2]/40 dark:border-[#1D9BF0]/40 rounded-xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2F3336]">
            <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Record Past Contract or Completion Evidence
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-lg hover:bg-[#F3F6F8] dark:hover:bg-[#202327] text-[#65676B] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-[#F4212E]/10 border border-rose-200 dark:border-[#F4212E]/30 text-xs text-rose-700 dark:text-[#F4212E] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Evidence Type
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as ExperienceEvidenceType)}
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              >
                {EVIDENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Project / Contract Title *
              </label>
              <input
                type="text"
                required
                value={projectOrContractTitle}
                onChange={(e) => setProjectOrContractTitle(e.target.value)}
                placeholder="e.g. Regional Packaging Supply Framework"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Client / Contracting Organisation *
              </label>
              <input
                type="text"
                required
                value={clientOrContractingOrg}
                onChange={(e) => setClientOrContractingOrg(e.target.value)}
                placeholder="e.g. Kigali Agro Cooperative Union"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Sector
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Contract Period
              </label>
              <input
                type="text"
                value={contractPeriod}
                onChange={(e) => setContractPeriod(e.target.value)}
                placeholder="e.g. Jan 2025 – Oct 2025"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Completion Date
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Issuing Signatory / Organisation
              </label>
              <input
                type="text"
                value={issuingOrganisation}
                onChange={(e) => setIssuingOrganisation(e.target.value)}
                placeholder="Defaults to client organisation"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Nature of Goods or Services Delivered
              </label>
              <input
                type="text"
                value={natureOfDelivery}
                onChange={(e) => setNatureOfDelivery(e.target.value)}
                placeholder="e.g. 40,000 moisture-barrier cartons delivered on schedule"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Supporting File (Optional · PDF, JPG, JPEG, PNG &lt;= 8 MB)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => setSupportingFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-[#525866] dark:text-[#71767B] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E7F3FF] file:text-[#0A66C2] dark:file:bg-[#1D9BF0]/15 dark:file:text-[#1D9BF0]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] space-y-2 text-xs">
            <label className="flex items-start gap-2 text-[#191919] dark:text-[#E7E9EA] cursor-pointer">
              <input
                type="checkbox"
                checked={confidentialityConfirmed}
                onChange={(e) => {
                  setConfidentialityConfirmed(e.target.checked);
                  if (!e.target.checked) setPublicDisplay(false);
                }}
                className="mt-0.5 rounded border-slate-300 text-[#0A66C2]"
              />
              <span>
                I confirm this record summary contains no restricted NDA pricing or confidential third-party clauses.
              </span>
            </label>

            <label
              className={`flex items-start gap-2 ${
                confidentialityConfirmed
                  ? 'text-[#191919] dark:text-[#E7E9EA] cursor-pointer'
                  : 'text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <input
                type="checkbox"
                disabled={!confidentialityConfirmed}
                checked={publicDisplay}
                onChange={(e) => setPublicDisplay(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#0A66C2]"
              />
              <span>
                Allow non-confidential summary display on my TradeSquare business overview (supporting files remain private).
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-medium text-[#525866] dark:text-[#71767B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-xs font-semibold cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Experience Evidence
            </button>
          </div>
        </form>
      )}

      {/* Records List */}
      {records.length === 0 ? (
        <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-10 text-center">
          <Award className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
            No commercial experience records added yet
          </p>
          <p className="text-xs text-[#525866] dark:text-[#71767B] mt-1 max-w-md mx-auto">
            Maintain your tender-ready portfolio of completion certificates, performance attestations, and client reference letters here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#F0F2F5] dark:bg-[#202327] text-[#191919] dark:text-[#E7E9EA] text-[11px] font-semibold">
                      {rec.evidenceType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                      {rec.verificationStatus}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#525866] dark:text-[#71767B]">
                      {rec.publicDisplay ? (
                        <>
                          <Globe className="w-3 h-3 text-[#0A66C2] dark:text-[#1D9BF0]" />
                          Summary visible on profile
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          Private to owner
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-semibold text-[#191919] dark:text-[#E7E9EA]">
                    {rec.projectOrContractTitle}
                  </h3>

                  <p className="text-xs text-[#525866] dark:text-[#71767B]">
                    <strong className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                      Client:
                    </strong>{' '}
                    {rec.clientOrContractingOrg} ·{' '}
                    <strong className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                      Sector:
                    </strong>{' '}
                    {rec.sector}
                    {rec.completionDate && (
                      <span className="tabular-nums"> · Completed {rec.completionDate}</span>
                    )}
                  </p>

                  {rec.natureOfDelivery && (
                    <p className="text-xs text-[#334155] dark:text-[#E7E9EA]/90">
                      {rec.natureOfDelivery}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {rec.supportingFileName && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === rec.id}
                        onClick={() => handlePreviewFile(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview ({formatBytes(rec.supportingFileSizeBytes ?? 0)})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={busyId === rec.id}
                    onClick={() => togglePublicDisplay(rec)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#334155] dark:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                  >
                    {rec.publicDisplay ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        Share Summary
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === rec.id}
                    onClick={() => handleDelete(rec.id)}
                    aria-label={`Delete ${rec.projectOrContractTitle}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-rose-600 dark:text-[#F4212E] hover:bg-rose-50 dark:hover:bg-[#F4212E]/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewState && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              URL.revokeObjectURL(previewState.blobUrl);
              setPreviewState(null);
            }
          }}
        >
          <div className="w-full max-w-4xl h-[82vh] bg-white dark:bg-[#16181C] rounded-2xl border border-[#E2E8F0] dark:border-[#2F3336] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-[#2F3336] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA] truncate">
                  {previewState.rec.projectOrContractTitle}
                </h3>
                <p className="text-[11px] text-[#65676B] dark:text-[#71767B] truncate">
                  {previewState.rec.supportingFileName} · Supporting Experience Document
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewState.blobUrl);
                  setPreviewState(null);
                }}
                aria-label="Close preview"
                className="w-8 h-8 rounded-lg hover:bg-[#F3F6F8] dark:hover:bg-[#202327] text-[#65676B] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 bg-[#F8FAFC] dark:bg-[#000000] overflow-auto flex items-center justify-center p-4">
              {previewState.rec.supportingMimeType === 'application/pdf' ? (
                <iframe
                  src={previewState.blobUrl}
                  title={previewState.rec.projectOrContractTitle}
                  className="w-full h-full rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] bg-white"
                />
              ) : (
                <img
                  src={previewState.blobUrl}
                  alt={previewState.rec.projectOrContractTitle}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

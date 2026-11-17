import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileText,
  FileUp,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  ChecklistItem,
  DocumentCategory,
  UploadedDocumentRecord,
} from '../../../types/compliance';
import type { BusinessProfile } from '../../../types/workspace';
import { authFetch } from '../../../lib/authClient';
import {
  CATEGORY_LABELS,
  DocumentStatusBadge,
  formatBytes,
  readFileAsBase64,
} from './ComplianceBadges';
import { AiExtractionReviewPanel } from './AiExtractionReviewPanel';

interface DocumentVaultTabProps {
  documents: UploadedDocumentRecord[];
  checklist: ChecklistItem[];
  defaultCountry: string;
  preselectedChecklistItem: ChecklistItem | null;
  focusedDocumentId: string | null;
  onClearPreselection: () => void;
  onWorkspaceRefresh: () => Promise<void>;
  onShowToast?: (kind: 'success' | 'error', text: string) => void;
  onBusinessSynced?: (updated: BusinessProfile) => void;
}

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);

export function DocumentVaultTab({
  documents,
  checklist,
  defaultCountry,
  preselectedChecklistItem,
  focusedDocumentId,
  onClearPreselection,
  onWorkspaceRefresh,
  onShowToast,
  onBusinessSynced,
}: DocumentVaultTabProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<UploadedDocumentRecord | null>(null);
  const [smartUploading, setSmartUploading] = useState(false);
  const [smartPhase, setSmartPhase] = useState<string | null>(null);
  const [reviewDocId, setReviewDocId] = useState<string | null>(null);
  const [reviewPreviewUrl, setReviewPreviewUrl] = useState<string | null>(null);
  const smartFileInputRef = useRef<HTMLInputElement>(null);

  // Upload / Edit Form State
  const [checklistRuleId, setChecklistRuleId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('BUSINESS_REGISTRATION');
  const [title, setTitle] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [countryOfIssue, setCountryOfIssue] = useState(defaultCountry);
  const [relatedProductOrScope, setRelatedProductOrScope] = useState('');
  const [notes, setNotes] = useState('');
  const [submitForReview, setSubmitForReview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // AI & File Preview States
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{
    doc: UploadedDocumentRecord;
    blobUrl: string;
  } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedChecklistItem) {
      setEditingDoc(null);
      setChecklistRuleId(preselectedChecklistItem.ruleId);
      setDocumentType(preselectedChecklistItem.documentName);
      setCategory(preselectedChecklistItem.category);
      setTitle(preselectedChecklistItem.documentName);
      setIssuingAuthority(preselectedChecklistItem.responsibleAuthority);
      setCountryOfIssue(preselectedChecklistItem.destinationJurisdiction ?? preselectedChecklistItem.jurisdiction);
      setRelatedProductOrScope(preselectedChecklistItem.relevantProducts.join(', '));
      setReferenceNumber('');
      setIssueDate('');
      setExpiryDate('');
      setNotes('');
      setSelectedFile(null);
      setFormError(null);
      setShowUploadForm(true);
    }
  }, [preselectedChecklistItem]);

  useEffect(() => {
    return () => {
      if (previewState?.blobUrl) {
        URL.revokeObjectURL(previewState.blobUrl);
      }
    };
  }, [previewState]);

  function openNewUpload() {
    onClearPreselection();
    setEditingDoc(null);
    setChecklistRuleId('');
    setDocumentType('');
    setCategory('BUSINESS_REGISTRATION');
    setTitle('');
    setIssuingAuthority('');
    setReferenceNumber('');
    setIssueDate('');
    setExpiryDate('');
    setCountryOfIssue(defaultCountry);
    setRelatedProductOrScope('');
    setNotes('');
    setSubmitForReview(false);
    setSelectedFile(null);
    setFormError(null);
    setShowUploadForm(true);
  }

  function openEditModal(doc: UploadedDocumentRecord) {
    onClearPreselection();
    setEditingDoc(doc);
    setChecklistRuleId(doc.checklistRuleId ?? '');
    setDocumentType(doc.documentType);
    setCategory(doc.category);
    setTitle(doc.title);
    setIssuingAuthority(doc.issuingAuthority);
    setReferenceNumber(doc.referenceNumber ?? '');
    setIssueDate(doc.issueDate ?? '');
    setExpiryDate(doc.expiryDate ?? '');
    setCountryOfIssue(doc.countryOfIssue);
    setRelatedProductOrScope(doc.relatedProductOrScope ?? '');
    setNotes(doc.notes ?? '');
    setSubmitForReview(doc.status === 'Pending review');
    setSelectedFile(null);
    setFormError(null);
    setShowUploadForm(true);
  }

  function handleFileChange(file: File | null) {
    setFormError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const mime = file.type.toLowerCase();
    if (!ACCEPTED_TYPES.has(mime)) {
      setFormError('Unsupported file format. Please choose a PDF, JPG, JPEG, or PNG file.');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setFormError('File exceeds the 8 MB maximum limit.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  }

  async function handleSaveUpload(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!editingDoc && !selectedFile) {
      setFormError('Please select a PDF, JPG, JPEG, or PNG file to upload.');
      return;
    }
    if (title.trim().length < 2 || !documentType.trim() || !issuingAuthority.trim()) {
      setFormError('Title, Document Type, and Issuing Authority are required.');
      return;
    }

    setSubmitting(true);
    try {
      let base64Content: string | undefined;
      let mimeType: string | undefined;
      let fileName: string | undefined;

      if (selectedFile) {
        base64Content = await readFileAsBase64(selectedFile);
        mimeType = selectedFile.type || 'application/pdf';
        fileName = selectedFile.name;
      }

      const payload = {
        checklistRuleId: checklistRuleId || undefined,
        documentType: documentType.trim(),
        category,
        title: title.trim(),
        issuingAuthority: issuingAuthority.trim(),
        referenceNumber: referenceNumber.trim() || undefined,
        issueDate: issueDate.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        countryOfIssue: countryOfIssue.trim() || defaultCountry,
        relatedProductOrScope: relatedProductOrScope.trim() || undefined,
        notes: notes.trim() || undefined,
        submitForReview,
        ...(base64Content ? { base64Content, mimeType, fileName } : {}),
      };

      const url = editingDoc
        ? `/api/compliance/documents/${editingDoc.id}`
        : '/api/compliance/documents';
      const method = editingDoc ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not save document.');
      }

      await onWorkspaceRefresh();
      setShowUploadForm(false);
      setEditingDoc(null);
      onClearPreselection();
      onShowToast?.('success', editingDoc ? 'Document record updated.' : 'Document uploaded privately to your vault.');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to upload document.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePreview(doc: UploadedDocumentRecord) {
    setPreviewLoadingId(doc.id);
    try {
      const res = await authFetch(`/api/compliance/documents/${doc.id}/file`);
      if (!res.ok) throw new Error('Unable to load file preview.');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewState((prev) => {
        if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
        return { doc, blobUrl };
      });
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'Preview failed.');
    } finally {
      setPreviewLoadingId(null);
    }
  }

  async function handleDownload(doc: UploadedDocumentRecord) {
    try {
      const res = await authFetch(`/api/compliance/documents/${doc.id}/file?download=1`);
      if (!res.ok) throw new Error('Unable to download file.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'Download failed.');
    }
  }

  async function openReviewForDoc(doc: UploadedDocumentRecord) {
    setReviewDocId(doc.id);
    try {
      const res = await authFetch(`/api/compliance/documents/${doc.id}/file`);
      if (res.ok) {
        const blob = await res.blob();
        setReviewPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      }
    } catch {
      // Preview is optional
    }
  }

  async function handleAnalyzeWithAi(doc: UploadedDocumentRecord, openReview = true) {
    setAnalyzingDocId(doc.id);
    try {
      const res = await authFetch(`/api/compliance/documents/${doc.id}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI analysis failed.');
      await onWorkspaceRefresh();
      onShowToast?.('success', 'AI extraction complete. Please review and confirm.');
      if (openReview && data.document) {
        await openReviewForDoc(data.document as UploadedDocumentRecord);
      }
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'AI analysis unavailable.');
    } finally {
      setAnalyzingDocId(null);
    }
  }

  async function handleSmartUpload(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    const queue = Array.from(files);
    setSmartUploading(true);
    try {
      for (let i = 0; i < queue.length; i += 1) {
        const file = queue[i];
        const mime = file.type.toLowerCase();
        if (!ACCEPTED_TYPES.has(mime)) {
          onShowToast?.('error', `${file.name}: unsupported format. Use PDF, JPG, JPEG, or PNG.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          onShowToast?.('error', `${file.name}: exceeds 8 MB limit.`);
          continue;
        }

        setSmartPhase(
          queue.length > 1
            ? `Uploading ${i + 1}/${queue.length}: ${file.name}`
            : `Uploading ${file.name}`
        );
        const base64Content = await readFileAsBase64(file);
        const uploadRes = await authFetch('/api/compliance/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smartUpload: true,
            checklistRuleId: preselectedChecklistItem?.ruleId || undefined,
            category: preselectedChecklistItem?.category || 'BUSINESS_REGISTRATION',
            title: file.name.replace(/\.[^.]+$/, ''),
            documentType: preselectedChecklistItem?.documentName || 'Pending AI identification',
            issuingAuthority:
              preselectedChecklistItem?.responsibleAuthority || 'Pending AI identification',
            countryOfIssue:
              preselectedChecklistItem?.destinationJurisdiction ||
              preselectedChecklistItem?.jurisdiction ||
              defaultCountry,
            relatedProductOrScope: preselectedChecklistItem?.relevantProducts.join(', ') || undefined,
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            base64Content,
            submitForReview: false,
          }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || `Could not upload ${file.name}`);
        }

        const created = uploadData.document as UploadedDocumentRecord;
        setSmartPhase(`Reading & extracting: ${file.name}`);
        setAnalyzingDocId(created.id);
        const analyzeRes = await authFetch(`/api/compliance/documents/${created.id}/analyze`, {
          method: 'POST',
        });
        const analyzeData = await analyzeRes.json();
        if (!analyzeRes.ok) {
          await onWorkspaceRefresh();
          const deniedMessage =
            typeof analyzeData.error === 'string'
              ? analyzeData.error
              : `No. Upload rejected for ${file.name}.`;
          onShowToast?.('error', deniedMessage);
          continue;
        }

        await onWorkspaceRefresh();
        onClearPreselection();
        if (i === queue.length - 1 && analyzeData.document) {
          await openReviewForDoc(analyzeData.document as UploadedDocumentRecord);
        }
      }
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'Smart upload failed.');
      await onWorkspaceRefresh();
    } finally {
      setAnalyzingDocId(null);
      setSmartUploading(false);
      setSmartPhase(null);
    }
  }

  async function handleDelete(doc: UploadedDocumentRecord) {
    setDeletingDocId(doc.id);
    try {
      const res = await authFetch(`/api/compliance/documents/${doc.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Unable to delete document.');
      await onWorkspaceRefresh();
      onShowToast?.('success', 'Document removed from private vault.');
    } catch (err: unknown) {
      onShowToast?.('error', err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeletingDocId(null);
    }
  }

  const reviewDoc = reviewDocId
    ? documents.find((d) => d.id === reviewDocId) || null
    : null;

  return (
    <div className="space-y-6">
      <input
        ref={smartFileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,image/jpg,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleSmartUpload(e.target.files);
          e.target.value = '';
        }}
      />

      {reviewDoc?.aiAnalysis && !reviewDoc.aiAnalysis.confirmedByUser && (
        <AiExtractionReviewPanel
          doc={reviewDoc}
          previewUrl={reviewPreviewUrl}
          onClose={() => {
            setReviewDocId(null);
            if (reviewPreviewUrl) URL.revokeObjectURL(reviewPreviewUrl);
            setReviewPreviewUrl(null);
          }}
          onConfirmed={async (payload) => {
            if (payload.business && onBusinessSynced) {
              onBusinessSynced(payload.business as BusinessProfile);
            }
            setReviewDocId(null);
            if (reviewPreviewUrl) URL.revokeObjectURL(reviewPreviewUrl);
            setReviewPreviewUrl(null);
            await onWorkspaceRefresh();
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* Header Bar */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
            Document Intelligence Vault
          </h2>
          <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5 max-w-2xl">
            Files uploaded here are private to your enterprise account and never published publicly. Uploaded documents remain{' '}
            <span className="font-semibold">Uploaded</span> or <span className="font-semibold">Pending review</span> unless verified by an authorised reviewer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={smartUploading}
            onClick={() => smartFileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {smartUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Smart Upload
          </button>
          <button
            type="button"
            onClick={openNewUpload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-[#191919] dark:text-[#E7E9EA] text-xs font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            Manual upload
          </button>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => !smartUploading && smartFileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!smartUploading) smartFileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!smartUploading) void handleSmartUpload(e.dataTransfer.files);
        }}
        className="bg-white dark:bg-[#16181C] border border-dashed border-[#0A66C2]/50 dark:border-[#1D9BF0]/50 rounded-xl p-6 text-center cursor-pointer hover:bg-[#F8FBFF] dark:hover:bg-[#1D9BF0]/5 transition-colors"
      >
        {smartUploading ? (
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[#0A66C2] dark:text-[#1D9BF0]">
            <Loader2 className="w-4 h-4 animate-spin" />
            {smartPhase || 'Processing document…'}
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Drop PDF, JPG, or PNG documents for TradeSquare reading &amp; auto form-fill
            </p>
            <p className="text-xs text-[#525866] dark:text-[#71767B] mt-1">
              TradeSquare must clearly understand the document and confirm it belongs to your
              business. Unrelated, fake, unclear, or duplicate uploads are answered with No.
            </p>
          </>
        )}
      </div>

      {/* Upload / Edit Form Panel */}
      {showUploadForm && (
        <form
          onSubmit={handleSaveUpload}
          className="bg-white dark:bg-[#16181C] border-2 border-[#0A66C2]/40 dark:border-[#1D9BF0]/40 rounded-xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#2F3336]">
            <div>
              <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                {editingDoc ? `Edit / Replace: ${editingDoc.title}` : 'Upload Compliance Document'}
              </h3>
              <p className="text-[11px] text-[#65676B] dark:text-[#71767B]">
                Supported formats: PDF, JPG, JPEG, PNG · Maximum size 8 MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowUploadForm(false);
                setEditingDoc(null);
                onClearPreselection();
              }}
              aria-label="Close upload form"
              className="w-8 h-8 rounded-lg text-[#65676B] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] flex items-center justify-center cursor-pointer"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Link to Checklist Requirement (Optional)
              </label>
              <select
                value={checklistRuleId}
                onChange={(e) => {
                  const id = e.target.value;
                  setChecklistRuleId(id);
                  const matched = checklist.find((c) => c.ruleId === id);
                  if (matched) {
                    setCategory(matched.category);
                    if (!documentType) setDocumentType(matched.documentName);
                    if (!title) setTitle(matched.documentName);
                    if (!issuingAuthority) setIssuingAuthority(matched.responsibleAuthority);
                  }
                }}
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              >
                <option value="">General Vault Document (Not linked to specific rule)</option>
                {checklist.map((item) => (
                  <option key={item.ruleId} value={item.ruleId}>
                    [{item.effectiveClassification}] {item.documentName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Document Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. RDB Certificate of Incorporation"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Document Type *
              </label>
              <input
                type="text"
                required
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="e.g. Business Registration Certificate"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Issuing Authority *
              </label>
              <input
                type="text"
                required
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                placeholder="e.g. Rwanda Development Board (RDB)"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Reference / Certificate Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Optional ID / Code"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Expiry Date (If Applicable)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Country of Issue
              </label>
              <input
                type="text"
                value={countryOfIssue}
                onChange={(e) => setCountryOfIssue(e.target.value)}
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                Related Product / Service Scope
              </label>
              <input
                type="text"
                value={relatedProductOrScope}
                onChange={(e) => setRelatedProductOrScope(e.target.value)}
                placeholder="e.g. Roasted Coffee Exports to Kenya"
                className="w-full min-h-[38px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1">
                {editingDoc ? 'Replace File (Optional · PDF/JPG/PNG <= 8 MB)' : 'Select File * (PDF, JPG, JPEG, PNG <= 8 MB)'}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-[#525866] dark:text-[#71767B] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E7F3FF] file:text-[#0A66C2] dark:file:bg-[#1D9BF0]/15 dark:file:text-[#1D9BF0] cursor-pointer"
              />
              {selectedFile && (
                <p className="text-[11px] text-emerald-700 dark:text-[#00BA7C] mt-1 tabular-nums">
                  Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] dark:border-[#2F3336]">
            <label className="inline-flex items-center gap-2 text-xs text-[#334155] dark:text-[#E7E9EA] cursor-pointer">
              <input
                type="checkbox"
                checked={submitForReview}
                onChange={(e) => setSubmitForReview(e.target.checked)}
                className="rounded border-slate-300 text-[#0A66C2]"
              />
              Mark status as &ldquo;Pending review&rdquo; for verification queue
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setEditingDoc(null);
                  onClearPreselection();
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#525866] dark:text-[#71767B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingDoc ? 'Save Document Changes' : 'Save to Private Vault'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-10 text-center">
          <FileText className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
            Your private compliance document vault is empty
          </p>
          <p className="text-xs text-[#525866] dark:text-[#71767B] mt-1 max-w-md mx-auto">
            Upload your Business Registration Certificate, RRA TIN/Tax Clearance, Sector Permits, or Standards Certificates to track validity and pre-screen metadata with AI.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const isFocused = focusedDocumentId === doc.id;
            const ai = doc.aiAnalysis;
            return (
              <div
                key={doc.id}
                className={`bg-white dark:bg-[#16181C] border rounded-xl p-5 transition-colors ${
                  isFocused
                    ? 'border-[#0A66C2] dark:border-[#1D9BF0] ring-2 ring-[#0A66C2]/15'
                    : 'border-[#E2E8F0] dark:border-[#2F3336]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <DocumentStatusBadge status={doc.status} />
                      <span className="text-[11px] font-medium text-[#525866] dark:text-[#71767B]">
                        {CATEGORY_LABELS[doc.category]} · {doc.countryOfIssue}
                      </span>
                      <span className="text-[11px] text-[#65676B] dark:text-[#71767B] tabular-nums">
                        {doc.fileName} ({formatBytes(doc.fileSizeBytes)})
                      </span>
                    </div>

                    <h3 className="text-[15px] font-semibold text-[#191919] dark:text-[#E7E9EA]">
                      {doc.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#525866] dark:text-[#71767B]">
                      <span>
                        <strong className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                          Authority:
                        </strong>{' '}
                        {doc.issuingAuthority}
                      </span>
                      {doc.referenceNumber && (
                        <span className="tabular-nums">
                          <strong className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                            Ref #:
                          </strong>{' '}
                          {doc.referenceNumber}
                        </span>
                      )}
                      {doc.issueDate && (
                        <span className="tabular-nums">
                          <strong className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                            Issued:
                          </strong>{' '}
                          {doc.issueDate}
                        </span>
                      )}
                      {doc.expiryDate && (
                        <span className="tabular-nums">
                          <strong className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                            Expires:
                          </strong>{' '}
                          {doc.expiryDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={analyzingDocId === doc.id}
                      onClick={() => handleAnalyzeWithAi(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7F3FF] hover:bg-[#D8EBFF] text-[#0A66C2] dark:bg-[#1D9BF0]/15 dark:hover:bg-[#1D9BF0]/25 dark:text-[#1D9BF0] text-xs font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {analyzingDocId === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {ai ? 'Re-Analyze AI' : 'Analyze with AI'}
                    </button>

                    <button
                      type="button"
                      disabled={previewLoadingId === doc.id}
                      onClick={() => handlePreview(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                    >
                      {previewLoadingId === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      Preview
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F8FAFC] dark:hover:bg-[#202327] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit / Replace
                    </button>

                    <button
                      type="button"
                      disabled={deletingDocId === doc.id}
                      onClick={() => handleDelete(doc)}
                      aria-label={`Delete ${doc.title}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-xs font-medium text-rose-600 dark:text-[#F4212E] hover:bg-rose-50 dark:hover:bg-[#F4212E]/10 cursor-pointer"
                    >
                      {deletingDocId === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Pre-Screening Extraction Box */}
                {ai && (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2F3336] bg-[#F8FAFC] dark:bg-[#000000] rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#0A66C2] dark:text-[#1D9BF0]" />
                        <span className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
                          AI Document Pre-Screening Extraction
                        </span>
                        {ai.confirmedByUser && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-[#00BA7C]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmed by User
                          </span>
                        )}
                      </div>

                      {!ai.confirmedByUser && (
                        <button
                          type="button"
                          onClick={() => void openReviewForDoc(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191919] dark:bg-[#E7E9EA] text-white dark:text-[#000000] text-xs font-semibold cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Review &amp; confirm fields
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[11px] text-[#65676B] dark:text-[#71767B] block">
                          Detected Type
                        </span>
                        <span className="font-medium text-[#191919] dark:text-[#E7E9EA]">
                          {ai.detectedDocumentType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#65676B] dark:text-[#71767B] block">
                          Extracted Authority
                        </span>
                        <span className="font-medium text-[#191919] dark:text-[#E7E9EA]">
                          {ai.extractedIssuingAuthority}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#65676B] dark:text-[#71767B] block">
                          Enterprise Name Check
                        </span>
                        <span
                          className={`font-semibold ${
                            ai.businessNameMatchesProfile
                              ? 'text-emerald-700 dark:text-[#00BA7C]'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {ai.extractedBusinessName
                            ? `${ai.extractedBusinessName} (${ai.businessNameMatchesProfile ? 'Matches profile' : 'Check alignment'})`
                            : ai.businessNameMatchesProfile
                              ? 'Consistent'
                              : 'Needs visual review'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#65676B] dark:text-[#71767B] block">
                          Extracted Dates / Ref
                        </span>
                        <span className="font-medium text-[#191919] dark:text-[#E7E9EA] tabular-nums">
                          {[ai.extractedReferenceNumber, ai.extractedIssueDate, ai.extractedExpiryDate]
                            .filter(Boolean)
                            .join(' · ') || 'Not printed'}
                        </span>
                      </div>
                    </div>

                    {(ai.expiryWarnings.length > 0 ||
                      ai.completenessIssues.length > 0 ||
                      ai.flaggedForHumanReview) && (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
                        {ai.flaggedForHumanReview && (
                          <p className="font-semibold flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Flagged for human verification check
                          </p>
                        )}
                        {[...ai.expiryWarnings, ...ai.completenessIssues, ...ai.reviewFlagReasons].map(
                          (warn, idx) => (
                            <p key={idx}>· {warn}</p>
                          )
                        )}
                      </div>
                    )}

                    <p className="text-[11px] text-[#65676B] dark:text-[#71767B] italic">
                      {ai.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Authenticated File Preview Modal */}
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
                  {previewState.doc.title}
                </h3>
                <p className="text-[11px] text-[#65676B] dark:text-[#71767B] truncate">
                  {previewState.doc.fileName} · Private Owner View
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewState.doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] text-xs font-medium text-[#191919] dark:text-[#E7E9EA] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(previewState.blobUrl);
                    setPreviewState(null);
                  }}
                  aria-label="Close preview"
                  className="w-8 h-8 rounded-lg hover:bg-[#F3F6F8] dark:hover:bg-[#202327] text-[#65676B] dark:text-[#E7E9EA] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#F8FAFC] dark:bg-[#000000] overflow-auto flex items-center justify-center p-4">
              {previewState.doc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewState.blobUrl}
                  title={previewState.doc.title}
                  className="w-full h-full rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] bg-white"
                />
              ) : (
                <img
                  src={previewState.blobUrl}
                  alt={previewState.doc.title}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

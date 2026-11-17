import type {
  DocumentCategory,
  DocumentStatus,
  RequirementClassification,
  SourceCategory,
} from '../../../types/compliance';

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  BUSINESS_REGISTRATION: 'Business Registration',
  TAX_STATUTORY: 'Tax & Statutory Compliance',
  SECTOR_LICENCES: 'Sector Licences & Permits',
  PRODUCT_CERTIFICATION: 'Product Certification & Quality',
  IMPORT_EXPORT: 'Import & Export Documents',
  PROCUREMENT_QUALIFICATION: 'Procurement & Supplier Qualification',
  EXPERIENCE_CREDIBILITY: 'Commercial Experience & Credibility',
};

export const CLASSIFICATION_META: Record<
  RequirementClassification,
  { label: string; dotClass: string; badgeClass: string; explanation: string }
> = {
  MANDATORY: {
    label: 'Mandatory',
    dotClass: 'bg-rose-600 dark:bg-[#F4212E]',
    badgeClass:
      'text-rose-700 bg-rose-50 border-rose-200 dark:text-[#F4212E] dark:bg-[#F4212E]/10 dark:border-[#F4212E]/30',
    explanation: 'Supported statutory requirement for this activity and jurisdiction.',
  },
  CONDITIONAL: {
    label: 'Conditional',
    dotClass: 'bg-amber-600 dark:bg-amber-400',
    badgeClass:
      'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30',
    explanation: 'Applies only when specific thresholds, product traits, or trade conditions are met.',
  },
  'BUYER-REQUIRED': {
    label: 'Buyer-Required',
    dotClass: 'bg-indigo-600 dark:bg-[#1D9BF0]',
    badgeClass:
      'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-[#1D9BF0] dark:bg-[#1D9BF0]/10 dark:border-[#1D9BF0]/30',
    explanation: 'Stipulated by a buyer contract, RFP, or tender document rather than universal law.',
  },
  RECOMMENDED: {
    label: 'Recommended',
    dotClass: 'bg-sky-600 dark:bg-sky-400',
    badgeClass:
      'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-500/10 dark:border-sky-500/30',
    explanation: 'Supports buyer trust, market access, or quality assurance; not universally mandatory.',
  },
  NOT_APPLICABLE: {
    label: 'Not Applicable',
    dotClass: 'bg-slate-400 dark:bg-[#71767B]',
    badgeClass:
      'text-slate-600 bg-slate-100 border-slate-200 dark:text-[#71767B] dark:bg-[#202327] dark:border-[#2F3336]',
    explanation: 'Marked not applicable to your current business scope.',
  },
  NEEDS_CONFIRMATION: {
    label: 'Needs Confirmation',
    dotClass: 'bg-orange-600 dark:bg-orange-400',
    badgeClass:
      'text-orange-800 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-500/10 dark:border-orange-500/30',
    explanation: 'Requires verification with the responsible national or destination authority.',
  },
};

export const STATUS_STYLE: Record<DocumentStatus, string> = {
  Missing:
    'text-[#65676B] bg-[#F0F2F5] border-[#D8DADF] dark:text-[#71767B] dark:bg-[#202327] dark:border-[#2F3336]',
  Uploaded:
    'text-[#0A66C2] bg-[#E7F3FF] border-[#B6D4FE] dark:text-[#1D9BF0] dark:bg-[#1D9BF0]/15 dark:border-[#1D9BF0]/30',
  'Pending review':
    'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30',
  Verified:
    'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-[#00BA7C] dark:bg-[#00BA7C]/10 dark:border-[#00BA7C]/30',
  Rejected:
    'text-rose-700 bg-rose-50 border-rose-200 dark:text-[#F4212E] dark:bg-[#F4212E]/10 dark:border-[#F4212E]/30',
  'Expiring soon':
    'text-orange-800 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-500/10 dark:border-orange-500/30',
  Expired:
    'text-rose-700 bg-rose-50 border-rose-200 dark:text-[#F4212E] dark:bg-[#F4212E]/10 dark:border-[#F4212E]/30',
  'Renewal required':
    'text-rose-700 bg-rose-50 border-rose-200 dark:text-[#F4212E] dark:bg-[#F4212E]/10 dark:border-[#F4212E]/30',
  'Not applicable':
    'text-slate-600 bg-slate-100 border-slate-200 dark:text-[#71767B] dark:bg-[#202327] dark:border-[#2F3336]',
};

export const SOURCE_CATEGORY_LABEL: Record<SourceCategory, string> = {
  Regulatory: 'Regulatory Authority',
  'Government Registration': 'Government Registry',
  'Trade Procedure': 'Official Trade Procedure',
  'Standards & Certification': 'Standards Body',
  Statistical: 'Statistical Reference Only',
  'Market Intelligence': 'Market Intelligence Only',
};

export function ClassificationBadge({
  classification,
}: {
  classification: RequirementClassification;
}) {
  const meta = CLASSIFICATION_META[classification];
  return (
    <span
      title={meta.explanation}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold tracking-tight whitespace-nowrap ${meta.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${STATUS_STYLE[status]}`}
    >
      {status}
    </span>
  );
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file payload.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

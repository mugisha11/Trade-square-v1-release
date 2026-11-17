import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Camera,
  CheckCircle2,
  FileCheck2,
  Globe2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type {
  BusinessCategory,
  BusinessProfile,
  OpportunityRecord,
  OpportunityType,
} from '../../types/workspace';
import { VerifiedBadge } from './VerifiedBadge';
import { authFetch } from '../../lib/authClient';
import { ComplianceCentre } from './compliance/ComplianceCentre';
import { ImageCropModal, type CropMediaKind } from './ImageCropModal';

type MediaKind = 'logo' | 'cover';

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;

interface MyBusinessViewProps {
  business: BusinessProfile;
  opportunities?: OpportunityRecord[];
  onOpenPublish?: (type?: OpportunityType) => void;
  onViewOpportunity?: (opp: OpportunityRecord) => void;
  onShowToast?: (kind: 'success' | 'error', text: string) => void;
  onUpdated: (updated: BusinessProfile) => void;
}

type MyBusinessTab =
  | 'overview'
  | 'products'
  | 'opportunities'
  | 'information'
  | 'verification'
  | 'compliance';

const BUSINESS_CATEGORIES: BusinessCategory[] = [
  'Buyer',
  'Supplier',
  'Manufacturer',
  'Distributor',
  'Importer / Exporter',
  'Agricultural Producer',
  'Cooperative',
  'Service Provider',
  'SME',
];

const inputClass =
  'w-full min-h-[42px] rounded-lg border border-[#CFD9DE] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]';

const labelClass =
  'block text-xs font-semibold text-[#666666] dark:text-[#A8A8A8] mb-1.5';

const cardClass =
  'bg-white dark:bg-[#16181C] border border-[#E0E0E0] dark:border-[#2F3336] rounded-xl overflow-hidden';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function MyBusinessView({
  business,
  opportunities = [],
  onOpenPublish,
  onViewOpportunity,
  onShowToast,
  onUpdated,
}: MyBusinessViewProps) {
  const [activeTab, setActiveTab] = useState<MyBusinessTab>('overview');
  const [name, setName] = useState(business.name);
  const [businessType, setBusinessType] = useState<BusinessCategory>(business.businessType);
  const [industry, setIndustry] = useState(business.industry);
  const [country, setCountry] = useState(business.country);
  const [city, setCity] = useState(business.city);
  const [description, setDescription] = useState(business.description);
  const [productsText, setProductsText] = useState(business.productsAndServices.join(', '));
  const [marketsText, setMarketsText] = useState(business.targetMarkets.join(', '));
  const [requirements, setRequirements] = useState(business.requirements);
  const [newProductInput, setNewProductInput] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<MediaKind | null>(null);
  const [cropSession, setCropSession] = useState<{
    kind: CropMediaKind;
    imageSrc: string;
  } | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(business.name);
    setBusinessType(business.businessType);
    setIndustry(business.industry);
    setCountry(business.country);
    setCity(business.city);
    setDescription(business.description);
    setProductsText(business.productsAndServices.join(', '));
    setMarketsText(business.targetMarkets.join(', '));
    setRequirements(business.requirements);
  }, [business]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    try {
      const res = await authFetch('/api/business/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          businessType,
          industry: industry.trim(),
          country: country.trim(),
          city: city.trim(),
          description: description.trim(),
          productsAndServices: productsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          targetMarkets: marketsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          requirements: requirements.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data.business);
        setSavedNotice(true);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    const clean = newProductInput.trim();
    if (!clean) return;
    if (business.productsAndServices.some((p) => p.toLowerCase() === clean.toLowerCase())) {
      setNewProductInput('');
      return;
    }
    setSavingProduct(true);
    try {
      const nextProducts = [...business.productsAndServices, clean];
      const res = await authFetch('/api/business/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productsAndServices: nextProducts }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data.business);
        setNewProductInput('');
      }
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleRemoveProduct(productName: string) {
    setSavingProduct(true);
    try {
      const nextProducts = business.productsAndServices.filter((p) => p !== productName);
      const res = await authFetch('/api/business/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productsAndServices: nextProducts }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data.business);
      }
    } finally {
      setSavingProduct(false);
    }
  }

  function openCropForFile(kind: MediaKind, file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      onShowToast?.('error', 'Use a JPG, PNG, or WebP image.');
      return;
    }
    const maxBytes = kind === 'cover' ? MAX_COVER_BYTES : MAX_LOGO_BYTES;
    if (file.size > maxBytes) {
      onShowToast?.(
        'error',
        kind === 'cover' ? 'Cover photo must be 5 MB or smaller.' : 'Logo must be 2 MB or smaller.'
      );
      return;
    }
    if (cropSession?.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropSession.imageSrc);
    }
    setCropSession({ kind, imageSrc: URL.createObjectURL(file) });
  }

  function closeCropSession() {
    if (cropSession?.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropSession.imageSrc);
    }
    setCropSession(null);
  }

  async function uploadCroppedMedia(kind: MediaKind, dataUrl: string, mimeType: string) {
    setUploadingMedia(kind);
    try {
      const res = await authFetch('/api/business/me/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          mimeType,
          base64Content: dataUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onShowToast?.(
          'error',
          typeof data.error === 'string' ? data.error : 'Unable to upload image.'
        );
        return;
      }
      onUpdated(data.business);
      onShowToast?.('success', kind === 'cover' ? 'Cover photo updated.' : 'Logo updated.');
      closeCropSession();
    } catch {
      onShowToast?.('error', 'Unable to upload image.');
    } finally {
      setUploadingMedia(null);
    }
  }

  async function handleMediaRemove(kind: MediaKind) {
    setUploadingMedia(kind);
    try {
      const res = await authFetch(`/api/business/me/media/${kind}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onShowToast?.(
          'error',
          typeof data.error === 'string' ? data.error : 'Unable to remove image.'
        );
        return;
      }
      onUpdated(data.business);
    } finally {
      setUploadingMedia(null);
    }
  }

  const myOpportunities = opportunities.filter((opp) => opp.isOwnOpportunity);
  const location = [business.city, business.country].filter(Boolean).join(', ');

  const navTabs: Array<{ id: MyBusinessTab; label: string }> = [
    { id: 'overview', label: 'About' },
    { id: 'products', label: 'Products' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'information', label: 'Edit profile' },
    { id: 'verification', label: 'Verification' },
    { id: 'compliance', label: 'Compliance' },
  ];

  return (
    <div className="max-w-[1128px] mx-auto space-y-2 pb-8">
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          openCropForFile('cover', e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          openCropForFile('logo', e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {cropSession && (
        <ImageCropModal
          kind={cropSession.kind}
          imageSrc={cropSession.imageSrc}
          onCancel={closeCropSession}
          onApply={async ({ dataUrl, mimeType }) => {
            await uploadCroppedMedia(cropSession.kind, dataUrl, mimeType);
          }}
        />
      )}

      <section className={`${cardClass} shadow-sm`}>
        <div className="relative group/cover h-[150px] sm:h-[201px] bg-[#A0B4B7] dark:bg-[#38444D] overflow-hidden">
          {business.coverUrl ? (
            <img
              src={business.coverUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A66C2] via-[#378FE9] to-[#B6D4FE]" />
          )}

          <div className="absolute top-3 right-3 flex items-center gap-2">
            {business.coverUrl && (
              <button
                type="button"
                disabled={uploadingMedia === 'cover'}
                onClick={() => void handleMediaRemove('cover')}
                className="h-8 w-8 rounded-full bg-white/95 dark:bg-[#16181C]/95 text-[#191919] dark:text-[#E7E9EA] shadow-md flex items-center justify-center hover:bg-white cursor-pointer disabled:opacity-60"
                aria-label="Remove cover photo"
                title="Remove cover photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              disabled={uploadingMedia === 'cover'}
              onClick={() => coverInputRef.current?.click()}
              className="h-8 px-3 rounded-full bg-white/95 dark:bg-[#16181C]/95 text-[#191919] dark:text-[#E7E9EA] shadow-md inline-flex items-center gap-1.5 text-sm font-semibold hover:bg-white cursor-pointer disabled:opacity-60"
              aria-label="Edit cover photo"
            >
              {uploadingMedia === 'cover' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Edit cover</span>
            </button>
          </div>
        </div>

        <div className="relative px-4 sm:px-6 pb-4">
          <div className="flex justify-between items-end -mt-[52px] sm:-mt-[72px] mb-3 sm:mb-2">
            <div className="relative group/logo">
              <div className="w-[104px] h-[104px] sm:w-[152px] sm:h-[152px] rounded-[8px] border-[4px] border-white dark:border-[#16181C] bg-[#F3F2EF] dark:bg-[#202327] shadow-sm overflow-hidden flex items-center justify-center">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={`${business.name} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-semibold text-[#0A66C2] dark:text-[#1D9BF0] tracking-tight">
                    {initials(business.name) || <Building2 className="w-12 h-12" />}
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={uploadingMedia === 'logo'}
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 sm:bottom-1 sm:right-1 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white dark:bg-[#16181C] border border-[#E0E0E0] dark:border-[#2F3336] shadow-md flex items-center justify-center text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F3F2EF] dark:hover:bg-[#202327] cursor-pointer disabled:opacity-60"
                aria-label="Edit logo"
                title="Edit logo"
              >
                {uploadingMedia === 'logo' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-[60px] sm:pt-[80px]">
              <button
                type="button"
                onClick={() => setActiveTab('information')}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('compliance')}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full border border-[#666666]/60 dark:border-[#A8A8A8] text-[#191919] dark:text-[#E7E9EA] text-sm font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-[#191919] dark:hover:border-[#E7E9EA] transition-colors cursor-pointer"
              >
                Compliance
              </button>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-[#666666]/60 dark:border-[#A8A8A8] text-[#191919] dark:text-[#E7E9EA] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] inline-flex items-center justify-center cursor-pointer"
                aria-label={business.logoUrl ? 'Remove logo' : 'Add logo'}
                title={business.logoUrl ? 'Remove logo' : 'Add logo'}
                onClick={() => {
                  if (business.logoUrl) void handleMediaRemove('logo');
                  else logoInputRef.current?.click();
                }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-[22px] sm:text-[24px] leading-tight font-semibold text-[#191919] dark:text-[#E7E9EA]">
                {business.name}
              </h1>
              {business.verifiedRecord && <VerifiedBadge size="md" showLabel={false} />}
            </div>

            <p className="mt-1 text-[15px] leading-snug text-[#191919] dark:text-[#E7E9EA] max-w-[720px]">
              {business.businessType}
              {business.industry ? ` · ${business.industry}` : ''}
            </p>

            <p className="mt-1 text-sm text-[#666666] dark:text-[#A8A8A8]">
              {location}
              {location && business.targetMarkets.length > 0 ? ' · ' : ''}
              {business.targetMarkets.length > 0 && (
                <span>
                  {business.targetMarkets.slice(0, 2).join(', ')}
                  {business.targetMarkets.length > 2
                    ? ` +${business.targetMarkets.length - 2}`
                    : ''}
                </span>
              )}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className="font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
              >
                {myOpportunities.length} opportunit{myOpportunities.length === 1 ? 'y' : 'ies'}
              </button>
              {business.productsAndServices.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
                >
                  {business.productsAndServices.length} product
                  {business.productsAndServices.length === 1 ? '' : 's'}
                </button>
              )}
            </div>
          </div>
        </div>

        <nav
          aria-label="Profile sections"
          className="px-2 sm:px-4 flex items-center gap-0 overflow-x-auto border-t border-[#E0E0E0] dark:border-[#2F3336]"
        >
          {navTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 sm:px-4 py-[14px] text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'text-[#191919] dark:text-[#E7E9EA]'
                    : 'text-[#666666] dark:text-[#A8A8A8] hover:text-[#191919] dark:hover:text-[#E7E9EA] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute left-2 right-2 bottom-0 h-[2.5px] rounded-t-sm bg-[#191919] dark:bg-[#E7E9EA]" />
                )}
              </button>
            );
          })}
        </nav>
      </section>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2">
          <div className="space-y-2">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#191919] dark:text-[#E7E9EA] whitespace-pre-wrap">
                {business.description || 'No description yet. Add one in Edit profile.'}
              </p>
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  Products & services
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="text-sm font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
                >
                  Manage
                </button>
              </div>
              {business.productsAndServices.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {business.productsAndServices.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 rounded-full bg-[#F3F2EF] dark:bg-[#202327] text-sm text-[#191919] dark:text-[#E7E9EA]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#666666] dark:text-[#A8A8A8]">None listed yet.</p>
              )}
            </section>

            {business.requirements && (
              <section className={`${cardClass} p-5 sm:p-6`}>
                <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  Looking for
                </h2>
                <p className="mt-3 text-sm text-[#191919] dark:text-[#E7E9EA]">
                  {business.requirements}
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-2">
            <section className={`${cardClass} p-5`}>
              <h3 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Markets
              </h3>
              {business.targetMarkets.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {business.targetMarkets.map((mkt) => (
                    <li
                      key={mkt}
                      className="text-sm text-[#191919] dark:text-[#E7E9EA] flex items-center gap-2"
                    >
                      <Globe2 className="w-3.5 h-3.5 text-[#666666] dark:text-[#A8A8A8] shrink-0" />
                      {mkt}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[#666666] dark:text-[#A8A8A8]">Not set.</p>
              )}
            </section>

            <section className={`${cardClass} p-5`}>
              <h3 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Details
              </h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-[#666666] dark:text-[#A8A8A8]">Role</dt>
                  <dd className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                    {business.businessType}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#666666] dark:text-[#A8A8A8]">Industry</dt>
                  <dd className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                    {business.industry || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#666666] dark:text-[#A8A8A8]">Location</dt>
                  <dd className="text-[#191919] dark:text-[#E7E9EA] font-medium">
                    {location || '—'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={`${cardClass} p-5`}>
              <h3 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Compliance
              </h3>
              <p className="mt-2 text-sm text-[#666666] dark:text-[#A8A8A8]">
                Documents, standards, and trade readiness.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('compliance')}
                className="mt-3 w-full h-8 rounded-full border border-[#0A66C2] dark:border-[#1D9BF0] text-[#0A66C2] dark:text-[#1D9BF0] text-sm font-semibold hover:bg-[#E8F3FF] dark:hover:bg-[#1D9BF0]/10 cursor-pointer"
              >
                Open centre
              </button>
            </section>
          </aside>
        </div>
      )}

      {activeTab === 'products' && (
        <section className={`${cardClass} p-5 sm:p-6 space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Products & services
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className="text-sm font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
            >
              HS codes & specs
            </button>
          </div>

          <form onSubmit={handleAddProduct} className="flex gap-2">
            <input
              type="text"
              value={newProductInput}
              onChange={(e) => setNewProductInput(e.target.value)}
              placeholder="Add a product or service"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="submit"
              disabled={savingProduct || !newProductInput.trim()}
              className="inline-flex items-center gap-1.5 h-[42px] px-4 rounded-full bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
            >
              {savingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </form>

          {business.productsAndServices.length === 0 ? (
            <p className="text-sm text-[#666666] dark:text-[#A8A8A8] py-8 text-center border border-dashed border-[#CFD9DE] dark:border-[#2F3336] rounded-xl">
              No products or services yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#E0E0E0] dark:divide-[#2F3336] border border-[#E0E0E0] dark:border-[#2F3336] rounded-xl">
              {business.productsAndServices.map((prod) => (
                <li key={prod} className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#191919] dark:text-[#E7E9EA]">
                    {prod}
                  </span>
                  <button
                    type="button"
                    disabled={savingProduct}
                    onClick={() => handleRemoveProduct(prod)}
                    aria-label={`Remove ${prod}`}
                    className="text-[#666666] hover:text-rose-600 dark:hover:text-[#F4212E] p-1.5 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'opportunities' && (
        <section className={`${cardClass} p-5 sm:p-6 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Opportunities
            </h2>
            {onOpenPublish && (
              <button
                type="button"
                onClick={() => onOpenPublish('Buyer Request')}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-sm font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Publish
              </button>
            )}
          </div>

          {myOpportunities.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#CFD9DE] dark:border-[#2F3336] rounded-xl">
              <p className="text-sm font-medium text-[#191919] dark:text-[#E7E9EA]">
                No opportunities published yet
              </p>
              <p className="text-sm text-[#666666] dark:text-[#A8A8A8] mt-1">
                Publish a request or offer to reach partners.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myOpportunities.map((opp) => (
                <article
                  key={opp.id}
                  className="p-4 rounded-xl border border-[#E0E0E0] dark:border-[#2F3336] bg-[#F9FAFB] dark:bg-[#000000] flex flex-col gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0]">
                      <span>{opp.type}</span>
                      <span className="text-[#666666] dark:text-[#A8A8A8] font-normal">
                        {opp.industry}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA] mt-1">
                      {opp.productOrService}
                    </h3>
                    <p className="text-sm text-[#666666] dark:text-[#A8A8A8] mt-1 line-clamp-2">
                      {opp.description}
                    </p>
                  </div>
                  {onViewOpportunity && (
                    <button
                      type="button"
                      onClick={() => onViewOpportunity(opp)}
                      className="text-left text-sm font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
                    >
                      View details
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'information' && (
        <section className={`${cardClass} p-5 sm:p-8 max-w-3xl`}>
          <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
            Edit profile
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A8A8A8] mt-1">
            Update how your business appears to partners.
          </p>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="biz-name" className={labelClass}>
                  Business name
                </label>
                <input
                  id="biz-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="biz-type" className={labelClass}>
                  Business role
                </label>
                <select
                  id="biz-type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessCategory)}
                  className={`${inputClass} bg-white dark:bg-[#000000]`}
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="biz-industry" className={labelClass}>
                  Industry
                </label>
                <input
                  id="biz-industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="biz-country" className={labelClass}>
                  Country
                </label>
                <input
                  id="biz-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="biz-city" className={labelClass}>
                  City
                </label>
                <input
                  id="biz-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="biz-desc" className={labelClass}>
                About
              </label>
              <textarea
                id="biz-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What your business does"
                className={`${inputClass} py-2.5 min-h-0`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="biz-products" className={labelClass}>
                  Products & services
                </label>
                <input
                  id="biz-products"
                  type="text"
                  value={productsText}
                  onChange={(e) => setProductsText(e.target.value)}
                  placeholder="Comma-separated"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="biz-markets" className={labelClass}>
                  Target markets
                </label>
                <input
                  id="biz-markets"
                  type="text"
                  value={marketsText}
                  onChange={(e) => setMarketsText(e.target.value)}
                  placeholder="Comma-separated"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="biz-req" className={labelClass}>
                Looking for
              </label>
              <input
                id="biz-req"
                type="text"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Partners, buyers, or suppliers you need"
                className={inputClass}
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              {savedNotice ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-[#00BA7C]">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'verification' && (
        <section className={`${cardClass} p-5 sm:p-8 max-w-3xl space-y-5`}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[#E8F3FF] dark:bg-[#1D9BF0]/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#0A66C2] dark:text-[#1D9BF0]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Verification
              </h2>
              <p className="mt-1 text-sm text-[#666666] dark:text-[#A8A8A8]">
                Status:{' '}
                <span className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  {business.verifiedRecord ? 'Verified' : 'Not verified'}
                </span>
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-[#191919] dark:text-[#E7E9EA] list-disc pl-5">
            <li>Uploads in Compliance are stored privately until reviewed.</li>
            <li>AI extraction can pre-fill fields; it does not grant verification.</li>
            <li>Official verification requires human or registry confirmation.</li>
          </ul>

          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-sm font-semibold cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            Upload documents
          </button>
        </section>
      )}

      {activeTab === 'compliance' && (
        <ComplianceCentre onBusinessSynced={onUpdated} onShowToast={onShowToast} />
      )}
    </div>
  );
}

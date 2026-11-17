import { useEffect, useState } from 'react';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  FileCheck2,
  Globe2,
  LayoutGrid,
  Loader2,
  MapPin,
  Package,
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

export function MyBusinessView({
  business,
  opportunities = [],
  onOpenPublish,
  onViewOpportunity,
  onShowToast,
  onUpdated,
}: MyBusinessViewProps) {
  const [activeTab, setActiveTab] = useState<MyBusinessTab>('overview');

  // Existing Business Information Form State (preserved)
  const [name, setName] = useState(business.name);
  const [businessType, setBusinessType] = useState<BusinessCategory>(business.businessType);
  const [industry, setIndustry] = useState(business.industry);
  const [country, setCountry] = useState(business.country);
  const [city, setCity] = useState(business.city);
  const [description, setDescription] = useState(business.description);
  const [productsText, setProductsText] = useState(business.productsAndServices.join(', '));
  const [marketsText, setMarketsText] = useState(business.targetMarkets.join(', '));
  const [requirements, setRequirements] = useState(business.requirements);

  // Quick Product Management State inside Products & Services tab
  const [newProductInput, setNewProductInput] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

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

  const myOpportunities = opportunities.filter((opp) => opp.isOwnOpportunity);

  const navTabs: Array<{ id: MyBusinessTab; label: string; icon: typeof LayoutGrid }> = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'products', label: 'Products & Services', icon: Package },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'information', label: 'Business Information', icon: Building2 },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'compliance', label: 'Compliance & Documents', icon: FileCheck2 },
  ];

  return (
    <div className="space-y-6">
      {/* Persistent Enterprise Header Banner & 6-Tab Sub-Navigation */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#2F3336]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-[#191919] dark:text-[#E7E9EA] truncate">
                {business.name}
              </h1>
              {business.verifiedRecord && <VerifiedBadge size="md" />}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#525866] dark:text-[#71767B]">
              <span>{business.businessType} · {business.industry}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {[business.city, business.country].filter(Boolean).join(', ')}
              </span>
              {business.targetMarkets.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5" />
                  Markets: {business.targetMarkets.join(', ')}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E7F3FF] hover:bg-[#D8EBFF] text-[#0A66C2] dark:bg-[#1D9BF0]/15 dark:hover:bg-[#1D9BF0]/25 dark:text-[#1D9BF0] text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              Open Compliance &amp; Readiness Centre
            </button>
          </div>
        </div>

        {/* 6-Tab Navigation Bar */}
        <nav
          aria-label="My Business sections"
          className="px-3 sm:px-5 py-1 flex items-center gap-1 overflow-x-auto bg-[#F8FAFC] dark:bg-[#000000]/60"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'text-[#0A66C2] dark:text-[#1D9BF0] bg-white dark:bg-[#16181C] shadow-xs'
                    : 'text-[#525866] dark:text-[#71767B] hover:text-[#191919] dark:hover:text-[#E7E9EA] hover:bg-white/60 dark:hover:bg-[#16181C]/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Enterprise Capability Overview
              </h2>
              <p className="mt-2 text-sm text-[#334155] dark:text-[#E7E9EA]/90 leading-relaxed">
                {business.description ||
                  'No overview statement added yet. Complete Business Information so regional buyers and institutional partners can evaluate your operational capacity.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2F3336]">
              <div>
                <p className="text-xs font-medium text-[#65676B] dark:text-[#71767B] mb-2">
                  Registered Products &amp; Services
                </p>
                {business.productsAndServices.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {business.productsAndServices.map((item) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 rounded-lg bg-[#F0F2F5] dark:bg-[#202327] text-xs font-medium text-[#191919] dark:text-[#E7E9EA]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#65676B] dark:text-[#71767B]">None added yet.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-[#65676B] dark:text-[#71767B] mb-2">
                  Target Markets
                </p>
                {business.targetMarkets.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {business.targetMarkets.map((mkt) => (
                      <span
                        key={mkt}
                        className="px-2.5 py-1 rounded-lg bg-[#E7F3FF] dark:bg-[#1D9BF0]/15 text-xs font-medium text-[#0A66C2] dark:text-[#1D9BF0]"
                      >
                        {mkt}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#65676B] dark:text-[#71767B]">No target markets selected.</p>
                )}
              </div>
            </div>

            {business.requirements && (
              <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#2F3336]">
                <p className="text-xs font-medium text-[#65676B] dark:text-[#71767B]">
                  Current Partner or Procurement Mandate
                </p>
                <p className="mt-1 text-sm text-[#191919] dark:text-[#E7E9EA]">
                  {business.requirements}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#0A66C2] dark:text-[#1D9BF0]" />
                <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  Compliance &amp; Trade Readiness
                </h3>
              </div>
              <p className="text-xs text-[#525866] dark:text-[#71767B] leading-relaxed">
                Identify mandatory registration, tax clearance, product standards (RSB S-Mark, Rwanda FDA), and destination import requirements tailored to your markets.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('compliance')}
                className="w-full py-2 px-3 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-xs font-semibold cursor-pointer"
              >
                Open Compliance &amp; Documents
              </button>
            </div>

            <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 space-y-2">
              <p className="text-xs font-medium text-[#65676B] dark:text-[#71767B]">
                Published Opportunities
              </p>
              <p className="text-2xl font-bold text-[#191919] dark:text-[#E7E9EA] tabular-nums">
                {myOpportunities.length}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className="text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
              >
                Manage your listings →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & SERVICES */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-6 space-y-5 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Products &amp; Services Catalog
              </h2>
              <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5">
                Products listed here automatically feed into your Compliance &amp; Documents requirements profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className="text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
            >
              Edit HS Codes &amp; Packaging Specs in Compliance →
            </button>
          </div>

          <form onSubmit={handleAddProduct} className="flex gap-2">
            <input
              type="text"
              value={newProductInput}
              onChange={(e) => setNewProductInput(e.target.value)}
              placeholder="Add product or service (e.g. Specialty Roasted Coffee, Corrugated Cartons)"
              className="flex-1 min-h-[40px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA]"
            />
            <button
              type="submit"
              disabled={savingProduct || !newProductInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
            >
              {savingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Item
            </button>
          </form>

          {business.productsAndServices.length === 0 ? (
            <p className="text-xs text-[#525866] dark:text-[#71767B] py-6 text-center border border-dashed border-[#CBD5E1] dark:border-[#2F3336] rounded-lg">
              No products or services registered yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-[#2F3336] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl">
              {business.productsAndServices.map((prod) => (
                <div
                  key={prod}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-medium text-[#191919] dark:text-[#E7E9EA]">
                    {prod}
                  </span>
                  <button
                    type="button"
                    disabled={savingProduct}
                    onClick={() => handleRemoveProduct(prod)}
                    aria-label={`Remove ${prod}`}
                    className="text-xs text-[#65676B] hover:text-rose-600 dark:hover:text-[#F4212E] p-1.5 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OPPORTUNITIES */}
      {activeTab === 'opportunities' && (
        <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Your Published Commercial Opportunities
              </h2>
              <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5">
                Active buyer requests, supplier offers, and partnership listings published by {business.name}.
              </p>
            </div>
            {onOpenPublish && (
              <button
                type="button"
                onClick={() => onOpenPublish('Buyer Request')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Publish Opportunity
              </button>
            )}
          </div>

          {myOpportunities.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#CBD5E1] dark:border-[#2F3336] rounded-xl">
              <p className="text-sm font-medium text-[#191919] dark:text-[#E7E9EA]">
                No opportunities published by your business yet
              </p>
              <p className="text-xs text-[#525866] dark:text-[#71767B] mt-1">
                Publish a sourcing mandate or supplier offer to connect with verified regional enterprises.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#0A66C2] dark:text-[#1D9BF0]">
                      <span>{opp.type}</span>
                      <span className="text-[#65676B] dark:text-[#71767B] font-normal">
                        {opp.industry}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA] mt-1">
                      {opp.productOrService}
                    </h3>
                    <p className="text-xs text-[#525866] dark:text-[#71767B] mt-1 line-clamp-2">
                      {opp.description}
                    </p>
                  </div>

                  {onViewOpportunity && (
                    <button
                      type="button"
                      onClick={() => onViewOpportunity(opp)}
                      className="text-left text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
                    >
                      View listing details →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BUSINESS INFORMATION (PRESERVED EXISTING PROFILE FORM) */}
      {activeTab === 'information' && (
        <div className="max-w-3xl bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Business Information
            </h2>
            {business.verifiedRecord && <VerifiedBadge size="md" />}
          </div>
          <p className="text-sm text-[#525866] dark:text-[#71767B] mt-1">
            Keep your capabilities, products, and regional market focus up to date so relevant buyers and
            suppliers can discover your enterprise.
          </p>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="biz-name"
                  className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
                >
                  Business Name
                </label>
                <input
                  id="biz-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
                />
              </div>

              <div>
                <label
                  htmlFor="biz-type"
                  className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
                >
                  Business Role
                </label>
                <select
                  id="biz-type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessCategory)}
                  className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
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
                <label
                  htmlFor="biz-industry"
                  className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
                >
                  Industry
                </label>
                <input
                  id="biz-industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
                />
              </div>

              <div>
                <label
                  htmlFor="biz-country"
                  className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
                >
                  Country
                </label>
                <input
                  id="biz-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
                />
              </div>

              <div>
                <label
                  htmlFor="biz-city"
                  className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
                >
                  City
                </label>
                <input
                  id="biz-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="biz-desc"
                className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
              >
                Business Overview
              </label>
              <textarea
                id="biz-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your production capacity, certifications, or sourcing mandate..."
                className="w-full rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 py-2.5 text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="biz-products"
                  className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
                >
                  Products &amp; Services (comma-separated)
                </label>
                <input
                  id="biz-products"
                  type="text"
                  value={productsText}
                  onChange={(e) => setProductsText(e.target.value)}
                  placeholder="e.g. Specialty Coffee, Corrugated Cartons"
                  className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
                />
              </div>

              <div>
                <label
                  htmlFor="biz-markets"
                  className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
                >
                  Target Regional Markets (comma-separated)
                </label>
                <input
                  id="biz-markets"
                  type="text"
                  value={marketsText}
                  onChange={(e) => setMarketsText(e.target.value)}
                  placeholder="e.g. Rwanda, Kenya, Uganda"
                  className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="biz-req"
                className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
              >
                Current Partner or Procurement Requirements
              </label>
              <input
                id="biz-req"
                type="text"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g. Seeking regional cold-chain haulage partners or bulk packaging buyers"
                className="w-full min-h-[42px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 text-sm text-[#191919] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              {savedNotice ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-[#00BA7C]">
                  <CheckCircle2 className="w-4 h-4" />
                  Business profile saved
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="max-w-3xl bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#0A66C2] dark:text-[#1D9BF0]" />
            <div>
              <h2 className="text-lg font-semibold text-[#191919] dark:text-[#E7E9EA]">
                Enterprise Verification Status
              </h2>
              <p className="text-xs text-[#525866] dark:text-[#71767B]">
                Current status:{' '}
                <strong className="text-[#191919] dark:text-[#E7E9EA]">
                  {business.verifiedRecord ? 'Verified TradeSquare Record' : 'Standard Unverified Member'}
                </strong>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] space-y-2 text-xs text-[#334155] dark:text-[#E7E9EA]/90 leading-relaxed">
            <p className="font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Separation of File Upload, AI Pre-Screening &amp; Official Verification
            </p>
            <p>
              · Uploading a PDF or image inside <strong>Compliance &amp; Documents</strong> stores it privately with status <strong>Uploaded</strong> or <strong>Pending review</strong>.
            </p>
            <p>
              · Gemini AI document extraction assists with field pre-filling and expiry checks, but never grants official verification.
            </p>
            <p>
              · Verification requires manual human review or authoritative registry confirmation against official portals (such as RDB ORG or RRA).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] text-white text-xs font-semibold cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            Upload Statutory Documents in Compliance &amp; Documents
          </button>
        </div>
      )}

      {/* TAB 6: COMPLIANCE & DOCUMENTS */}
      {activeTab === 'compliance' && (
        <ComplianceCentre
          onBusinessSynced={onUpdated}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}

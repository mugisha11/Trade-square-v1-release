import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import type {
  BusinessActivity,
  BusinessRequirementsProfile,
  CountryRegistryEntry,
  LegalStructureCode,
  StructuredProductItem,
} from '../../../types/compliance';

interface RequirementsProfileTabProps {
  profile: BusinessRequirementsProfile;
  countryRegistry: CountryRegistryEntry[];
  onSaveProfile: (updated: BusinessRequirementsProfile) => Promise<void>;
}

const ALL_ACTIVITIES: BusinessActivity[] = [
  'Domestic sales',
  'Wholesale',
  'Retail',
  'Manufacturing',
  'Processing',
  'Distribution',
  'Importing',
  'Exporting',
  'Government procurement',
  'Private procurement',
  'Contract services',
  'International partnerships',
];

const INDUSTRY_OPTIONS = [
  'Agriculture',
  'Food processing',
  'Agro-Processing',
  'Manufacturing',
  'Industrial Packaging',
  'Construction & Materials',
  'ICT and software',
  'Transportation and logistics',
  'Healthcare',
  'Education',
  'Tourism and hospitality',
  'Retail and wholesale',
  'Professional services',
  'Mining',
  'General Trade & Manufacturing',
];

const PRODUCT_TYPE_OPTIONS: StructuredProductItem['productType'][] = [
  'Physical Good',
  'Processed Food / Beverage',
  'Raw Agricultural Commodity',
  'Industrial / Packaging Input',
  'Software / Digital Service',
  'Construction / Contracting Service',
  'Professional / Logistics Service',
];

const PRESET_MARKETS = [
  'Rwanda',
  'Kenya',
  'Uganda',
  'Tanzania',
  'DR Congo',
  'Ghana',
  'Nigeria',
  'South Africa',
  'European Union',
];

export function RequirementsProfileTab({
  profile,
  countryRegistry,
  onSaveProfile,
}: RequirementsProfileTabProps) {
  const [registrationCountry, setRegistrationCountry] = useState(profile.registrationCountry);
  const [operationCountry, setOperationCountry] = useState(profile.operationCountry);
  const [establishmentCountry, setEstablishmentCountry] = useState(profile.establishmentCountry);
  const [legalStructure, setLegalStructure] = useState<LegalStructureCode>(profile.legalStructure);
  const [industry, setIndustry] = useState(profile.industry);
  const [activities, setActivities] = useState<BusinessActivity[]>(profile.activities);
  const [products, setProducts] = useState<StructuredProductItem[]>(profile.products);
  const [targetMarkets, setTargetMarkets] = useState<string[]>(profile.targetMarkets);
  const [customMarket, setCustomMarket] = useState('');
  const [buyerSpecificNotes, setBuyerSpecificNotes] = useState(profile.buyerSpecificNotes);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setRegistrationCountry(profile.registrationCountry);
    setOperationCountry(profile.operationCountry);
    setEstablishmentCountry(profile.establishmentCountry);
    setLegalStructure(profile.legalStructure);
    setIndustry(profile.industry);
    setActivities(profile.activities);
    setProducts(profile.products);
    setTargetMarkets(profile.targetMarkets);
    setBuyerSpecificNotes(profile.buyerSpecificNotes);
  }, [profile]);

  const activeCountryEntry = useMemo(() => {
    return (
      countryRegistry.find(
        (c) => c.name.toLowerCase() === registrationCountry.trim().toLowerCase()
      ) ?? countryRegistry[0]
    );
  }, [countryRegistry, registrationCountry]);

  function toggleActivity(act: BusinessActivity) {
    setActivities((prev) =>
      prev.includes(act) ? prev.filter((item) => item !== act) : [...prev, act]
    );
  }

  function toggleMarket(market: string) {
    setTargetMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
    );
  }

  function addCustomMarket() {
    const clean = customMarket.trim();
    if (!clean) return;
    if (!targetMarkets.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      setTargetMarkets((prev) => [...prev, clean]);
    }
    setCustomMarket('');
  }

  function addEmptyProduct() {
    setProducts((prev) => [
      ...prev,
      {
        id: `prod_${Date.now()}`,
        name: '',
        category: industry,
        productType: 'Physical Good',
        hsCodeConfidence: 'Not Established',
      },
    ]);
  }

  function updateProduct(id: string, patch: Partial<StructuredProductItem>) {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...patch };
        if ('hsCode' in patch) {
          next.hsCodeConfidence = patch.hsCode?.trim() ? 'Confirmed' : 'Not Established';
        }
        return next;
      })
    );
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    try {
      await onSaveProfile({
        ...profile,
        registrationCountry,
        operationCountry,
        establishmentCountry,
        legalStructure,
        industry,
        activities,
        products: products.filter((p) => p.name.trim().length > 0),
        targetMarkets,
        buyerSpecificNotes,
      });
      setSavedNotice(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* A, B, C: Country, Legal Structure & Industry */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
            Jurisdiction, Legal Structure &amp; Sector
          </h2>
          <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5">
            Legal entity form and country jurisdiction dynamically determine statutory registration, tax, and sector licensing rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="req-reg-country"
              className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
            >
              Country of Registration
            </label>
            <select
              id="req-reg-country"
              value={registrationCountry}
              onChange={(e) => setRegistrationCountry(e.target.value)}
              className="w-full min-h-[40px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA]"
            >
              {countryRegistry
                .filter((c) => c.phaseCoverage !== 'Destination Ruleset')
                .map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name} ({c.phaseCoverage})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="req-op-country"
              className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
            >
              Country of Operation
            </label>
            <select
              id="req-op-country"
              value={operationCountry}
              onChange={(e) => setOperationCountry(e.target.value)}
              className="w-full min-h-[40px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA]"
            >
              {countryRegistry
                .filter((c) => c.phaseCoverage !== 'Destination Ruleset')
                .map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="req-est-country"
              className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
            >
              Physical Establishment Country
            </label>
            <select
              id="req-est-country"
              value={establishmentCountry}
              onChange={(e) => setEstablishmentCountry(e.target.value)}
              className="w-full min-h-[40px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA]"
            >
              {countryRegistry
                .filter((c) => c.phaseCoverage !== 'Destination Ruleset')
                .map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="req-legal-structure"
              className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
            >
              Legal Structure ({activeCountryEntry?.name ?? registrationCountry})
            </label>
            <select
              id="req-legal-structure"
              value={legalStructure}
              onChange={(e) => setLegalStructure(e.target.value as LegalStructureCode)}
              className="w-full min-h-[40px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA]"
            >
              {(activeCountryEntry?.legalStructures ?? []).map((ls) => (
                <option key={ls.code} value={ls.code}>
                  {ls.label}
                </option>
              ))}
            </select>
            {activeCountryEntry && (
              <p className="text-[11px] text-[#65676B] dark:text-[#71767B] mt-1">
                {
                  activeCountryEntry.legalStructures.find((l) => l.code === legalStructure)
                    ?.localExamples
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="req-industry"
              className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
            >
              Primary Industry
            </label>
            <select
              id="req-industry"
              value={INDUSTRY_OPTIONS.includes(industry) ? industry : 'OTHER'}
              onChange={(e) => {
                if (e.target.value !== 'OTHER') setIndustry(e.target.value);
              }}
              className="w-full min-h-[40px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3 text-sm text-[#191919] dark:text-[#E7E9EA]"
            >
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
              {!INDUSTRY_OPTIONS.includes(industry) && (
                <option value="OTHER">{industry}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* E & F: Business Activities & Target Markets */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
            Business Activities &amp; Destination Markets
          </h2>
          <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5">
            Select all activities your business conducts. Destination markets separately trigger import conformity and rules-of-origin requirements.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-2">
            Active Business Operations
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {ALL_ACTIVITIES.map((act) => {
              const checked = activities.includes(act);
              return (
                <label
                  key={act}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    checked
                      ? 'bg-[#E7F3FF] border-[#B6D4FE] text-[#0A66C2] dark:bg-[#1D9BF0]/15 dark:border-[#1D9BF0]/40 dark:text-[#1D9BF0]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] dark:bg-[#000000] dark:border-[#2F3336] dark:text-[#E7E9EA]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleActivity(act)}
                    className="rounded border-slate-300 text-[#0A66C2] focus:ring-[#0A66C2]"
                  />
                  <span className="truncate">{act}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2F3336]">
          <p className="text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-2">
            Target &amp; Destination Markets
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from(new Set([...PRESET_MARKETS, ...targetMarkets])).map((market) => {
              const active = targetMarkets.includes(market);
              return (
                <button
                  key={market}
                  type="button"
                  onClick={() => toggleMarket(market)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0A66C2] border-[#0A66C2] text-white dark:bg-[#1D9BF0] dark:border-[#1D9BF0]'
                      : 'bg-white border-[#CBD5E1] text-[#334155] dark:bg-[#000000] dark:border-[#2F3336] dark:text-[#E7E9EA]'
                  }`}
                >
                  {market}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={customMarket}
              onChange={(e) => setCustomMarket(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomMarket();
                }
              }}
              placeholder="Add another destination country (e.g. Zambia, UAE, UK)"
              className="flex-1 min-h-[36px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
            />
            <button
              type="button"
              onClick={addCustomMarket}
              className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] text-xs font-medium text-[#191919] dark:text-[#E7E9EA] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] cursor-pointer"
            >
              Add Market
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2F3336]">
          <label
            htmlFor="req-buyer-notes"
            className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1.5"
          >
            Buyer-Specific or Tender Qualification Requirements (Optional)
          </label>
          <textarea
            id="req-buyer-notes"
            rows={2}
            value={buyerSpecificNotes}
            onChange={(e) => setBuyerSpecificNotes(e.target.value)}
            placeholder="e.g. Major buyer requires ISO 22000 audit report, Umucyo public tender requires 5% bid security and 2 previous completion certificates..."
            className="w-full rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] px-3.5 py-2 text-xs text-[#191919] dark:text-[#E7E9EA]"
          />
          <p className="text-[11px] text-[#65676B] dark:text-[#71767B] mt-1">
            Items entered here generate a <span className="font-semibold">BUYER-REQUIRED</span> checklist entry without confusing buyer terms with statutory law.
          </p>
        </div>
      </div>

      {/* D: Structured Products & Services */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
              Structured Products &amp; Services Specifications
            </h2>
            <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5">
              Synced with your My Business profile. Leave HS Code blank unless confidently confirmed by customs or your clearing agent.
            </p>
          </div>
          <button
            type="button"
            onClick={addEmptyProduct}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product / Service
          </button>
        </div>

        {products.length === 0 ? (
          <div className="p-6 rounded-lg bg-[#F8FAFC] dark:bg-[#000000] border border-dashed border-[#CBD5E1] dark:border-[#2F3336] text-center">
            <p className="text-xs text-[#525866] dark:text-[#71767B]">
              No structured products added yet. Add a product or service to unlock commodity-specific certification and export rules (such as RSB S-Mark, Rwanda FDA, NAEB, or Phytosanitary).
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#525866] dark:text-[#71767B] mb-1">
                      Product / Service Name
                    </label>
                    <input
                      type="text"
                      value={prod.name}
                      onChange={(e) => updateProduct(prod.id, { name: e.target.value })}
                      placeholder="e.g. Roasted Arabica Coffee"
                      className="w-full min-h-[36px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#16181C] px-3 text-xs text-[#191919] dark:text-[#E7E9EA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#525866] dark:text-[#71767B] mb-1">
                      Product Type
                    </label>
                    <select
                      value={prod.productType}
                      onChange={(e) =>
                        updateProduct(prod.id, {
                          productType: e.target.value as StructuredProductItem['productType'],
                        })
                      }
                      className="w-full min-h-[36px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#16181C] px-2.5 text-xs text-[#191919] dark:text-[#E7E9EA]"
                    >
                      {PRODUCT_TYPE_OPTIONS.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-[#525866] dark:text-[#71767B] mb-1">
                        Confirmed HS Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={prod.hsCode ?? ''}
                        onChange={(e) => updateProduct(prod.id, { hsCode: e.target.value })}
                        placeholder="Leave blank if unconfirmed"
                        className="w-full min-h-[36px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#16181C] px-3 text-xs text-[#191919] dark:text-[#E7E9EA] tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(prod.id)}
                      aria-label={`Remove ${prod.name || 'product'}`}
                      className="w-9 h-9 rounded-lg border border-[#E2E8F0] dark:border-[#2F3336] text-[#65676B] hover:text-rose-600 dark:hover:text-[#F4212E] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#525866] dark:text-[#71767B] mb-1">
                      Ingredients / Materials
                    </label>
                    <input
                      type="text"
                      value={prod.materialsOrIngredients ?? ''}
                      onChange={(e) =>
                        updateProduct(prod.id, { materialsOrIngredients: e.target.value })
                      }
                      placeholder="e.g. 100% highland arabica"
                      className="w-full min-h-[34px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#16181C] px-2.5 text-xs text-[#191919] dark:text-[#E7E9EA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#525866] dark:text-[#71767B] mb-1">
                      Intended Use &amp; Target Customers
                    </label>
                    <input
                      type="text"
                      value={prod.intendedUse ?? ''}
                      onChange={(e) => updateProduct(prod.id, { intendedUse: e.target.value })}
                      placeholder="e.g. Retail / Hospitality buyers"
                      className="w-full min-h-[34px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#16181C] px-2.5 text-xs text-[#191919] dark:text-[#E7E9EA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#525866] dark:text-[#71767B] mb-1">
                      Production Method &amp; Capacity
                    </label>
                    <input
                      type="text"
                      value={prod.productionMethod ?? ''}
                      onChange={(e) =>
                        updateProduct(prod.id, { productionMethod: e.target.value })
                      }
                      placeholder="e.g. Washed & drum-roasted"
                      className="w-full min-h-[34px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#16181C] px-2.5 text-xs text-[#191919] dark:text-[#E7E9EA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#525866] dark:text-[#71767B] mb-1">
                      Packaging Type
                    </label>
                    <input
                      type="text"
                      value={prod.packagingType ?? ''}
                      onChange={(e) => updateProduct(prod.id, { packagingType: e.target.value })}
                      placeholder="e.g. Valve foil bags / Bulk jute"
                      className="w-full min-h-[34px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#16181C] px-2.5 text-xs text-[#191919] dark:text-[#E7E9EA]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] dark:border-[#2F3336]">
          {savedNotice ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-[#00BA7C]">
              <CheckCircle2 className="w-4 h-4" />
              Requirements profile saved and checklist recalculated
            </span>
          ) : (
            <span className="text-xs text-[#65676B] dark:text-[#71767B]">
              Saving updates your personalised checklist immediately.
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save &amp; Regenerate Checklist
          </button>
        </div>
      </div>
    </form>
  );
}

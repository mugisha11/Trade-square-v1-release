export const TS_OPP_MODEL_ID = 'tradesquare-opportunity-assist-v1';
export const TS_OPP_MODEL_LABEL = 'TradeSquare Opportunity Intelligence';

export const UNIT_ALIASES: Array<{ pattern: RegExp; unit: string }> = [
  { pattern: /\b(metric\s*tons?|tonnes?|mts?|t)\b/i, unit: 'MT' },
  { pattern: /\b(kilograms?|kgs?)\b/i, unit: 'kg' },
  { pattern: /\b(litres?|liters?|l)\b/i, unit: 'L' },
  { pattern: /\b(pieces?|pcs?|units?)\b/i, unit: 'units' },
  { pattern: /\b(cartons?|boxes|bags|sacks)\b/i, unit: 'cartons' },
  { pattern: /\b(containers?|teus?|20ft|40ft)\b/i, unit: 'containers' },
  { pattern: /\b(pallets?)\b/i, unit: 'pallets' },
  { pattern: /\b(hours?|hrs?)\b/i, unit: 'hours' },
  { pattern: /\b(days?)\b/i, unit: 'days' },
  { pattern: /\b(months?)\b/i, unit: 'months' },
];

export const CURRENCY_ALIASES: Array<{ pattern: RegExp; currency: string }> = [
  { pattern: /\b(usd|us\$|\$|dollars?)\b/i, currency: 'USD' },
  { pattern: /\b(rwf|frw|rwandan\s*francs?)\b/i, currency: 'RWF' },
  { pattern: /\b(eur|euros?)\b/i, currency: 'EUR' },
  { pattern: /\b(kes|kenyan\s*shillings?)\b/i, currency: 'KES' },
  { pattern: /\b(ugx|ugandan\s*shillings?)\b/i, currency: 'UGX' },
  { pattern: /\b(tzs|tanzanian\s*shillings?)\b/i, currency: 'TZS' },
];

export const LOCATION_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bkigali\b/i, label: 'Kigali' },
  { pattern: /\brwanda\b/i, label: 'Rwanda' },
  { pattern: /\bkampala\b/i, label: 'Kampala' },
  { pattern: /\buganda\b/i, label: 'Uganda' },
  { pattern: /\bnairobi\b/i, label: 'Nairobi' },
  { pattern: /\bkenya\b/i, label: 'Kenya' },
  { pattern: /\bdar\s*es\s*salaam\b/i, label: 'Dar es Salaam' },
  { pattern: /\btanzania\b/i, label: 'Tanzania' },
  { pattern: /\bbujumbura\b/i, label: 'Bujumbura' },
  { pattern: /\bburundi\b/i, label: 'Burundi' },
  { pattern: /\bgoma\b/i, label: 'Goma' },
  { pattern: /\bkinshasa\b/i, label: 'Kinshasa' },
  { pattern: /\bdrc\b|\bcongo\b/i, label: 'DRC' },
  { pattern: /\beast\s*africa\b|\beac\b/i, label: 'East Africa' },
  { pattern: /\bcomesa\b/i, label: 'COMESA' },
];

export const CATEGORY_RULES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\b(carton|packaging|corrugat|label|bottle|pouch)\b/i, category: 'Packaging' },
  { pattern: /\b(coffee|arabica|robusta|green\s*beans?)\b/i, category: 'Agricultural Commodities' },
  { pattern: /\b(tea|pyrethrum|avocado|maize|beans|cassava|rice)\b/i, category: 'Agricultural Commodities' },
  { pattern: /\b(textile|garment|apparel|fabric|cotton)\b/i, category: 'Textiles & Apparel' },
  { pattern: /\b(cement|steel|iron|construction|timber|hardware)\b/i, category: 'Construction Materials' },
  { pattern: /\b(pharma|medicine|medical|hospital)\b/i, category: 'Pharmaceuticals & Health' },
  { pattern: /\b(solar|battery|inverter|energy|electric)\b/i, category: 'Energy & Electrical' },
  { pattern: /\b(logistics|freight|transport|warehouse|clearing)\b/i, category: 'Logistics & Transport' },
  { pattern: /\b(ict|software|it\s*service|digital)\b/i, category: 'ICT & Digital Services' },
  { pattern: /\b(food[- ]grade)\b/i, category: 'Packaging' },
  { pattern: /\b(food|beverage|dairy|processing)\b/i, category: 'Food & Beverage' },
  { pattern: /\b(machine|equipment|spare\s*parts?|industrial)\b/i, category: 'Industrial Equipment' },
];

export const CERT_RULES: Array<{ pattern: RegExp; suggestion: string; reason: string }> = [
  {
    pattern: /\b(food|beverage|dairy|coffee|tea|export\s*food)\b/i,
    suggestion: 'HACCP / ISO 22000 (food safety) — suggest only if applicable',
    reason: 'Food-related trade often requires documented food-safety controls for buyers.',
  },
  {
    pattern: /\b(organic)\b/i,
    suggestion: 'Organic certification (recognized scheme for target market)',
    reason: 'Organic claims require verifiable certification before listing.',
  },
  {
    pattern: /\b(export|phytosanitary|plant|avocado|coffee|tea)\b/i,
    suggestion: 'Phytosanitary certificate / Certificate of Origin (when exporting plants/agri goods)',
    reason: 'Cross-border agri shipments commonly need phytosanitary and origin documents.',
  },
  {
    pattern: /\b(pharma|medicine|medical)\b/i,
    suggestion: 'Product registration / GDP or GDP-aligned distribution evidence',
    reason: 'Health products are tightly regulated in regional markets.',
  },
  {
    pattern: /\b(packaging|food[- ]grade)\b/i,
    suggestion: 'Food-contact / material safety documentation where required',
    reason: 'Buyers of food-grade packaging typically ask for material compliance evidence.',
  },
  {
    pattern: /\b(iso\s*9001|quality\s*management)\b/i,
    suggestion: 'ISO 9001 quality management (if already held)',
    reason: 'Mentioned quality systems should be backed by real certificates.',
  },
];

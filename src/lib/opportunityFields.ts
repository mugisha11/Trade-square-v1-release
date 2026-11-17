import type { OpportunityType } from '../types/workspace';

export const OPPORTUNITY_TYPE_OPTIONS: Array<{
  value: OpportunityType;
  label: string;
  description: string;
  side: 'demand' | 'supply' | 'partner';
}> = [
  {
    value: 'Buyer Request',
    label: 'Buying Request',
    description: 'You need a product or service and want qualified suppliers to respond.',
    side: 'demand',
  },
  {
    value: 'Supplier Offer',
    label: 'Supplier Offer',
    description: 'You have products or capacity to offer to buyers and distributors.',
    side: 'supply',
  },
  {
    value: 'Distribution',
    label: 'Distribution Opportunity',
    description: 'You are seeking distributors, agents or channel partners.',
    side: 'partner',
  },
  {
    value: 'Partnership',
    label: 'Business Partnership',
    description: 'You want to form a commercial partnership or joint venture.',
    side: 'partner',
  },
  {
    value: 'Procurement',
    label: 'Tender / Procurement',
    description: 'Formal procurement or tender with defined requirements and deadline.',
    side: 'demand',
  },
  {
    value: 'Export Opportunity',
    label: 'Export Opportunity',
    description: 'You are offering goods for export into new markets.',
    side: 'supply',
  },
  {
    value: 'Service Request',
    label: 'Service Request',
    description: 'You need a professional or trade service from qualified providers.',
    side: 'demand',
  },
];

export type FieldKey =
  | 'productOrService'
  | 'industry'
  | 'description'
  | 'technicalSpecs'
  | 'qualityRequirements'
  | 'quantity'
  | 'unit'
  | 'quantityAndSpecs'
  | 'capacity'
  | 'moq'
  | 'budgetOrPrice'
  | 'currency'
  | 'paymentTerms'
  | 'priceNegotiable'
  | 'originLocation'
  | 'destinationMarket'
  | 'deliveryTimeline'
  | 'deadline'
  | 'requiredCertifications'
  | 'eligibilityRequirements'
  | 'preferredPartnerTraits'
  | 'contactPreference'
  | 'showPublicContact';

export type FieldImportance = 'mandatory' | 'recommended' | 'optional';

export interface FieldDefinition {
  key: FieldKey;
  label: string;
  importance: FieldImportance;
  help?: string;
}

const BASE_INFO: FieldDefinition[] = [
  { key: 'productOrService', label: 'Opportunity title', importance: 'mandatory' },
  { key: 'industry', label: 'Product / service category', importance: 'mandatory' },
  { key: 'description', label: 'Description', importance: 'mandatory' },
  { key: 'technicalSpecs', label: 'Technical specifications', importance: 'recommended' },
  { key: 'qualityRequirements', label: 'Quality and standards', importance: 'recommended' },
];

const COMMERCIAL_COMMON: FieldDefinition[] = [
  { key: 'originLocation', label: 'Origin / location', importance: 'recommended' },
  { key: 'destinationMarket', label: 'Target markets / delivery destination', importance: 'recommended' },
  { key: 'deliveryTimeline', label: 'Delivery or fulfilment timeline', importance: 'recommended' },
  { key: 'deadline', label: 'Closing deadline', importance: 'recommended' },
  { key: 'requiredCertifications', label: 'Required certifications and documentation', importance: 'optional' },
  { key: 'eligibilityRequirements', label: 'Business eligibility requirements', importance: 'optional' },
  { key: 'preferredPartnerTraits', label: 'Preferred partner characteristics', importance: 'optional' },
  { key: 'contactPreference', label: 'Contact and response preferences', importance: 'optional' },
  { key: 'showPublicContact', label: 'Show contact publicly', importance: 'optional' },
];

const BY_TYPE: Record<OpportunityType, FieldDefinition[]> = {
  'Buyer Request': [
    ...BASE_INFO,
    { key: 'quantity', label: 'Quantity', importance: 'mandatory' },
    { key: 'unit', label: 'Unit of measurement', importance: 'recommended' },
    { key: 'quantityAndSpecs', label: 'Quantity and specs summary', importance: 'optional' },
    { key: 'budgetOrPrice', label: 'Indicative budget', importance: 'recommended' },
    { key: 'currency', label: 'Currency', importance: 'optional' },
    { key: 'paymentTerms', label: 'Payment terms', importance: 'optional' },
    { key: 'priceNegotiable', label: 'Price negotiable', importance: 'optional' },
    ...COMMERCIAL_COMMON,
  ],
  'Service Request': [
    ...BASE_INFO,
    { key: 'quantity', label: 'Scope / volume', importance: 'recommended' },
    { key: 'budgetOrPrice', label: 'Indicative budget', importance: 'recommended' },
    { key: 'currency', label: 'Currency', importance: 'optional' },
    { key: 'paymentTerms', label: 'Payment terms', importance: 'optional' },
    ...COMMERCIAL_COMMON,
  ],
  Procurement: [
    ...BASE_INFO,
    { key: 'quantity', label: 'Quantity', importance: 'mandatory' },
    { key: 'unit', label: 'Unit of measurement', importance: 'recommended' },
    { key: 'budgetOrPrice', label: 'Indicative budget / tender value', importance: 'recommended' },
    { key: 'currency', label: 'Currency', importance: 'optional' },
    { key: 'paymentTerms', label: 'Payment terms', importance: 'recommended' },
    { key: 'deadline', label: 'Submission deadline', importance: 'mandatory' },
    ...COMMERCIAL_COMMON.filter((f) => f.key !== 'deadline'),
  ],
  'Supplier Offer': [
    ...BASE_INFO,
    { key: 'capacity', label: 'Production or supply capacity', importance: 'recommended' },
    { key: 'moq', label: 'Minimum order quantity', importance: 'recommended' },
    { key: 'quantity', label: 'Available quantity', importance: 'optional' },
    { key: 'unit', label: 'Unit of measurement', importance: 'optional' },
    { key: 'budgetOrPrice', label: 'Indicative price', importance: 'recommended' },
    { key: 'currency', label: 'Currency', importance: 'optional' },
    { key: 'paymentTerms', label: 'Payment terms', importance: 'optional' },
    { key: 'priceNegotiable', label: 'Price negotiable', importance: 'optional' },
    ...COMMERCIAL_COMMON,
  ],
  'Export Opportunity': [
    ...BASE_INFO,
    { key: 'capacity', label: 'Export capacity', importance: 'recommended' },
    { key: 'moq', label: 'Minimum order quantity', importance: 'recommended' },
    { key: 'budgetOrPrice', label: 'Indicative export price', importance: 'recommended' },
    { key: 'currency', label: 'Currency', importance: 'optional' },
    { key: 'paymentTerms', label: 'Payment terms', importance: 'recommended' },
    { key: 'destinationMarket', label: 'Target export markets', importance: 'mandatory' },
    ...COMMERCIAL_COMMON.filter((f) => f.key !== 'destinationMarket'),
  ],
  Distribution: [
    ...BASE_INFO,
    { key: 'moq', label: 'Minimum order / stock commitment', importance: 'optional' },
    { key: 'capacity', label: 'Expected volume', importance: 'optional' },
    { key: 'destinationMarket', label: 'Target territories', importance: 'mandatory' },
    { key: 'preferredPartnerTraits', label: 'Preferred distributor profile', importance: 'recommended' },
    ...COMMERCIAL_COMMON.filter(
      (f) => f.key !== 'destinationMarket' && f.key !== 'preferredPartnerTraits',
    ),
  ],
  Partnership: [
    ...BASE_INFO,
    { key: 'budgetOrPrice', label: 'Indicative investment / contribution', importance: 'optional' },
    { key: 'preferredPartnerTraits', label: 'Ideal partner characteristics', importance: 'recommended' },
    { key: 'eligibilityRequirements', label: 'Eligibility requirements', importance: 'recommended' },
    ...COMMERCIAL_COMMON.filter(
      (f) => f.key !== 'preferredPartnerTraits' && f.key !== 'eligibilityRequirements',
    ),
  ],
};

export function fieldsForType(type: OpportunityType): FieldDefinition[] {
  return BY_TYPE[type] ?? BASE_INFO.concat(COMMERCIAL_COMMON);
}

export function isFieldVisible(type: OpportunityType, key: FieldKey): boolean {
  return fieldsForType(type).some((f) => f.key === key);
}

export function fieldImportance(type: OpportunityType, key: FieldKey): FieldImportance | null {
  return fieldsForType(type).find((f) => f.key === key)?.importance ?? null;
}

export function opportunityTypeLabel(type: OpportunityType): string {
  return OPPORTUNITY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export interface OpportunityFormState {
  type: OpportunityType;
  productOrService: string;
  industry: string;
  description: string;
  technicalSpecs: string;
  qualityRequirements: string;
  quantity: string;
  unit: string;
  quantityAndSpecs: string;
  capacity: string;
  moq: string;
  budgetOrPrice: string;
  currency: string;
  paymentTerms: string;
  priceNegotiable: boolean;
  originLocation: string;
  destinationMarket: string;
  deliveryTimeline: string;
  deadline: string;
  requiredCertifications: string;
  eligibilityRequirements: string;
  preferredPartnerTraits: string;
  contactPreference: string;
  showPublicContact: boolean;
}

export function emptyOpportunityForm(type: OpportunityType = 'Buyer Request'): OpportunityFormState {
  return {
    type,
    productOrService: '',
    industry: '',
    description: '',
    technicalSpecs: '',
    qualityRequirements: '',
    quantity: '',
    unit: '',
    quantityAndSpecs: '',
    capacity: '',
    moq: '',
    budgetOrPrice: '',
    currency: 'USD',
    paymentTerms: '',
    priceNegotiable: true,
    originLocation: '',
    destinationMarket: '',
    deliveryTimeline: '',
    deadline: '',
    requiredCertifications: '',
    eligibilityRequirements: '',
    preferredPartnerTraits: '',
    contactPreference: 'Respond through TradeSquare',
    showPublicContact: false,
  };
}

export function validateOpportunityForm(
  form: OpportunityFormState,
  mode: 'draft' | 'publish',
): string[] {
  if (mode === 'draft') {
    if (!form.type) return ['Select an opportunity type.'];
    return [];
  }
  const errors: string[] = [];
  for (const field of fieldsForType(form.type)) {
    if (field.importance !== 'mandatory') continue;
    if (field.key === 'showPublicContact' || field.key === 'priceNegotiable') continue;
    const value = form[field.key];
    if (typeof value === 'string' && !value.trim()) {
      errors.push(`${field.label} is required.`);
    }
  }
  return errors;
}

export function buildQuantityAndSpecs(form: OpportunityFormState): string {
  if (form.quantityAndSpecs.trim()) return form.quantityAndSpecs.trim();
  const parts = [
    form.quantity.trim() && form.unit.trim()
      ? `${form.quantity.trim()} ${form.unit.trim()}`
      : form.quantity.trim(),
    form.technicalSpecs.trim(),
    form.qualityRequirements.trim(),
    form.capacity.trim() ? `Capacity: ${form.capacity.trim()}` : '',
    form.moq.trim() ? `MOQ: ${form.moq.trim()}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

import type { CountryRegistryEntry } from '../../src/types/compliance';

export const COUNTRY_REGISTRY: CountryRegistryEntry[] = [
  {
    code: 'RW',
    name: 'Rwanda',
    region: 'East Africa',
    tradeBlocs: ['EAC', 'COMESA', 'AfCFTA'],
    phaseCoverage: 'Phase 1 Primary',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'Limited Company (Ltd / PLC)',
        localExamples: 'Private Limited Company registered with RDB / Office of the Registrar General',
      },
      {
        code: 'sole_proprietorship',
        label: 'Individual Enterprise / Sole Proprietorship',
        localExamples: 'Sole Trader registered under RDB Domestic Enterprise Regime',
      },
      {
        code: 'partnership',
        label: 'Partnership',
        localExamples: 'General or Limited Partnership registered with RDB',
      },
      {
        code: 'cooperative',
        label: 'Cooperative',
        localExamples: 'Agricultural, producer, or trade cooperative registered via RCA / RDB',
      },
      {
        code: 'association',
        label: 'Association / Non-Profit Organisation',
        localExamples: 'Trade association or registered non-governmental entity',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'Branch of foreign company or statutory body',
      },
    ],
  },
  {
    code: 'KE',
    name: 'Kenya',
    region: 'East Africa',
    tradeBlocs: ['EAC', 'COMESA', 'AfCFTA'],
    phaseCoverage: 'Phase 2/3 Regional',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'Private / Public Limited Company',
        localExamples: 'Registered with Business Registration Service (BRS) Kenya',
      },
      {
        code: 'sole_proprietorship',
        label: 'Sole Proprietorship / Business Name',
        localExamples: 'BN2 Business Name registered with BRS Kenya',
      },
      {
        code: 'partnership',
        label: 'Partnership / LLP',
        localExamples: 'Limited Liability Partnership registered with BRS Kenya',
      },
      {
        code: 'cooperative',
        label: 'Cooperative Society',
        localExamples: 'Registered under the Co-operative Societies Act',
      },
      {
        code: 'association',
        label: 'Association / Society',
        localExamples: 'Registered industry association or society',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'Foreign company branch or state corporation',
      },
    ],
  },
  {
    code: 'UG',
    name: 'Uganda',
    region: 'East Africa',
    tradeBlocs: ['EAC', 'COMESA', 'AfCFTA'],
    phaseCoverage: 'Phase 2/3 Regional',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'Limited Liability Company',
        localExamples: 'Registered with Uganda Registration Services Bureau (URSB)',
      },
      {
        code: 'sole_proprietorship',
        label: 'Individual Enterprise / Sole Proprietorship',
        localExamples: 'Registered Business Name via URSB',
      },
      {
        code: 'partnership',
        label: 'Partnership',
        localExamples: 'Partnership Deed registered with URSB',
      },
      {
        code: 'cooperative',
        label: 'Cooperative Society',
        localExamples: 'Registered with Ministry of Trade, Industry and Cooperatives',
      },
      {
        code: 'association',
        label: 'Association / NGO',
        localExamples: 'Company limited by guarantee or NGO',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'Foreign registered entity',
      },
    ],
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    region: 'East Africa',
    tradeBlocs: ['EAC', 'SADC', 'AfCFTA'],
    phaseCoverage: 'Phase 2/3 Regional',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'Limited Company',
        localExamples: 'Registered with BRELA Tanzania',
      },
      {
        code: 'sole_proprietorship',
        label: 'Sole Proprietorship / Business Name',
        localExamples: 'Business Name registered with BRELA',
      },
      {
        code: 'partnership',
        label: 'Partnership',
        localExamples: 'Partnership registered with BRELA',
      },
      {
        code: 'cooperative',
        label: 'Cooperative Society',
        localExamples: 'Registered via TCDC Tanzania',
      },
      {
        code: 'association',
        label: 'Association',
        localExamples: 'Registered society or trade association',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'Foreign subsidiary or branch',
      },
    ],
  },
  {
    code: 'CD',
    name: 'DR Congo',
    region: 'North & Central Africa',
    tradeBlocs: ['EAC', 'COMESA', 'SADC', 'AfCFTA'],
    phaseCoverage: 'Phase 2/3 Regional',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'SARL / SA (Limited Company)',
        localExamples: 'OHADA SARL / SA registered at Guichet Unique (GUCE)',
      },
      {
        code: 'sole_proprietorship',
        label: 'Entreprise Individuelle',
        localExamples: 'Registered at RCCM / Guichet Unique',
      },
      {
        code: 'partnership',
        label: 'SNC / SCS Partnership',
        localExamples: 'OHADA partnership registered at RCCM',
      },
      {
        code: 'cooperative',
        label: 'Cooperative (SCOOP)',
        localExamples: 'OHADA Cooperative Society',
      },
      {
        code: 'association',
        label: 'Association (ASBL)',
        localExamples: 'Non-profit / trade association',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'Succursale / branch entity',
      },
    ],
  },
  {
    code: 'GH',
    name: 'Ghana',
    region: 'West Africa',
    tradeBlocs: ['ECOWAS', 'AfCFTA'],
    phaseCoverage: 'Phase 2/3 Regional',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'Company Limited by Shares',
        localExamples: 'Registered with Office of the Registrar of Companies (ORC)',
      },
      {
        code: 'sole_proprietorship',
        label: 'Sole Proprietorship',
        localExamples: 'Business Name registered with ORC Ghana',
      },
      {
        code: 'partnership',
        label: 'Incorporated Private Partnership',
        localExamples: 'Registered under Incorporated Private Partnerships Act',
      },
      {
        code: 'cooperative',
        label: 'Cooperative Society',
        localExamples: 'Registered with Department of Co-operatives',
      },
      {
        code: 'association',
        label: 'Company Limited by Guarantee / Association',
        localExamples: 'Non-profit or industry body',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'External company registration',
      },
    ],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    region: 'West Africa',
    tradeBlocs: ['ECOWAS', 'AfCFTA'],
    phaseCoverage: 'Phase 2/3 Regional',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'Private / Public Limited Company (Ltd / PLC)',
        localExamples: 'Registered with Corporate Affairs Commission (CAC)',
      },
      {
        code: 'sole_proprietorship',
        label: 'Business Name / Sole Proprietorship',
        localExamples: 'Registered with CAC Nigeria',
      },
      {
        code: 'partnership',
        label: 'Partnership / LLP',
        localExamples: 'Registered under CAMA 2020',
      },
      {
        code: 'cooperative',
        label: 'Cooperative Society',
        localExamples: 'State or Federal Cooperative registration',
      },
      {
        code: 'association',
        label: 'Incorporated Trustees / Association',
        localExamples: 'Registered under CAMA Part F',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'Statutory enterprise',
      },
    ],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    region: 'Southern Africa',
    tradeBlocs: ['SADC', 'SACU', 'AfCFTA'],
    phaseCoverage: 'Phase 2/3 Regional',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'Private Company (Pty) Ltd',
        localExamples: 'Registered with CIPC South Africa',
      },
      {
        code: 'sole_proprietorship',
        label: 'Sole Proprietorship',
        localExamples: 'Unincorporated trader registered with SARS',
      },
      {
        code: 'partnership',
        label: 'Partnership',
        localExamples: 'Contractual partnership',
      },
      {
        code: 'cooperative',
        label: 'Co-operative',
        localExamples: 'Registered with CIPC Co-operatives Registry',
      },
      {
        code: 'association',
        label: 'Non-Profit Company (NPC) / Association',
        localExamples: 'Registered with CIPC',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'External company or trust',
      },
    ],
  },
  {
    code: 'EU',
    name: 'European Union',
    region: 'European Union',
    tradeBlocs: ['EU Single Market', 'EPA / EBA'],
    phaseCoverage: 'Destination Ruleset',
    legalStructures: [
      {
        code: 'limited_company',
        label: 'Limited Company / Corporation',
        localExamples: 'EU Member State commercial registry entity',
      },
      {
        code: 'sole_proprietorship',
        label: 'Sole Trader',
        localExamples: 'Registered sole commercial operator',
      },
      {
        code: 'partnership',
        label: 'Partnership',
        localExamples: 'Commercial partnership',
      },
      {
        code: 'cooperative',
        label: 'Cooperative',
        localExamples: 'Producer / trade cooperative',
      },
      {
        code: 'association',
        label: 'Association',
        localExamples: 'Recognised trade association',
      },
      {
        code: 'other_recognised',
        label: 'Other Legally Recognised Structure',
        localExamples: 'Foreign exporter / partner entity',
      },
    ],
  },
];

export function findCountryEntry(nameOrCode: string): CountryRegistryEntry | undefined {
  const norm = nameOrCode.trim().toLowerCase();
  return COUNTRY_REGISTRY.find(
    (c) => c.name.toLowerCase() === norm || c.code.toLowerCase() === norm
  );
}

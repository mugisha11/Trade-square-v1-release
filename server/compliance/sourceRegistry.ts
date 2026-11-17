import type { RegulatorySourceRecord } from '../../src/types/compliance';

export const REGULATORY_SOURCES: RegulatorySourceRecord[] = [
  // =========================================================================
  // INITIAL RWANDA OFFICIAL SOURCES
  // =========================================================================
  {
    id: 'rw_rdb_org',
    name: 'Rwanda Development Board — Office of the Registrar General',
    shortName: 'RDB / ORG',
    url: 'https://org.rdb.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Government Registration',
    description:
      'Official company incorporation, business registration certificates, articles of association, shareholding filings, and commercial entity status in Rwanda.',
    integrationMethod:
      'Approved official portal reference and direct filing links (no automated scraping; public portal requires direct company authentication for registry extracts).',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'rw_rra',
    name: 'Rwanda Revenue Authority',
    shortName: 'RRA',
    url: 'https://www.rra.gov.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Regulatory',
    description:
      'Official tax administration authority for TIN registration, VAT/income tax compliance, Tax Clearance Certificates (Attestation de Non-Créance), and Customs administration.',
    integrationMethod:
      'Official statutory rules & direct taxpayer verification links via RRA MyRRA / Electronic Tax portal.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'rw_trade_portal',
    name: 'Rwanda Trade Portal',
    shortName: 'Rwanda Trade Portal',
    url: 'https://rwandatrade.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Trade Procedure',
    description:
      'Official step-by-step repository of Rwanda import, export, and transit trade procedures, required permits, customs forms, fees, and responsible agencies.',
    integrationMethod:
      'Maintained step-by-step trade procedure records linked to official procedure pages on rwandatrade.rw.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'rw_rsb',
    name: 'Rwanda Standards Board',
    shortName: 'RSB',
    url: 'https://www.rsb.gov.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Standards & Certification',
    description:
      'National standards body managing the Rwanda Standards Board S-Mark (mandatory product certification mark for regulated goods), metrology, and testing laboratories.',
    integrationMethod:
      'Curated official standards rules and direct application procedure references on rsb.gov.rw.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'rw_minicom',
    name: 'Ministry of Trade and Industry (Rwanda)',
    shortName: 'MINICOM',
    url: 'https://www.minicom.gov.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Regulatory',
    description:
      'National policy and regulatory ministry governing domestic trade, industrial development, cooperatives policy, and regional cross-border trade agreements.',
    integrationMethod:
      'Maintained policy and licensing directive references with direct official ministry links.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'rw_minicom_tia',
    name: 'MINICOM Trade & Industry Analytics',
    shortName: 'MINICOM TIA',
    url: 'https://tia.minicom.gov.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Market Intelligence',
    description:
      'Trade and industry analytics portal tracking Rwandan commercial trends, sector metrics, and trade corridor performance (market intelligence only, not statutory rules).',
    integrationMethod: 'Official institutional analytics reference link.',
    canEstablishLegalObligation: false,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'rw_data_gov',
    name: 'Rwanda Data Sharing Platform',
    shortName: 'Data.gov.rw',
    url: 'https://data.gov.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Statistical',
    description:
      'National open government data catalog publishing public datasets (statistical context only; does not establish statutory licensing obligations).',
    integrationMethod: 'Open dataset reference link.',
    canEstablishLegalObligation: false,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'rw_nisr',
    name: 'National Institute of Statistics of Rwanda',
    shortName: 'NISR',
    url: 'https://statistics.gov.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Statistical',
    description:
      'Official national statistics institute providing macroeconomic, trade, and industrial census indicators (statistical reference only, not a licensing authority).',
    integrationMethod: 'Official statistical portal reference link.',
    canEstablishLegalObligation: false,
    lastCheckedDate: '2026-11-01',
  },
  // Additional authoritative Rwandan operational sources referenced by Rwanda Trade Portal
  {
    id: 'rw_fda',
    name: 'Rwanda Food and Drugs Authority',
    shortName: 'Rwanda FDA',
    url: 'https://rwandafda.gov.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Regulatory',
    description:
      'National regulatory authority for processed foods, beverages, pharmaceuticals, medical devices, and health-related manufacturing/import approvals in Rwanda.',
    integrationMethod: 'Maintained regulatory rules mapped to Rwanda FDA registration & premises licensing.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'rw_rppa',
    name: 'Rwanda Public Procurement Authority (Umucyo)',
    shortName: 'RPPA / Umucyo',
    url: 'https://www.umucyo.gov.rw/',
    jurisdiction: 'Rwanda',
    sourceType: 'Regulatory',
    description:
      'Official public procurement regulator and e-Procurement portal governing supplier qualification requirements for Rwandan government tenders.',
    integrationMethod: 'Official public tender qualification ruleset and Umucyo portal link.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },

  // =========================================================================
  // REGIONAL & INTERNATIONAL SOURCES
  // =========================================================================
  {
    id: 'reg_eac',
    name: 'East African Community (EAC)',
    shortName: 'EAC',
    url: 'https://www.eac.int/',
    jurisdiction: 'East Africa',
    sourceType: 'Regulatory',
    description:
      'EAC Customs Union protocols, Simplified Trade Regime, EAC Rules of Origin, and harmonized regional standards framework.',
    integrationMethod: 'Approved regional trade protocol & EAC Rules of Origin framework records.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'reg_afcfta',
    name: 'African Continental Free Trade Area (AfCFTA) Secretariat',
    shortName: 'AfCFTA',
    url: 'https://au-afcfta.org/',
    jurisdiction: 'Pan-African',
    sourceType: 'Trade Procedure',
    description:
      'Continental preferential trade framework governing AfCFTA Rules of Origin, tariff schedules, and cross-border certificate of origin procedures.',
    integrationMethod: 'Official AfCFTA Rules of Origin and Guided Trade Initiative documentation.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'intl_trademap',
    name: 'International Trade Centre — Trade Map',
    shortName: 'ITC Trade Map',
    url: 'https://www.trademap.org/',
    jurisdiction: 'International',
    sourceType: 'Market Intelligence',
    description:
      'Global trade flow statistics, HS product demand indicators, and bilateral trade values (market intelligence only; never cited as proof of legal obligation).',
    integrationMethod: 'Approved international market intelligence reference.',
    canEstablishLegalObligation: false,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'intl_export_potential',
    name: 'ITC Export Potential Map',
    shortName: 'ITC Export Potential',
    url: 'https://exportpotential.intracen.org/en/',
    jurisdiction: 'International',
    sourceType: 'Market Intelligence',
    description:
      'Analytical estimates of export potential and diversification opportunities across destination markets (market intelligence only, not a regulatory rule source).',
    integrationMethod: 'Approved export market intelligence reference.',
    canEstablishLegalObligation: false,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'reg_ato',
    name: 'Africa Trade Observatory (ATO)',
    shortName: 'Africa Trade Observatory',
    url: 'https://ato.africa/en',
    jurisdiction: 'Pan-African',
    sourceType: 'Market Intelligence',
    description:
      'Pan-African trade statistics and market comparison observatory supporting AfCFTA business intelligence (statistical/market intelligence only).',
    integrationMethod: 'Approved continental market intelligence reference.',
    canEstablishLegalObligation: false,
    lastCheckedDate: '2026-11-01',
  },
  // Destination-market regulatory authorities (Kenya, Uganda, EU)
  {
    id: 'ke_kebs_kentrade',
    name: 'Kenya Bureau of Standards (KEBS) & KenTrade InfoTradeKenya',
    shortName: 'KEBS / KenTrade',
    url: 'https://infotradekenya.go.ke/',
    jurisdiction: 'Kenya',
    sourceType: 'Trade Procedure',
    description:
      'Official Kenya trade procedures, KEBS Pre-Export Verification of Conformity (PVoC) / EAC recognized marks, and KEPHIS agricultural import permit rules.',
    integrationMethod: 'Official Kenyan destination trade portal reference.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'ug_unbs_ursb',
    name: 'Uganda National Bureau of Standards (UNBS) & Trade Portal',
    shortName: 'UNBS / Uganda Trade',
    url: 'https://ugandatrades.go.ug/',
    jurisdiction: 'Uganda',
    sourceType: 'Trade Procedure',
    description:
      'Official Uganda import/export procedures, product conformity rules, and sanitary/phytosanitary clearance requirements.',
    integrationMethod: 'Official Ugandan destination trade portal reference.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
  {
    id: 'eu_access2markets',
    name: 'European Commission Access2Markets & TRACES Portal',
    shortName: 'EU Access2Markets',
    url: 'https://trade.ec.europa.eu/access-to-markets/en/home',
    jurisdiction: 'European Union',
    sourceType: 'Trade Procedure',
    description:
      'Official EU destination import requirements including phytosanitary certificates (TRACES NT), food safety MRLs, EUDR deforestation due diligence, and EBA rules of origin.',
    integrationMethod: 'Official European Commission destination market procedure reference.',
    canEstablishLegalObligation: true,
    lastCheckedDate: '2026-11-01',
  },
];

export function getSourceById(sourceId: string): RegulatorySourceRecord | undefined {
  return REGULATORY_SOURCES.find((s) => s.id === sourceId);
}

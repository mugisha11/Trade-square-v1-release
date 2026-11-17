export interface ParticipantGroup {
  index: string;
  title: string;
  description: string;
}

export interface ProblemPillar {
  index: string;
  title: string;
  detail: string;
}

export interface ApproachPillar {
  index: string;
  title: string;
  summary: string;
  outcome: string;
}

export interface IllustrativeProfile {
  id: string;
  name: string;
  sector: string;
  region: string;
  country: string;
  role: 'Manufacturer / Supplier' | 'Buyer / Importer' | 'Distributor / Logistics';
  capabilitySummary: string;
  corridorFocus: string;
  suggestedBriefQuery: string;
}

export interface BriefPreset {
  label: string;
  role: string;
  originRegion: string;
  corridorScope: string;
  query: string;
}

export const PARTICIPANT_GROUPS: ParticipantGroup[] = [
  {
    index: '01',
    title: 'Manufacturers & Producers',
    description:
      'Present production capacity, product standards, and export readiness directly to qualified regional buyers.',
  },
  {
    index: '02',
    title: 'Buyers & Procurement Teams',
    description:
      'Discover vetted regional suppliers without relying solely on informal brokers or fragmented directories.',
  },
  {
    index: '03',
    title: 'Distributors & Trade Operators',
    description:
      'Identify complementary product lines and supply partners equipped for cross-border fulfillment.',
  },
  {
    index: '04',
    title: 'Investors & Institutions',
    description:
      'Gain clearer visibility into real sector capacity, active trade corridors, and enterprise demand.',
  },
];

export const PROBLEM_PILLARS: ProblemPillar[] = [
  {
    index: '01',
    title: 'Capable businesses remain invisible beyond local borders',
    detail:
      'Across African markets, factories, agro-processors, and service providers already hold proven capacity, yet lack structured channels to reach serious buyers in neighboring countries.',
  },
  {
    index: '02',
    title: 'Discovery still depends on guesswork and personal introductions',
    detail:
      'Without reliable capability profiles and clear commercial criteria, sourcing teams spend weeks verifying basic details before a productive conversation can even start.',
  },
  {
    index: '03',
    title: 'Single-country boundaries limit scale',
    detail:
      'Growth stalls when every cross-border expansion requires rebuilding trust, partner discovery, and market understanding from scratch.',
  },
];

export const APPROACH_PILLARS: ApproachPillar[] = [
  {
    index: '01',
    title: 'Structured Enterprise Profiles',
    summary:
      'Every participant describes what they actually produce, supply, or procure—capacity, certifications, operating geography, and commercial readiness—in plain business terms.',
    outcome: 'Evaluated quickly by real counterparties',
  },
  {
    index: '02',
    title: 'Practical Commercial Intelligence',
    summary:
      'Instead of decorative software dashboards, TradeSquare applies practical intelligence to translate a business goal into clear partner criteria, verification steps, and corridor guidance.',
    outcome: 'Useful to ordinary business owners',
  },
  {
    index: '03',
    title: 'Direct Enquiry & Partner Qualification',
    summary:
      'Move from broad regional interest to focused commercial conversations—matching real supply capacity with genuine procurement demand.',
    outcome: 'Built for relevant enquiries and partnerships',
  },
  {
    index: '04',
    title: 'Cross-Border Infrastructure by Design',
    summary:
      'Designed from the outset to connect regional corridors across East, West, Southern, North, and Central Africa rather than trapping enterprises inside one domestic market.',
    outcome: 'Structured to grow across countries',
  },
];

export const ILLUSTRATIVE_PROFILES: IllustrativeProfile[] = [
  {
    id: 'agro-packaging-ea',
    name: 'Food-Grade Flexible Packaging Producer',
    sector: 'Industrial Packaging',
    region: 'East Africa',
    country: 'Kenya',
    role: 'Manufacturer / Supplier',
    capabilitySummary:
      'Produces laminated pouches, moisture-barrier films, and export cartons for regional beverage and dry-goods processors.',
    corridorFocus: 'Kenya · Uganda · Tanzania · Rwanda',
    suggestedBriefQuery:
      'We are a food-grade flexible packaging producer in Kenya looking to supply agro-processors across Uganda, Rwanda, and Tanzania. What buyer profiles, compliance checks, and entry steps should we prioritize?',
  },
  {
    id: 'shea-botanicals-wa',
    name: 'Refined Shea & Botanical Ingredients Processor',
    sector: 'Agro-Processing',
    region: 'West Africa',
    country: 'Ghana',
    role: 'Manufacturer / Supplier',
    capabilitySummary:
      'Bulk refined shea butter and cold-pressed oils packaged for regional personal-care manufacturers and food formulators.',
    corridorFocus: 'Ghana · Côte d’Ivoire · Senegal · Nigeria',
    suggestedBriefQuery:
      'A refined shea and botanical oils processor in Ghana wants to build recurring supply agreements with regional FMCG manufacturers in West Africa. Identify key counterparty criteria and trade checks.',
  },
  {
    id: 'cold-chain-sa',
    name: 'Cross-Border Cold-Chain Distribution Operator',
    sector: 'Logistics & Distribution',
    region: 'Southern Africa',
    country: 'Zambia',
    role: 'Distributor / Logistics',
    capabilitySummary:
      'Temperature-controlled warehousing and scheduled haulage connecting perishable producers with urban retail chains.',
    corridorFocus: 'Zambia · Zimbabwe · Botswana · South Africa',
    suggestedBriefQuery:
      'Evaluate partnership criteria for a cold-chain logistics operator in Zambia seeking anchor contracts with regional agricultural exporters and supermarket procurement teams.',
  },
  {
    id: 'building-materials-na',
    name: 'Ceramic & Construction Materials Buyer',
    sector: 'Construction & Materials',
    region: 'North Africa',
    country: 'Morocco',
    role: 'Buyer / Importer',
    capabilitySummary:
      'Regional building-supply wholesaler sourcing ceramic tiles, sanitary ware, and architectural hardware for West African projects.',
    corridorFocus: 'Morocco · Senegal · Côte d’Ivoire',
    suggestedBriefQuery:
      'A construction materials wholesaler sourcing between North and West Africa wants reliable regional manufacturers and freight partners. Outline supplier verification and corridor considerations.',
  },
];

export const BRIEF_PRESETS: BriefPreset[] = [
  {
    label: 'Packaging for East African Food Producers',
    role: 'Buyer / Importer',
    originRegion: 'East Africa',
    corridorScope: 'Regional Cross-Border',
    query:
      'Sourcing certified food-grade packaging suppliers in East Africa for a growing Kenyan beverage and dried-fruit exporter.',
  },
  {
    label: 'Cold-Chain Distribution in West Africa',
    role: 'Distributor / Logistics',
    originRegion: 'West Africa',
    corridorScope: 'Regional Cross-Border',
    query:
      'Building reliable cold-chain distribution partnerships between agricultural processors in Ghana and urban wholesalers in Côte d’Ivoire and Senegal.',
  },
  {
    label: 'Regional Construction Supply in Southern Africa',
    role: 'Manufacturer / Supplier',
    originRegion: 'Southern Africa',
    corridorScope: 'Pan-African',
    query:
      'A light-manufacturing supplier of modular steel and building hardware looking to connect with vetted construction contractors across Southern Africa.',
  },
];

export const REGIONAL_CORRIDORS = [
  {
    region: 'East Africa',
    hubs: 'Nairobi · Kampala · Kigali · Dar es Salaam',
    focus: 'Agro-processing, packaging, light consumer manufacturing, and inland container corridors.',
  },
  {
    region: 'West Africa',
    hubs: 'Lagos · Accra · Abidjan · Dakar',
    focus: 'Food processing, botanical inputs, wholesale distribution, and coastal port-to-inland supply.',
  },
  {
    region: 'Southern Africa',
    hubs: 'Johannesburg · Lusaka · Gaborone · Maputo',
    focus: 'Industrial components, mining inputs, cold-chain haulage, and retail procurement.',
  },
  {
    region: 'North & Central Africa',
    hubs: 'Casablanca · Cairo · Tunis · Douala',
    focus: 'Construction materials, textiles, industrial machinery, and trans-regional sourcing.',
  },
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const NETWORK_FAQS: FaqItem[] = [
  {
    id: 'what-is-tradesquare',
    question: 'What is TradeSquare and who is it built for?',
    answer:
      'TradeSquare is a B2B trade intelligence and enterprise connection network built for manufacturers, agro-processors, wholesale buyers, procurement teams, distributors, and logistics operators across Africa. Instead of relying on informal brokers or static directories, members publish structured commercial capabilities and connect directly along regional supply corridors.',
  },
  {
    id: 'how-verification-works',
    question: 'How does enterprise verification and the Verified badge work?',
    answer:
      'Businesses joining TradeSquare submit operating country, sector classification, production or procurement capacity, and regional corridor scope. Enterprises that complete structured commercial verification receive a Verified checkmark badge displayed next to their business name in the opportunity feed and partner recommendations, helping procurement teams evaluate credibility upfront.',
  },
  {
    id: 'supported-corridors',
    question: 'Which regions and trade corridors are supported?',
    answer:
      'TradeSquare is structured around four primary regional corridors: East Africa (Nairobi, Kampala, Kigali, Dar es Salaam), West Africa (Lagos, Accra, Abidjan, Dakar), Southern Africa (Johannesburg, Lusaka, Gaborone, Maputo), and North & Central Africa (Casablanca, Cairo, Tunis, Douala), alongside cross-corridor trade matching.',
  },
  {
    id: 'direct-enquiries',
    question: 'How do buyers and suppliers discover partners and start conversations?',
    answer:
      'Authenticated members can post buying mandates or supply offers directly to the live Opportunity Feed, browse curated enterprise recommendations filtered by sector and corridor, and initiate direct threaded enquiries inside Messages without third-party intermediaries.',
  },
  {
    id: 'commercial-intelligence',
    question: 'What does TradeSquare’s commercial intelligence assistant provide?',
    answer:
      'Rather than acting as a generic chat box, TradeSquare translates a practical business brief—such as sourcing food-grade flexible packaging in East Africa or establishing cold-chain haulage in West Africa—into specific counterparty criteria, verification steps, and corridor readiness guidance.',
  },
  {
    id: 'onboarding-time',
    question: 'How long does it take to create an account and set up a profile?',
    answer:
      'Creating a TradeSquare business account takes under three minutes. Once registered, you can immediately configure your enterprise profile, define your buyer or supplier role, browse verified opportunities, and start connecting with regional partners.',
  },
  {
    id: 'data-security',
    question: 'How are business profiles and commercial enquiries kept secure?',
    answer:
      'Enterprise capability profiles, posted opportunities, and supplier offers are visible only within the authenticated TradeSquare network. Direct enquiry threads and negotiation details stay private between the participating counterparties.',
  },
];


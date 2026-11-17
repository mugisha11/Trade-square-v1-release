import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, Globe2, ShieldCheck } from 'lucide-react';
import { APPROACH_PILLARS } from '../data/networkData';
import { ResilientImage } from './ResilientImage';

interface TradeSquareApproachSectionProps {
  onExploreCorridors: () => void;
  onExploreVision: () => void;
  onJoinClick: (objective?: string) => void;
}

export function TradeSquareApproachSection({
  onExploreCorridors,
  onExploreVision,
  onJoinClick,
}: TradeSquareApproachSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const cardMotion = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section id="approach" className="bg-white dark:bg-[#000000] border-t border-slate-200/80 dark:border-[#2F3336]">
      {/* Section Header */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-10 sm:pb-12 text-center"
      >
        <p className="text-xs font-medium tracking-wide text-[#0071E3] dark:text-[#1D9BF0] mb-3">
          The TradeSquare Approach
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-[42px] font-semibold tracking-[-0.02em] leading-[1.12] text-[#1D1D1F] dark:text-[#E7E9EA]">
          Practical technology built for business owners, not software specialists.
        </h2>
        <p className="mt-4 text-base sm:text-[17px] text-[#424245] dark:text-[#71767B] leading-relaxed max-w-2xl mx-auto">
          Technology matters only when it solves a real commercial problem. TradeSquare turns
          fragmented business capability into structured, verifiable connections that lead to
          enquiries, partnerships, and regional trade.
        </p>
      </motion.div>

      {/* Apple-Style Full-Width 2x2 Promo Grid */}
      <div className="w-full px-3 sm:px-3.5 pb-3 sm:pb-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {/* TILE 01: Structured Enterprise Profiles */}
          <motion.article
            {...cardMotion(0)}
            className="group bg-[#F5F5F7] dark:bg-[#16181C] dark:border dark:border-[#2F3336] text-[#1D1D1F] dark:text-[#E7E9EA] flex flex-col justify-between items-center text-center px-6 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10 min-h-[500px] sm:min-h-[560px]"
          >
            <div className="max-w-md mx-auto">
              <span className="text-xs font-semibold text-[#0071E3] dark:text-[#1D9BF0] tabular-nums block mb-1.5">
                {APPROACH_PILLARS[0].index}
              </span>
              <h3 className="text-2xl sm:text-[32px] font-semibold tracking-[-0.015em] leading-[1.15] text-[#1D1D1F] dark:text-[#E7E9EA]">
                {APPROACH_PILLARS[0].title}
              </h3>
              <p className="mt-2.5 text-[15px] sm:text-[16px] text-[#424245] dark:text-[#71767B] leading-snug">
                {APPROACH_PILLARS[0].summary}
              </p>
              <p className="mt-2 text-xs font-medium text-[#6E6E73] dark:text-[#71767B]">
                {APPROACH_PILLARS[0].outcome}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  onClick={onExploreCorridors}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 text-[14px] font-normal text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                >
                  Learn more
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() =>
                    onJoinClick('Create a structured TradeSquare enterprise profile for regional buyers.')
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 text-[14px] font-normal text-[#0071E3] border border-[#0071E3] hover:bg-[#0071E3] hover:text-white rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                >
                  Join Network
                </motion.button>
              </div>
            </div>

            <div className="w-full max-w-[440px] mt-8">
              <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-white border border-black/5 shadow-[0_20px_45px_rgba(0,0,0,0.09)]">
                <ResilientImage
                  src="/src/assets/images/enterprise_production_1794883004798.jpg"
                  alt="Quality specialist inspecting certified packaged goods in a modern African manufacturing facility"
                  fallbackTitle="Structured Enterprise Profiles"
                  fallbackSubtitle="Production capacity, quality standards, and export readiness."
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
            </div>
          </motion.article>

          {/* TILE 02: Practical Commercial Intelligence */}
          <motion.article
            {...cardMotion(0.06)}
            className="group bg-[#F5F5F7] dark:bg-[#16181C] dark:border dark:border-[#2F3336] text-[#1D1D1F] dark:text-[#E7E9EA] flex flex-col justify-between items-center text-center px-6 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10 min-h-[500px] sm:min-h-[560px]"
          >
            <div className="max-w-md mx-auto">
              <span className="text-xs font-semibold text-[#0071E3] dark:text-[#1D9BF0] tabular-nums block mb-1.5">
                {APPROACH_PILLARS[1].index}
              </span>
              <h3 className="text-2xl sm:text-[32px] font-semibold tracking-[-0.015em] leading-[1.15] text-[#1D1D1F] dark:text-[#E7E9EA]">
                {APPROACH_PILLARS[1].title}
              </h3>
              <p className="mt-2.5 text-[15px] sm:text-[16px] text-[#424245] dark:text-[#71767B] leading-snug">
                {APPROACH_PILLARS[1].summary}
              </p>
              <p className="mt-2 text-xs font-medium text-[#6E6E73] dark:text-[#71767B]">
                {APPROACH_PILLARS[1].outcome}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  onClick={onExploreVision}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 text-[14px] font-normal text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                >
                  Learn more
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() =>
                    onJoinClick('Use TradeSquare commercial intelligence to evaluate regional partners.')
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 text-[14px] font-normal text-[#0071E3] border border-[#0071E3] hover:bg-[#0071E3] hover:text-white rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                >
                  Join Network
                </motion.button>
              </div>
            </div>

            {/* Aligned Product Showcase Frame */}
            <div className="w-full max-w-[440px] mt-8">
              <div className="bg-white dark:bg-[#000000] rounded-2xl overflow-hidden border border-black/5 dark:border-[#2F3336] shadow-[0_20px_45px_rgba(0,0,0,0.09)] dark:shadow-none text-left transition-transform duration-500 ease-out group-hover:-translate-y-1">
                <div className="h-28 sm:h-32 w-full overflow-hidden bg-slate-100 dark:bg-[#16181C]">
                  <ResilientImage
                    src="/src/assets/images/hero_african_commerce_1794883004897.jpg"
                    alt="Modern African regional trade and export coordination center"
                    fallbackTitle="TradeSquare Commercial Intelligence"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-4 sm:p-5 grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-[#2F3336]">
                  <div>
                    <p className="text-[11px] font-semibold text-[#0071E3] dark:text-[#1D9BF0]">Partner Criteria</p>
                    <p className="text-[12px] text-[#424245] dark:text-[#71767B] mt-1 leading-snug">
                      Match output to buyer demand
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#1D1D1F] dark:text-[#E7E9EA]">Verification</p>
                    <p className="text-[12px] text-[#424245] dark:text-[#71767B] mt-1 leading-snug">
                      Quality & readiness checks
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#1D1D1F] dark:text-[#E7E9EA]">Corridor Path</p>
                    <p className="text-[12px] text-[#424245] dark:text-[#71767B] mt-1 leading-snug">
                      Practical entry steps
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.article>

          {/* TILE 03: Direct Enquiry & Partner Qualification (Pure Black Dark Anchor matching Apple Watch tile) */}
          <motion.article
            {...cardMotion(0.08)}
            className="bg-black text-white flex flex-col justify-between items-center text-center px-6 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10 min-h-[500px] sm:min-h-[560px]"
          >
            <div className="max-w-md mx-auto">
              <span className="text-xs font-semibold text-[#2997FF] tabular-nums block mb-1.5">
                {APPROACH_PILLARS[2].index}
              </span>
              <h3 className="text-2xl sm:text-[32px] font-semibold tracking-[-0.015em] leading-[1.15] text-white">
                {APPROACH_PILLARS[2].title}
              </h3>
            </div>

            {/* Center Dark Symmetry Visual */}
            <div className="w-full max-w-[440px] my-7 grid grid-cols-2 gap-3 sm:gap-4 items-stretch">
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="rounded-2xl bg-[#111317] border border-white/12 p-4 sm:p-5 text-left flex flex-col justify-between shadow-[0_0_40px_rgba(0,113,227,0.12)]"
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-5 h-5 text-[#2997FF]" strokeWidth={1.75} />
                  <span className="text-[11px] text-[#86868B]">Supply</span>
                </div>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-white">Verified Capacity</p>
                  <p className="text-xs text-[#A1A1A6] mt-1 leading-relaxed">
                    Production volume, standards, and regional readiness
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="rounded-2xl bg-[#111317] border border-white/12 p-4 sm:p-5 text-left flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.12)]"
              >
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={1.75} />
                  <span className="text-[11px] text-[#86868B]">Demand</span>
                </div>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-white">Qualified Enquiry</p>
                  <p className="text-xs text-[#A1A1A6] mt-1 leading-relaxed">
                    Direct commercial terms with serious regional buyers
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="max-w-md mx-auto">
              <p className="text-[15px] sm:text-[16px] text-[#D2D2D7] leading-snug">
                {APPROACH_PILLARS[2].summary}
              </p>
              <p className="mt-2 text-xs font-medium text-[#86868B]">
                {APPROACH_PILLARS[2].outcome}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  onClick={onExploreCorridors}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 text-[14px] font-normal text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                >
                  Learn more
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() =>
                    onJoinClick('Connect directly with qualified regional suppliers and buyers.')
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 text-[14px] font-normal text-[#2997FF] border border-[#2997FF] hover:bg-[#2997FF] hover:text-black rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2997FF]"
                >
                  Join Network
                </motion.button>
              </div>
            </div>
          </motion.article>

          {/* TILE 04: Cross-Border Infrastructure by Design */}
          <motion.article
            {...cardMotion(0.12)}
            className="group bg-[#F5F5F7] dark:bg-[#16181C] dark:border dark:border-[#2F3336] text-[#1D1D1F] dark:text-[#E7E9EA] flex flex-col justify-between items-center text-center px-6 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10 min-h-[500px] sm:min-h-[560px]"
          >
            <div className="max-w-md mx-auto">
              <span className="text-xs font-semibold text-[#0071E3] dark:text-[#1D9BF0] tabular-nums block mb-1.5">
                {APPROACH_PILLARS[3].index}
              </span>
              <h3 className="text-2xl sm:text-[32px] font-semibold tracking-[-0.015em] leading-[1.15] text-[#1D1D1F] dark:text-[#E7E9EA]">
                {APPROACH_PILLARS[3].title}
              </h3>
              <p className="mt-2.5 text-[15px] sm:text-[16px] text-[#424245] dark:text-[#71767B] leading-snug">
                {APPROACH_PILLARS[3].summary}
              </p>
              <p className="mt-2 text-xs font-medium text-[#6E6E73] dark:text-[#71767B]">
                {APPROACH_PILLARS[3].outcome}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  onClick={onExploreCorridors}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 text-[14px] font-normal text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                >
                  Learn more
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() =>
                    onJoinClick('Expand across regional African trade corridors with TradeSquare.')
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 text-[14px] font-normal text-[#0071E3] border border-[#0071E3] hover:bg-[#0071E3] hover:text-white rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                >
                  Join Network
                </motion.button>
              </div>
            </div>

            <div className="w-full max-w-[440px] mt-8">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-white border border-black/5 shadow-[0_20px_45px_rgba(0,0,0,0.09)]">
                <ResilientImage
                  src="/src/assets/images/problem_trade_corridor_1794883004849.jpg"
                  alt="African intermodal freight corridor linking regional manufacturing and distribution markets"
                  fallbackTitle="Cross-Border Regional Corridors"
                  fallbackSubtitle="East, West, Southern, North, and Central Africa."
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 py-3 flex items-center justify-between text-white text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Globe2 className="w-3.5 h-3.5" />
                    Regional Corridors
                  </span>
                  <span className="text-white/85">East · West · South · North · Central</span>
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

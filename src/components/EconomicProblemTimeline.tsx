import { useRef, useState } from 'react';
import { Building2, FileSearch, Route } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { PROBLEM_PILLARS } from '../data/networkData';

const PILLAR_ICONS = [Building2, FileSearch, Route];

export function EconomicProblemTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 78%', 'end 65%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    restDelta: 0.001,
  });

  const lineScaleY = useTransform(smoothProgress, [0, 1], [0, 1]);

  return (
    <section
      id="problem"
      className="py-16 sm:py-24 lg:py-28 bg-[#FBFBFD] dark:bg-[#000000] border-b border-slate-200/80 dark:border-[#2F3336] overflow-x-clip"
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Centered Header Block */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center mb-14 sm:mb-20"
        >
          <p className="text-xs font-medium tracking-wide text-[#0071E3] dark:text-[#1D9BF0] mb-3">
            The Economic Problem
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-semibold tracking-[-0.02em] leading-[1.12] text-[#1D1D1F] dark:text-[#E7E9EA]">
            The capacity already exists. The connection infrastructure does not.
          </h2>
          <p className="mt-5 text-base sm:text-[17px] text-[#424245] dark:text-[#71767B] leading-relaxed max-w-2xl mx-auto">
            Across Africa, millions of enterprises already manufacture products, process raw goods,
            and deliver specialized services. Yet regional trade remains constrained because finding
            a reliable counterparty across borders is still slow, opaque, and overly dependent on
            informal networks.
          </p>
        </motion.div>

        {/* Alternating Vertical Spine Timeline */}
        <div ref={containerRef} className="relative">
          {/* Base Neutral Vertical Track */}
          <div
            aria-hidden="true"
            className="absolute top-6 bottom-6 left-6 md:left-1/2 md:-translate-x-1/2 w-[2px] bg-slate-200 dark:bg-[#2F3336]"
          />

          {/* Scroll-Linked Animated Active Spine */}
          <motion.div
            aria-hidden="true"
            style={{
              scaleY: prefersReducedMotion ? 1 : lineScaleY,
              transformOrigin: 'top',
            }}
            className="absolute top-6 bottom-6 left-6 md:left-1/2 md:-translate-x-1/2 w-[2px] bg-[#0071E3]"
          />

          <div className="space-y-10 md:space-y-14">
            {PROBLEM_PILLARS.map((pillar, idx) => {
              const Icon = PILLAR_ICONS[idx % PILLAR_ICONS.length];
              const isLeftDesktop = idx % 2 === 0;
              const isActive = activeIndex === idx;

              return (
                <div
                  key={pillar.index}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-16"
                >
                  {/* Center / Left Circular Node with Playful Spring Feedback */}
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.72 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.45 }}
                    animate={
                      !prefersReducedMotion && isActive
                        ? { scale: 1.12, rotate: -6 }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 340,
                      damping: 20,
                    }}
                    className={`absolute top-6 md:top-1/2 md:-translate-y-1/2 left-6 -translate-x-1/2 md:left-1/2 z-10 w-12 h-12 rounded-full bg-white dark:bg-[#16181C] border flex items-center justify-center transition-colors duration-200 ${
                      isActive
                        ? 'border-[#0071E3] dark:border-[#1D9BF0] text-[#0071E3] dark:text-[#1D9BF0] shadow-[0_0_0_6px_rgba(0,113,227,0.14)] dark:shadow-[0_0_0_6px_rgba(29,155,240,0.18)]'
                        : 'border-[#0071E3]/40 dark:border-[#2F3336] text-[#0071E3] dark:text-[#1D9BF0] shadow-sm'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </motion.div>

                  {/* Card Slot */}
                  <motion.div
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, y: 30, scale: 0.98 }
                    }
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.25 }}
                    whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                    transition={{
                      duration: 0.6,
                      delay: idx * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`pl-16 md:pl-0 ${
                      isLeftDesktop
                        ? 'md:col-start-1 md:pr-8'
                        : 'md:col-start-2 md:pl-8'
                    }`}
                  >
                    <article
                      className={`bg-white dark:bg-[#16181C] rounded-2xl border p-6 sm:p-7 transition-all duration-200 ${
                        isActive
                          ? 'border-[#0071E3]/45 dark:border-[#1D9BF0]/60 shadow-[0_14px_34px_rgba(0,113,227,0.10)] dark:shadow-none'
                          : 'border-slate-200/90 dark:border-[#2F3336] shadow-[0_6px_24px_rgba(15,23,42,0.04)] dark:shadow-none'
                      }`}
                    >
                      <span className="text-xs font-semibold text-[#0071E3] dark:text-[#1D9BF0] tabular-nums block mb-2">
                        {pillar.index}
                      </span>
                      <h3 className="text-lg sm:text-[19px] font-semibold tracking-tight text-[#1D1D1F] dark:text-[#E7E9EA] leading-snug">
                        {pillar.title}
                      </h3>
                      <p className="mt-2.5 text-sm sm:text-[15px] text-[#424245] dark:text-[#71767B] leading-relaxed">
                        {pillar.detail}
                      </p>
                    </article>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

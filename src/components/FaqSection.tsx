import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { NETWORK_FAQS } from '../data/networkData';

interface FaqSectionProps {
  onJoinClick: () => void;
}

export function FaqSection({ onJoinClick }: FaqSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(NETWORK_FAQS[0]?.id ?? null);

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-16 sm:py-20 lg:py-28 bg-[#F5F5F7] dark:bg-[#000000] border-t border-black/[0.06] dark:border-[#2F3336]"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Editorial Anchor */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 lg:sticky lg:top-24"
          >
            <p className="text-xs font-medium tracking-wide text-[#0071E3] dark:text-[#1D9BF0] mb-3">
              Questions &amp; Answers
            </p>
            <h2
              id="faq-heading"
              className="text-2xl sm:text-3xl lg:text-[40px] font-semibold tracking-[-0.025em] leading-[1.12] text-[#1D1D1F] dark:text-[#E7E9EA] text-balance"
            >
              Clarity before you join the network.
            </h2>
            <p className="mt-4 text-base text-[#424245] dark:text-[#71767B] leading-relaxed">
              Straightforward answers on enterprise verification, supported trade corridors, direct
              counterparty enquiries, and data privacy.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={onJoinClick}
                className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#0071E3] dark:text-[#1D9BF0] hover:underline cursor-pointer py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] dark:focus-visible:ring-[#1D9BF0] rounded-sm"
              >
                <span>Create a Business Account</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>

          {/* Right Grouped Apple-Style Accordion */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8"
          >
            <div className="bg-white dark:bg-[#16181C] rounded-3xl border border-black/[0.06] dark:border-[#2F3336] divide-y divide-black/[0.06] dark:divide-[#2F3336] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none">
              {NETWORK_FAQS.map((item) => {
                const isOpen = openId === item.id;
                const buttonId = `faq-button-${item.id}`;
                const panelId = `faq-panel-${item.id}`;

                return (
                  <div key={item.id} className="transition-colors duration-200">
                    <h3>
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => handleToggle(item.id)}
                        className="w-full min-h-[64px] px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-6 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0071E3] dark:focus-visible:ring-[#1D9BF0]"
                      >
                        <span
                          className={`text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] leading-snug transition-colors ${
                            isOpen
                              ? 'text-[#0071E3] dark:text-[#1D9BF0]'
                              : 'text-[#1D1D1F] dark:text-[#E7E9EA] group-hover:text-[#0071E3] dark:group-hover:text-[#1D9BF0]'
                          }`}
                        >
                          {item.question}
                        </span>

                        <motion.span
                          aria-hidden="true"
                          animate={prefersReducedMotion ? undefined : { rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-colors ${
                            isOpen
                              ? 'bg-[#0071E3]/10 dark:bg-[#1D9BF0]/15 text-[#0071E3] dark:text-[#1D9BF0]'
                              : 'bg-[#F5F5F7] dark:bg-[#202327] text-[#424245] dark:text-[#71767B] group-hover:bg-[#0071E3]/10 dark:group-hover:bg-[#1D9BF0]/15 group-hover:text-[#0071E3] dark:group-hover:text-[#1D9BF0]'
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" strokeWidth={2} />
                        </motion.span>
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 sm:px-8 pb-6 sm:pb-7 pr-14 sm:pr-20">
                            <p className="text-[15px] text-[#424245] dark:text-[#71767B] leading-[1.65]">
                              {item.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface FooterProps {
  onOpenAuthPage: (mode: 'login' | 'signup') => void;
  onScrollToSection: (id: string) => void;
}

const PRIMARY_LANGUAGES = [
  'English (UK)',
  'Ikinyarwanda',
  'Français (France)',
  'Kiswahili',
  'Español',
  'Português (Brasil)',
  'Deutsch',
  'العربية',
  '中文(简体)',
  '日本語',
];

const EXTRA_LANGUAGES = [
  'English (US)',
  'Luganda',
  'Amharic',
  'Yorùbá',
  'Hausa',
  'isiZulu',
  'Italiano',
  '한국어',
];

type PolicyTopic = null | 'privacy' | 'terms' | 'help';

export function Footer({ onOpenAuthPage, onScrollToSection }: FooterProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedLanguage, setSelectedLanguage] = useState('English (UK)');
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [policyModal, setPolicyModal] = useState<PolicyTopic>(null);

  useEffect(() => {
    if (!policyModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPolicyModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [policyModal]);

  const visibleLanguages = showAllLanguages
    ? [...PRIMARY_LANGUAGES, ...EXTRA_LANGUAGES]
    : PRIMARY_LANGUAGES;

  const directoryItems: Array<{ label: string; onClick: () => void }> = [
    { label: 'Sign Up', onClick: () => onOpenAuthPage('signup') },
    { label: 'Log in', onClick: () => onOpenAuthPage('login') },
    { label: 'Discover', onClick: () => onOpenAuthPage('login') },
    { label: 'Opportunities', onClick: () => onOpenAuthPage('login') },
    { label: 'Messages', onClick: () => onOpenAuthPage('login') },
    { label: 'My Business', onClick: () => onOpenAuthPage('login') },
    { label: 'TradeSquare AI', onClick: () => onOpenAuthPage('login') },
    { label: 'The Economic Problem', onClick: () => onScrollToSection('problem') },
    { label: 'The TradeSquare Approach', onClick: () => onScrollToSection('approach') },
    { label: 'Regional Corridors', onClick: () => onScrollToSection('corridors') },
    { label: 'Long-Term Vision', onClick: () => onScrollToSection('vision') },
    { label: 'FAQ', onClick: () => onScrollToSection('faq') },
    { label: 'Mobile App', onClick: () => onScrollToSection('join') },
    { label: 'Manufacturers & Producers', onClick: () => onOpenAuthPage('login') },
    { label: 'Buyers & Procurement', onClick: () => onOpenAuthPage('login') },
    { label: 'Distributors & Logistics', onClick: () => onOpenAuthPage('login') },
    { label: 'Investors & Institutions', onClick: () => onOpenAuthPage('login') },
    { label: 'East Africa', onClick: () => onScrollToSection('corridors') },
    { label: 'West Africa', onClick: () => onScrollToSection('corridors') },
    { label: 'Southern Africa', onClick: () => onScrollToSection('corridors') },
    { label: 'North Africa', onClick: () => onScrollToSection('corridors') },
    { label: 'Privacy', onClick: () => setPolicyModal('privacy') },
    { label: 'Terms', onClick: () => setPolicyModal('terms') },
    { label: 'Help', onClick: () => setPolicyModal('help') },
  ];

  return (
    <footer className="bg-white dark:bg-[#000000] border-t border-[#DDDFE2] dark:border-[#2F3336] text-[#737373] dark:text-[#71767B]">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[980px] mx-auto px-4 sm:px-6 pt-6 pb-8"
      >
        {/* Row 1: Facebook-style Language Selector Strip + Expand (+) Button */}
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] leading-normal">
          {visibleLanguages.map((lang) => {
            const isActive = selectedLanguage === lang;
            return (
              <li key={lang}>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  className={`cursor-pointer whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#737373] dark:text-[#E7E9EA] font-normal cursor-default'
                      : 'text-[#8A8D91] dark:text-[#71767B] hover:underline'
                  }`}
                >
                  {lang}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setShowAllLanguages((prev) => !prev)}
              aria-expanded={showAllLanguages}
              aria-label={showAllLanguages ? 'Show fewer languages' : 'Show more languages'}
              title={showAllLanguages ? 'Show fewer languages' : 'Show more languages'}
              className="inline-flex items-center justify-center h-[20px] px-2 bg-[#F5F6F7] dark:bg-[#16181C] hover:bg-[#EBEDF0] dark:hover:bg-[#202327] border border-[#CCD0D5] dark:border-[#2F3336] rounded-[2px] text-[#4B4F56] dark:text-[#E7E9EA] text-[13px] font-bold leading-none cursor-pointer transition-colors"
            >
              {showAllLanguages ? '−' : '+'}
            </button>
          </li>
        </ul>

        {/* Classic Hairline Divider */}
        <div className="border-t border-[#DDDFE2] dark:border-[#2F3336] my-2.5" />

        {/* Row 2: Facebook-style Compact Wrapped Directory Links */}
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] leading-[1.6] text-[#8A8D91] dark:text-[#71767B]">
          {directoryItems.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={item.onClick}
                className="text-left text-[#8A8D91] dark:text-[#71767B] hover:text-[#1C1E21] dark:hover:text-[#E7E9EA] hover:underline cursor-pointer whitespace-nowrap"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Row 3: Quiet Copyright Signature */}
        <div className="mt-5 text-[11px] text-[#737373] dark:text-[#71767B]">
          <span>TradeSquare &copy; {new Date().getFullYear()}</span>
        </div>
      </motion.div>

      {/* Lightweight Policy / Help Dialog */}
      <AnimatePresence>
        {policyModal && (
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPolicyModal(null);
            }}
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white dark:bg-[#16181C] rounded-xl border border-[#DDDFE2] dark:border-[#2F3336] p-6 shadow-xl text-[#1C1E21] dark:text-[#E7E9EA]"
            >
            <button
              type="button"
              onClick={() => setPolicyModal(null)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F0F2F5] dark:bg-[#202327] hover:bg-[#E4E6EB] dark:hover:bg-[#2F3336] text-[#65676B] dark:text-[#E7E9EA] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {policyModal === 'privacy' && (
              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-[#1C1E21] dark:text-[#E7E9EA]">TradeSquare Privacy</h3>
                <p className="text-[14px] text-[#65676B] dark:text-[#71767B] leading-relaxed">
                  Business profiles, published buying requests, and supplier offers are shared only
                  within the authenticated TradeSquare network to facilitate genuine commercial
                  discovery across Rwanda and East African trade corridors.
                </p>
              </div>
            )}

            {policyModal === 'terms' && (
              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-[#1C1E21] dark:text-[#E7E9EA]">Commercial Terms</h3>
                <p className="text-[14px] text-[#65676B] dark:text-[#71767B] leading-relaxed">
                  TradeSquare provides B2B discovery, trade-matching intelligence, and direct
                  messaging infrastructure. Counterparties conduct due diligence, contract
                  execution, and logistics settlement directly with verified partners.
                </p>
              </div>
            )}

            {policyModal === 'help' && (
              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-[#1C1E21] dark:text-[#E7E9EA]">Help &amp; Support</h3>
                <p className="text-[14px] text-[#65676B] dark:text-[#71767B] leading-relaxed">
                  Create an account or log in to publish a buying request, list your products or
                  services, and discover businesses across East, West, Southern, and North Africa.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPolicyModal(null);
                      onOpenAuthPage('login');
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0866FF] dark:bg-[#1D9BF0] hover:bg-[#0057E7] dark:hover:bg-[#1A8CD8] text-white text-[14px] font-semibold cursor-pointer"
                  >
                    Go to Log in
                  </button>
                </div>
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}

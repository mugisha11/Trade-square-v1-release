import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react';
import { ThemeToggleButton } from './ThemeToggle';

interface NavbarProps {
  onJoinClick: () => void;
}

const NAV_LINKS = [
  { label: 'The Problem', href: '#problem' },
  { label: 'Approach', href: '#approach' },
  { label: 'Corridors', href: '#corridors' },
  { label: 'Vision', href: '#vision' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar({ onJoinClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    restDelta: 0.001,
  });

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 24);
  });

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md text-[#F5F5F7] transition-colors duration-300 ${
        scrolled
          ? 'bg-[#161617]/95 dark:bg-black/85 shadow-[0_8px_28px_rgba(0,0,0,0.22)] border-b border-white/10 dark:border-[#2F3336]'
          : 'bg-[#161617]/90 dark:bg-black/75 border-b border-transparent dark:border-[#2F3336]/60'
      }`}
    >
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6 h-12 md:h-11 flex items-center justify-between gap-8">
        {/* Zone 1: Official TradeSquare Logo */}
        <motion.a
          href="#"
          aria-label="TradeSquare Home"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className="inline-flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] rounded-sm"
        >
          <img
            src="/src/assets/images/TRADESQUARELOGO.png"
            alt="TradeSquare"
            referrerPolicy="no-referrer"
            className="h-7 w-auto object-contain block"
          />
        </motion.a>

        {/* Zone 2: Concise Apple-style 12px navigation links with animated underline */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center justify-center gap-7 lg:gap-9 text-[12px] font-normal tracking-[-0.01em] text-[#E8E8ED]/80"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] rounded-sm"
            >
              <span>{item.label}</span>
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#2997FF] origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out rounded-full"
              />
            </a>
          ))}
        </nav>

        {/* Zone 3: Theme Toggle + Single Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggleButton variant="navbar" />

          <motion.button
            type="button"
            onClick={onJoinClick}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className="hidden md:inline-flex items-center justify-center px-3.5 py-1 text-[12px] font-normal tracking-[-0.01em] text-white bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161617]"
          >
            Join Network
          </motion.button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 text-[#E8E8ED] hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] rounded-md"
          >
            {mobileOpen ? <X className="w-5 h-5" strokeWidth={1.75} /> : <Menu className="w-5 h-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* Scroll-linked subtle progress indicator */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: prefersReducedMotion ? 0 : smoothProgress, transformOrigin: 'left' }}
        className="h-[2px] w-full bg-gradient-to-r from-[#0071E3] via-[#2997FF] to-[#0071E3] opacity-85"
      />

      {/* Animated Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-[#161617] dark:bg-[#000000] border-t border-white/10 dark:border-[#2F3336] px-6 py-6 space-y-1"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col">
              {NAV_LINKS.map((item, idx) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="py-3 text-[22px] font-semibold tracking-tight text-[#F5F5F7] hover:text-white border-b border-white/10 transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <div className="pt-5">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onJoinClick();
                }}
                className="w-full min-h-[44px] py-2.5 px-5 text-[15px] font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full transition-colors cursor-pointer"
              >
                Join Network
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

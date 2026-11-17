import { useEffect } from 'react';
import {
  Briefcase,
  Building2,
  ChevronRight,
  Compass,
  Globe,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type {
  BusinessProfile,
  UserProfile,
  WorkspaceLanguage,
  WorkspacePage,
} from '../../types/workspace';
import { VerifiedBadge } from './VerifiedBadge';
import { useTheme } from '../../lib/theme';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
  user: UserProfile;
  business: BusinessProfile;
  onOpenModal: (modal: 'account' | 'settings' | 'help') => void;
  onChangeLanguage: (lang: WorkspaceLanguage) => void;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspacePage;
  label: string;
  icon: typeof Home;
  tint: string;
}> = [
  { id: 'home', label: 'Home', icon: Home, tint: 'bg-[#007AFF]' },
  { id: 'discover', label: 'Discover', icon: Compass, tint: 'bg-[#34C759]' },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase, tint: 'bg-[#FF9500]' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, tint: 'bg-[#5856D6]' },
  { id: 'my-business', label: 'My Business', icon: Building2, tint: 'bg-[#0866FF]' },
];

const LANGUAGES: Array<{ code: WorkspaceLanguage; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'rw', label: 'RW' },
];

const IOS_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 36,
  mass: 0.85,
};

export function AppSidebar({
  isOpen,
  onClose,
  activePage,
  onNavigate,
  user,
  business,
  onOpenModal,
  onChangeLanguage,
  onLogout,
}: AppSidebarProps) {
  const prefersReducedMotion = useReducedMotion();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  function handleNav(page: WorkspacePage) {
    onNavigate(page);
    if (window.innerWidth < 1024) {
      onClose();
    }
  }

  function handleUtilityModal(modal: 'account' | 'settings' | 'help') {
    onOpenModal(modal);
    if (window.innerWidth < 1024) {
      onClose();
    }
  }

  const locationLabel = [business.city, business.country].filter(Boolean).join(', ');

  return (
    <>
      {/* Animated Mobile / Tablet Frosted Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar-backdrop"
            aria-hidden="true"
            onClick={onClose}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 top-14 z-40 bg-black/25 dark:bg-black/65 backdrop-blur-[3px] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Collapsible iOS Frosted Glass Sidebar — starts completely collapsed with zero visible icons/labels */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="ios-sidebar"
            aria-label="Workspace navigation"
            initial={prefersReducedMotion ? false : { x: '-100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { x: '-100%', opacity: 0.6 }}
            transition={prefersReducedMotion ? { duration: 0.01 } : IOS_SPRING}
            className="fixed top-14 left-0 bottom-0 z-40 h-[calc(100dvh-3.5rem)] w-[min(286px,84vw)] lg:w-[260px] bg-[#F2F2F7]/95 dark:bg-[#000000]/94 backdrop-blur-2xl border-r border-black/[0.08] dark:border-[#2F3336] shadow-[0_16px_48px_rgba(0,0,0,0.14)] dark:shadow-[4px_0_32px_rgba(0,0,0,0.65)] lg:shadow-[4px_0_24px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden"
          >
            <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 px-3 py-2.5 sm:py-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain">
              <div className="space-y-2.5 sm:space-y-3 shrink-0">
                {/* Clean Business Identity Strip */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-[15px] font-semibold tracking-[-0.015em] leading-tight text-[#1D1D1F] dark:text-[#E7E9EA] truncate">
                        {business.name}
                      </p>
                      {business.verifiedRecord && <VerifiedBadge size="sm" />}
                    </div>
                    {locationLabel && (
                      <p className="text-[11.5px] leading-tight text-[#6E6E73] dark:text-[#71767B] truncate mt-0.5">
                        {locationLabel}
                      </p>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                    aria-label="Collapse sidebar"
                    className="w-7 h-7 rounded-full bg-black/[0.06] hover:bg-black/[0.11] dark:bg-[#202327] dark:hover:bg-[#2F3336] text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#71767B] dark:hover:text-[#E7E9EA] flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9BF0]"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.25} />
                  </motion.button>
                </div>

                {/* iOS Inset Grouped Primary Navigation */}
                <nav
                  aria-label="Primary sidebar links"
                  className="bg-white/95 dark:bg-[#16181C] rounded-2xl border border-black/[0.05] dark:border-[#2F3336] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none p-1 space-y-0.5"
                >
                  {NAV_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    const active = activePage === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => handleNav(item.id)}
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.24,
                          delay: prefersReducedMotion ? 0 : 0.03 + idx * 0.025,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                        className={`relative w-full min-h-[38px] flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-[13.5px] sm:text-[14px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9BF0] ${
                          active
                            ? 'text-[#007AFF] dark:text-[#1D9BF0] font-semibold'
                            : 'text-[#1D1D1F] dark:text-[#E7E9EA] font-medium hover:bg-black/[0.035] dark:hover:bg-[#202327]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="ios-sidebar-active-row"
                            transition={
                              prefersReducedMotion
                                ? { duration: 0.01 }
                                : { type: 'spring', stiffness: 420, damping: 34 }
                            }
                            className="absolute inset-0 rounded-xl bg-[#007AFF]/[0.1] dark:bg-[#1D9BF0]/[0.14]"
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-[7px] flex items-center justify-center shrink-0 transition-colors ${
                              active
                                ? `${item.tint} text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]`
                                : 'bg-[#F2F2F7] text-[#6E6E73] dark:bg-[#202327] dark:text-[#71767B]'
                            }`}
                          >
                            <Icon className="w-[14px] h-[14px]" strokeWidth={2} />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </span>
                        <ChevronRight
                          className={`relative z-10 w-3.5 h-3.5 shrink-0 transition-opacity ${
                            active
                              ? 'text-[#007AFF] dark:text-[#1D9BF0] opacity-80'
                              : 'text-[#C7C7CC] dark:text-[#71767B] opacity-70'
                          }`}
                        />
                      </motion.button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom iOS Inset Grouped Utilities */}
              <div className="space-y-2 shrink-0">
                <div className="bg-white/95 dark:bg-[#16181C] rounded-2xl border border-black/[0.05] dark:border-[#2F3336] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none divide-y divide-black/[0.05] dark:divide-[#2F3336] overflow-hidden">
                  <motion.button
                    type="button"
                    onClick={() => handleUtilityModal('account')}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                    className="w-full min-h-[36px] flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13.5px] font-medium text-[#1D1D1F] dark:text-[#E7E9EA] hover:bg-black/[0.03] dark:hover:bg-[#202327] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D9BF0]"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-[6px] bg-[#E5E5EA] text-[#3A3A3C] dark:bg-[#202327] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate">
                        {user.firstName} {user.lastName}
                      </span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] dark:text-[#71767B] shrink-0" />
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => handleUtilityModal('settings')}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                    className="w-full min-h-[36px] flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13.5px] font-medium text-[#1D1D1F] dark:text-[#E7E9EA] hover:bg-black/[0.03] dark:hover:bg-[#202327] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D9BF0]"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-[6px] bg-[#8E8E93] dark:bg-[#2F3336] text-white flex items-center justify-center shrink-0">
                        <Settings className="w-3.5 h-3.5" />
                      </span>
                      <span>Settings</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] dark:text-[#71767B] shrink-0" />
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => handleUtilityModal('help')}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                    className="w-full min-h-[36px] flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13.5px] font-medium text-[#1D1D1F] dark:text-[#E7E9EA] hover:bg-black/[0.03] dark:hover:bg-[#202327] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D9BF0]"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-[6px] bg-[#30B0C7] text-white flex items-center justify-center shrink-0">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                      <span>Help &amp; Support</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#C7C7CC] dark:text-[#71767B] shrink-0" />
                  </motion.button>

                  {/* iOS Segmented Appearance Switcher */}
                  <div className="min-h-[36px] flex items-center justify-between gap-2 px-2.5 py-1.5">
                    <span className="flex items-center gap-2.5 text-[13.5px] font-medium text-[#1D1D1F] dark:text-[#E7E9EA]">
                      <span className="w-6 h-6 rounded-[6px] bg-[#1D9BF0]/14 text-[#1D9BF0] flex items-center justify-center shrink-0">
                        {theme === 'dark' ? (
                          <Moon className="w-3.5 h-3.5" />
                        ) : (
                          <Sun className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span>Theme</span>
                    </span>
                    <div
                      role="group"
                      aria-label="Appearance theme"
                      className="inline-flex items-center bg-[#767680]/[0.12] dark:bg-[#000000] dark:border dark:border-[#2F3336] rounded-[8px] p-0.5"
                    >
                      {(['light', 'dark'] as const).map((mode) => {
                        const selected = theme === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setTheme(mode)}
                            aria-pressed={selected}
                            className={`relative px-2 py-0.5 text-[11px] font-semibold rounded-[6px] transition-colors cursor-pointer capitalize ${
                              selected
                                ? 'text-[#1D1D1F] dark:text-[#E7E9EA]'
                                : 'text-[#6E6E73] dark:text-[#71767B] hover:text-[#1D1D1F] dark:hover:text-[#E7E9EA]'
                            }`}
                          >
                            {selected && (
                              <motion.span
                                layoutId="ios-theme-segment"
                                transition={
                                  prefersReducedMotion
                                    ? { duration: 0.01 }
                                    : { type: 'spring', stiffness: 460, damping: 34 }
                                }
                                className="absolute inset-0 bg-white dark:bg-[#202327] rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                              />
                            )}
                            <span className="relative z-10">{mode}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* iOS Segmented Language Switcher */}
                  <div className="min-h-[36px] flex items-center justify-between gap-2 px-2.5 py-1.5">
                    <span className="flex items-center gap-2.5 text-[13.5px] font-medium text-[#1D1D1F] dark:text-[#E7E9EA]">
                      <span className="w-6 h-6 rounded-[6px] bg-[#007AFF]/12 dark:bg-[#1D9BF0]/14 text-[#007AFF] dark:text-[#1D9BF0] flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5" />
                      </span>
                      <span>Language</span>
                    </span>
                    <div
                      role="group"
                      aria-label="Language selection"
                      className="inline-flex items-center bg-[#767680]/[0.12] dark:bg-[#000000] dark:border dark:border-[#2F3336] rounded-[8px] p-0.5"
                    >
                      {LANGUAGES.map((lang) => {
                        const selected = user.language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => onChangeLanguage(lang.code)}
                            aria-pressed={selected}
                            className={`relative px-2 py-0.5 text-[11px] font-semibold rounded-[6px] transition-colors cursor-pointer ${
                              selected
                                ? 'text-[#1D1D1F] dark:text-[#E7E9EA]'
                                : 'text-[#6E6E73] dark:text-[#71767B] hover:text-[#1D1D1F] dark:hover:text-[#E7E9EA]'
                            }`}
                          >
                            {selected && (
                              <motion.span
                                layoutId="ios-lang-segment"
                                transition={
                                  prefersReducedMotion
                                    ? { duration: 0.01 }
                                    : { type: 'spring', stiffness: 460, damping: 34 }
                                }
                                className="absolute inset-0 bg-white dark:bg-[#202327] rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                              />
                            )}
                            <span className="relative z-10">{lang.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Standalone iOS Destructive Sign-out Row */}
                <motion.button
                  type="button"
                  onClick={onLogout}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                  className="w-full min-h-[38px] flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-white/95 hover:bg-red-50/80 dark:bg-[#16181C] dark:hover:bg-[#F4212E]/12 border border-black/[0.05] dark:border-[#2F3336] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none text-[13.5px] font-semibold text-[#FF3B30] dark:text-[#F4212E] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B30]"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Log out</span>
                </motion.button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Three-Button iOS Frosted Tab Bar (Strictly Home, Discover, Messages) */}
      <nav
        aria-label="Mobile workspace navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-white/85 dark:bg-black/85 backdrop-blur-xl border-t border-black/[0.08] dark:border-[#2F3336] grid grid-cols-3 items-center px-2"
      >
        {[
          { id: 'home' as WorkspacePage, label: 'Home', icon: Home },
          { id: 'discover' as WorkspacePage, label: 'Discover', icon: Compass },
          { id: 'messages' as WorkspacePage, label: 'Messages', icon: MessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              className={`relative flex flex-col items-center justify-center gap-1 h-12 rounded-xl transition-colors cursor-pointer ${
                active
                  ? 'text-[#007AFF] dark:text-[#1D9BF0]'
                  : 'text-[#6E6E73] dark:text-[#71767B]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="ios-mobile-tab-indicator"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.01 }
                      : { type: 'spring', stiffness: 450, damping: 34 }
                  }
                  className="absolute inset-x-3 inset-y-1 rounded-xl bg-[#007AFF]/[0.08] dark:bg-[#1D9BF0]/[0.14]"
                />
              )}
              <Icon className="relative z-10 w-5 h-5" strokeWidth={active ? 2.2 : 1.75} />
              <span className="relative z-10 text-[11px] font-medium leading-none">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  X,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from 'motion/react';
import type {
  BusinessProfile,
  OpportunityRecord,
  OpportunityStatus,
  OpportunityType,
  SessionPayload,
  UserProfile,
  WorkspaceLanguage,
  WorkspacePage,
} from '../../types/workspace';
import { AppSidebar } from './AppSidebar';
import { AuthenticatedHomeView } from './AuthenticatedHomeView';
import { DiscoverView } from './DiscoverView';
import { MessagesView } from './MessagesView';
import { MyBusinessView } from './MyBusinessView';
import { OpportunitiesView } from './OpportunitiesView';
import { OpportunityDetailModal } from './OpportunityDetailModal';
import { PublishOpportunityPage } from './PublishOpportunityPage';
import { VerifiedBadge } from './VerifiedBadge';
import { ThemeToggleButton } from '../ThemeToggle';
import { authFetch } from '../../lib/authClient';
import { useTheme } from '../../lib/theme';

interface AuthenticatedWorkspaceProps {
  initialSession: SessionPayload;
  initialPage?: WorkspacePage;
  onPageChange?: (page: WorkspacePage) => void;
  onLoggedOut: () => void;
}

export function AuthenticatedWorkspace({
  initialSession,
  initialPage = 'home',
  onPageChange,
  onLoggedOut,
}: AuthenticatedWorkspaceProps) {
  const [user, setUser] = useState<UserProfile>(initialSession.user);
  const [business, setBusiness] = useState<BusinessProfile>(initialSession.business);

  // Left sidebar starts open by default
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState<WorkspacePage>(initialPage);

  useEffect(() => {
    setActivePage(initialPage);
  }, [initialPage]);

  const navigatePage = useCallback(
    (page: WorkspacePage) => {
      setActivePage(page);
      onPageChange?.(page);
    },
    [onPageChange]
  );

  // Discover pre-filters
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverType, setDiscoverType] = useState('All');

  // Opportunities state
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null);
  const [busyOpportunityId, setBusyOpportunityId] = useState<string | null>(null);

  // Modals & Messages routing
  const [publishInitialType, setPublishInitialType] = useState<OpportunityType>('Buyer Request');
  const [publishDraftId, setPublishDraftId] = useState<string | null>(null);
  const [detailOpportunity, setDetailOpportunity] = useState<OpportunityRecord | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [utilityModal, setUtilityModal] = useState<'account' | 'settings' | 'help' | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [topSearch, setTopSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [fbMenuOpen, setFbMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const rightActionsRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFbMenuOpen(false);
        setAccountMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      if (rightActionsRef.current && !rightActionsRef.current.contains(e.target as Node)) {
        setFbMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  const [activityVersion, setActivityVersion] = useState(0);

  // Account edit state inside Account modal
  const [editFirstName, setEditFirstName] = useState(user.firstName);
  const [editLastName, setEditLastName] = useState(user.lastName);

  const loadOpportunities = useCallback(async () => {
    setOpportunitiesLoading(true);
    setOpportunitiesError(null);
    try {
      const [allRes, mineRes] = await Promise.all([
        authFetch('/api/opportunities'),
        authFetch('/api/opportunities?scope=mine'),
      ]);
      if (allRes.status === 401 || mineRes.status === 401) {
        onLoggedOut();
        return;
      }
      const allData = await allRes.json();
      const mineData = await mineRes.json();
      if (!allRes.ok) {
        throw new Error(allData.error || 'Failed to load opportunities.');
      }
      if (!mineRes.ok) {
        throw new Error(mineData.error || 'Failed to load your opportunities.');
      }
      const byId = new Map<string, OpportunityRecord>();
      for (const opp of [...(allData.opportunities ?? []), ...(mineData.opportunities ?? [])] as OpportunityRecord[]) {
        byId.set(opp.id, { ...opp, status: opp.status ?? 'published' });
      }
      setOpportunities(
        Array.from(byId.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err: unknown) {
      setOpportunitiesError(
        err instanceof Error ? err.message : 'Unable to fetch opportunities from server.'
      );
    } finally {
      setOpportunitiesLoading(false);
    }
  }, [onLoggedOut]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  function showToast(kind: 'success' | 'error', text: string) {
    setToast({ kind, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  }

  async function handleLogout() {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      onLoggedOut();
    }
  }

  async function handleChangeLanguage(language: WorkspaceLanguage) {
    try {
      const res = await authFetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        showToast('success', 'Language preference updated.');
      }
    } catch {
      showToast('error', 'Unable to update language preference.');
    }
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await authFetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUtilityModal(null);
        showToast('success', 'Account details updated.');
      }
    } catch {
      showToast('error', 'Unable to update account details.');
    }
  }

  async function handleToggleSave(opp: OpportunityRecord) {
    setBusyOpportunityId(opp.id);
    try {
      const res = await authFetch(`/api/opportunities/${opp.id}/save`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update saved state.');
      setOpportunities((prev) =>
        prev.map((item) =>
          item.id === opp.id ? { ...item, savedByMe: Boolean(data.saved) } : item
        )
      );
      setActivityVersion((v) => v + 1);
      showToast('success', data.saved ? 'Opportunity saved.' : 'Removed from saved opportunities.');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyOpportunityId(null);
    }
  }

  async function handleManageOpportunityStatus(opp: OpportunityRecord, status: OpportunityStatus) {
    setBusyOpportunityId(opp.id);
    try {
      const res = await authFetch(`/api/opportunities/${opp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update opportunity status.');
      setOpportunities((prev) =>
        prev.map((item) => (item.id === opp.id ? { ...item, ...data.opportunity } : item)),
      );
      showToast(
        'success',
        status === 'published'
          ? 'Opportunity resumed and published.'
          : status === 'paused'
            ? 'Opportunity paused.'
            : status === 'closed'
              ? 'Opportunity closed.'
              : status === 'fulfilled'
                ? 'Marked as fulfilled.'
                : 'Opportunity updated.',
      );
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Unable to update status.');
    } finally {
      setBusyOpportunityId(null);
    }
  }

  async function handleExpressInterest(opp: OpportunityRecord) {
    setBusyOpportunityId(opp.id);
    try {
      const res = await authFetch(`/api/opportunities/${opp.id}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        onLoggedOut();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send interest.');
      setOpportunities((prev) =>
        prev.map((item) =>
          item.id === opp.id ? { ...item, interestExpressedByMe: true } : item
        )
      );
      if (detailOpportunity?.id === opp.id) {
        setDetailOpportunity({ ...detailOpportunity, interestExpressedByMe: true });
      }
      setActivityVersion((v) => v + 1);
      showToast('success', `Enquiry sent to ${opp.businessName}.`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Unable to send interest.');
    } finally {
      setBusyOpportunityId(null);
    }
  }

  async function handleContactOpportunity(opp: OpportunityRecord) {
    setBusyOpportunityId(opp.id);
    try {
      const res = await authFetch(`/api/opportunities/${opp.id}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Hello ${opp.businessName}, ${business.name} would like to connect regarding "${opp.productOrService}".`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to open message thread.');
      setDetailOpportunity(null);
      setActiveThreadId(data.threadId);
      navigatePage('messages');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Unable to contact business.');
    } finally {
      setBusyOpportunityId(null);
    }
  }

  async function handleConnectBusiness(targetBiz: BusinessProfile) {
    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientBusinessId: targetBiz.id,
          subject: `Commercial Introduction — ${business.name}`,
          body: `Hello ${targetBiz.name}, ${business.name} (${business.city}, ${business.country}) would like to explore commercial collaboration.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to start conversation.');
      setActiveThreadId(data.threadId);
      navigatePage('messages');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Unable to connect right now.');
    }
  }

  function handleOpenDiscover(q = '', type = 'All') {
    setDiscoverQuery(q);
    setDiscoverType(type);
    navigatePage('discover');
  }

  const topNavTabs: Array<{ id: WorkspacePage; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'my-business', label: 'My Business', icon: Building2 },
  ];

  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() || 'TS';

  return (
    <MotionConfig reducedMotion="user">
      <div className="ts-app-shell min-h-screen bg-[#F0F2F5] dark:bg-[#000000] text-[#050505] dark:text-[#E7E9EA] flex flex-col transition-colors duration-200">
        {/* 100% Facebook-Style 56px 3-Zone Logged-In Header */}
        <header className="sticky top-0 z-40 h-14 bg-white dark:bg-[#000000] border-b border-[#E4E6EB] dark:border-[#2F3336] shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-none px-3 sm:px-4 flex items-center justify-between gap-2 md:grid md:grid-cols-12 transition-colors duration-200">
          {/* LEFT ZONE: Sidebar Toggle + Facebook Blue Circular Brand Mark + Pill Search */}
          <div className="md:col-span-3 flex items-center gap-2 min-w-0">
            <motion.button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              aria-expanded={sidebarOpen}
              aria-label={sidebarOpen ? 'Collapse navigation sidebar' : 'Expand navigation sidebar'}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF] dark:focus-visible:ring-[#1D9BF0] ${
                sidebarOpen
                  ? 'bg-[#E7F3FF] text-[#0866FF] dark:bg-[#1D9BF0]/20 dark:text-[#1D9BF0]'
                  : 'bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] dark:bg-[#202327] dark:hover:bg-[#2F3336] dark:text-[#E7E9EA]'
              }`}
            >
              <PanelLeft className="w-[18px] h-[18px]" strokeWidth={2} />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigatePage('home')}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              aria-label="TradeSquare Home"
              title="TradeSquare"
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF] dark:focus-visible:ring-[#1D9BF0]"
            >
              <img
                src="/src/assets/images/TRADESQUARELOGO.png"
                alt="TradeSquare"
                referrerPolicy="no-referrer"
                className="h-9 w-9 object-contain block"
              />
            </motion.button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOpenDiscover(topSearch.trim(), 'All');
              }}
              className="hidden lg:flex items-center relative flex-1 max-w-[240px]"
            >
              <Search className="w-4 h-4 text-[#65676B] dark:text-[#71767B] absolute left-3.5 pointer-events-none" />
              <input
                type="search"
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                placeholder="Search TradeSquare"
                aria-label="Search TradeSquare"
                className="w-full h-10 pl-10 pr-4 rounded-full bg-[#F0F2F5] dark:bg-[#202327] text-[15px] text-[#050505] dark:text-[#E7E9EA] placeholder:text-[#65676B] dark:placeholder:text-[#71767B] transition-colors focus:outline-none focus:bg-[#E4E6EB]/75 dark:focus:bg-[#16181C] dark:focus:ring-1 dark:focus:ring-[#2F3336]"
              />
            </form>

            <motion.button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              aria-label="Search TradeSquare"
              title="Search TradeSquare"
              className="lg:hidden w-10 h-10 rounded-full bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] dark:bg-[#202327] dark:hover:bg-[#2F3336] dark:text-[#E7E9EA] flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF]"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={2.1} />
            </motion.button>
          </div>

          {/* CENTER ZONE: Facebook 5 Wide Icon Navigation Tabs + 3px Bottom Blue Bar */}
          <div className="hidden md:flex md:col-span-6 items-center justify-center h-full">
            <nav
              aria-label="Workspace top navigation"
              className="flex items-center justify-center w-full max-w-[580px] h-full gap-1"
            >
              {topNavTabs.map((tab) => {
                const Icon = tab.icon;
                const active =
                  activePage === tab.id ||
                  (tab.id === 'opportunities' && activePage === 'publish-opportunity');
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => navigatePage(tab.id)}
                    aria-label={tab.label}
                    aria-current={active ? 'page' : undefined}
                    className="group relative flex-1 max-w-[112px] h-full flex items-center justify-center cursor-pointer focus-visible:outline-none"
                  >
                    <span
                      className={`w-full h-12 rounded-lg flex items-center justify-center transition-colors ${
                        active
                          ? 'text-[#0866FF] dark:text-[#1D9BF0]'
                          : 'text-[#65676B] dark:text-[#71767B] group-hover:bg-[#F2F2F2] dark:group-hover:bg-[#16181C] group-hover:text-[#050505] dark:group-hover:text-[#E7E9EA]'
                      }`}
                    >
                      <Icon className="w-[24px] h-[24px]" strokeWidth={active ? 2.25 : 1.85} />
                    </span>

                    {active && (
                      <motion.span
                        layoutId="fb-workspace-active-tab"
                        transition={
                          prefersReducedMotion
                            ? { duration: 0.01 }
                            : { type: 'spring', stiffness: 460, damping: 36 }
                        }
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0866FF] dark:bg-[#1D9BF0] rounded-t-xs"
                      />
                    )}

                    {/* Facebook-Style Hover Tooltip */}
                    <span
                      role="tooltip"
                      className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 absolute top-[54px] left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#050505]/85 dark:bg-[#2F3336] text-white text-[12px] font-medium whitespace-nowrap shadow-md z-50"
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* RIGHT ZONE: Facebook Circular Action Buttons (Menu, Publish, Messages, Theme, Avatar) */}
          <div
            ref={rightActionsRef}
            className="md:col-span-3 flex items-center justify-end gap-2 shrink-0 relative"
          >
            {/* 9-Dot Menu Button */}
            <motion.button
              type="button"
              onClick={() => {
                setAccountMenuOpen(false);
                setFbMenuOpen((prev) => !prev);
              }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              aria-expanded={fbMenuOpen}
              aria-label="Menu"
              title="Menu"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF] ${
                fbMenuOpen
                  ? 'bg-[#E7F3FF] text-[#0866FF] dark:bg-[#1D9BF0]/20 dark:text-[#1D9BF0]'
                  : 'bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] dark:bg-[#202327] dark:hover:bg-[#2F3336] dark:text-[#E7E9EA]'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
                <circle cx="5" cy="5" r="2.1" />
                <circle cx="12" cy="5" r="2.1" />
                <circle cx="19" cy="5" r="2.1" />
                <circle cx="5" cy="12" r="2.1" />
                <circle cx="12" cy="12" r="2.1" />
                <circle cx="19" cy="12" r="2.1" />
                <circle cx="5" cy="19" r="2.1" />
                <circle cx="12" cy="19" r="2.1" />
                <circle cx="19" cy="19" r="2.1" />
              </svg>
            </motion.button>

            {/* Quick Publish Circular Button */}
            <motion.button
              type="button"
              onClick={() => {
                setFbMenuOpen(false);
                setAccountMenuOpen(false);
                setPublishDraftId(null);
                setPublishInitialType('Buyer Request');
                navigatePage('publish-opportunity');
              }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              title="Publish Opportunity"
              aria-label="Publish Opportunity"
              className="w-10 h-10 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] dark:bg-[#202327] dark:hover:bg-[#2F3336] dark:text-[#E7E9EA] flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF]"
            >
              <Plus className="w-[20px] h-[20px]" strokeWidth={2.2} />
            </motion.button>

            {/* Messages Circular Button */}
            <motion.button
              type="button"
              onClick={() => {
                setFbMenuOpen(false);
                setAccountMenuOpen(false);
                navigatePage('messages');
              }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              title="Messages"
              aria-label="Messages"
              className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF] ${
                activePage === 'messages'
                  ? 'bg-[#E7F3FF] text-[#0866FF] dark:bg-[#1D9BF0]/20 dark:text-[#1D9BF0]'
                  : 'bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] dark:bg-[#202327] dark:hover:bg-[#2F3336] dark:text-[#E7E9EA]'
              }`}
            >
              <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2} />
            </motion.button>

            {/* Theme Toggle Circle */}
            <ThemeToggleButton variant="topbar" />

            {/* Profile Avatar Circle with Facebook Mini Chevron Badge */}
            <motion.button
              type="button"
              onClick={() => {
                setFbMenuOpen(false);
                setAccountMenuOpen((prev) => !prev);
              }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
              aria-expanded={accountMenuOpen}
              aria-label="Account menu"
              title={`${user.firstName} ${user.lastName}`}
              className="relative w-10 h-10 rounded-full bg-[#0866FF]/12 hover:bg-[#0866FF]/18 text-[#0866FF] dark:bg-[#1D9BF0]/20 dark:hover:bg-[#1D9BF0]/30 dark:text-[#1D9BF0] text-[13px] font-bold flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF]"
            >
              <span>{userInitials}</span>
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E4E6EB] dark:bg-[#202327] border-2 border-white dark:border-[#000000] text-[#050505] dark:text-[#E7E9EA] flex items-center justify-center"
              >
                <ChevronDown className="w-2.5 h-2.5" strokeWidth={2.75} />
              </span>
            </motion.button>

            {/* Facebook 9-Dot Menu Popover */}
            <AnimatePresence>
              {fbMenuOpen && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 6 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-[48px] right-0 w-[300px] sm:w-[340px] bg-[#F7F8FA] dark:bg-[#16181C] rounded-xl border border-[#E4E6EB] dark:border-[#2F3336] shadow-[0_12px_28px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.75)] p-3 z-50"
                >
                  <div className="px-1.5 pb-2.5 flex items-center justify-between">
                    <span className="text-[20px] font-bold tracking-tight text-[#050505] dark:text-[#E7E9EA]">
                      Menu
                    </span>
                    <button
                      type="button"
                      onClick={() => setFbMenuOpen(false)}
                      aria-label="Close menu"
                      className="w-8 h-8 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-[#202327] dark:hover:bg-[#2F3336] text-[#65676B] dark:text-[#E7E9EA] flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-white dark:bg-[#000000] rounded-xl border border-[#E4E6EB] dark:border-[#2F3336] p-2 space-y-0.5">
                    <p className="px-2.5 py-1.5 text-[12px] font-semibold text-[#65676B] dark:text-[#71767B]">
                      Workspace Navigation
                    </p>
                    {topNavTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isCurrent =
                        activePage === tab.id ||
                        (tab.id === 'opportunities' && activePage === 'publish-opportunity');
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            navigatePage(tab.id);
                            setFbMenuOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-lg flex items-center gap-3 text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-[#E7F3FF] dark:bg-[#1D9BF0]/15 text-[#0866FF] dark:text-[#1D9BF0]'
                              : 'hover:bg-[#F2F2F2] dark:hover:bg-[#16181C] text-[#050505] dark:text-[#E7E9EA]'
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              isCurrent
                                ? 'bg-[#0866FF] text-white dark:bg-[#1D9BF0]'
                                : 'bg-[#E4E6EB] dark:bg-[#202327] text-[#050505] dark:text-[#E7E9EA]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-[14px] font-semibold">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 bg-white dark:bg-[#000000] rounded-xl border border-[#E4E6EB] dark:border-[#2F3336] p-2 space-y-0.5">
                    <p className="px-2.5 py-1.5 text-[12px] font-semibold text-[#65676B] dark:text-[#71767B]">
                      Create
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFbMenuOpen(false);
                        setPublishDraftId(null);
                setPublishInitialType('Buyer Request');
                navigatePage('publish-opportunity');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#16181C] flex items-center gap-3 text-left transition-colors cursor-pointer"
                    >
                      <span className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#202327] text-[#050505] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-[#050505] dark:text-[#E7E9EA]">
                          Post Buyer Request
                        </span>
                        <span className="block text-[12px] text-[#65676B] dark:text-[#71767B]">
                          Source suppliers across regional corridors
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFbMenuOpen(false);
                        setPublishDraftId(null);
                        setPublishInitialType('Supplier Offer');
                        navigatePage('publish-opportunity');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#16181C] flex items-center gap-3 text-left transition-colors cursor-pointer"
                    >
                      <span className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#202327] text-[#050505] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-[#050505] dark:text-[#E7E9EA]">
                          Post Supplier Offer
                        </span>
                        <span className="block text-[12px] text-[#65676B] dark:text-[#71767B]">
                          Publish production &amp; export capacity
                        </span>
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Facebook Account Dropdown Popover */}
            <AnimatePresence>
              {accountMenuOpen && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 6 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-[48px] right-0 w-[300px] sm:w-[320px] bg-white dark:bg-[#16181C] rounded-xl border border-[#E4E6EB] dark:border-[#2F3336] shadow-[0_12px_28px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.75)] p-2.5 z-50"
                >
                  {/* Profile Switcher Card */}
                  <div className="rounded-xl bg-white dark:bg-[#000000] border border-[#E4E6EB] dark:border-[#2F3336] shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-none p-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigatePage('my-business');
                        setAccountMenuOpen(false);
                      }}
                      className="w-full p-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#16181C] flex items-center gap-3 text-left transition-colors cursor-pointer"
                    >
                      <span className="w-9 h-9 rounded-full bg-[#0866FF]/12 text-[#0866FF] dark:bg-[#1D9BF0]/20 dark:text-[#1D9BF0] text-[13px] font-bold flex items-center justify-center shrink-0">
                        {userInitials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 min-w-0">
                          <span className="text-[15px] font-semibold text-[#050505] dark:text-[#E7E9EA] truncate">
                            {business.name}
                          </span>
                          {business.verifiedRecord && <VerifiedBadge size="sm" />}
                        </span>
                        <span className="block text-[12.5px] text-[#65676B] dark:text-[#71767B] truncate">
                          {user.firstName} {user.lastName}
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* Account Action Rows */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setEditFirstName(user.firstName);
                        setEditLastName(user.lastName);
                        setUtilityModal('account');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#202327] flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#202327] text-[#050505] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </span>
                        <span className="text-[14.5px] font-medium text-[#050505] dark:text-[#E7E9EA]">
                          Account Profile
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#65676B] dark:text-[#71767B]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setUtilityModal('settings');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#202327] flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#202327] text-[#050505] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                          <Settings className="w-4 h-4" />
                        </span>
                        <span className="text-[14.5px] font-medium text-[#050505] dark:text-[#E7E9EA]">
                          Settings &amp; Privacy
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#65676B] dark:text-[#71767B]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#202327] flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#202327] text-[#050505] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                          {theme === 'dark' ? (
                            <Sun className="w-4 h-4" />
                          ) : (
                            <Moon className="w-4 h-4" />
                          )}
                        </span>
                        <span className="text-[14.5px] font-medium text-[#050505] dark:text-[#E7E9EA]">
                          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                      </span>
                      <span className="text-[12px] font-medium text-[#65676B] dark:text-[#71767B]">
                        {theme === 'dark' ? 'Lights Out' : 'Off'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setUtilityModal('help');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#202327] flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#202327] text-[#050505] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </span>
                        <span className="text-[14.5px] font-medium text-[#050505] dark:text-[#E7E9EA]">
                          Help &amp; Support
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#65676B] dark:text-[#71767B]" />
                    </button>

                    <div className="my-1 border-t border-[#E4E6EB] dark:border-[#2F3336]" />

                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#202327] flex items-center gap-3 text-left transition-colors cursor-pointer"
                    >
                      <span className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#202327] text-[#050505] dark:text-[#E7E9EA] flex items-center justify-center shrink-0">
                        <LogOut className="w-4 h-4" />
                      </span>
                      <span className="text-[14.5px] font-medium text-[#050505] dark:text-[#E7E9EA]">
                        Log out
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expandable Facebook-Style Search Bar Overlay on Small & Medium Screens */}
          <AnimatePresence>
            {mobileSearchOpen && (
              <motion.form
                key="mobile-search-overlay"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleOpenDiscover(topSearch.trim(), 'All');
                  setMobileSearchOpen(false);
                }}
                className="lg:hidden absolute inset-0 z-50 bg-white dark:bg-[#000000] px-3 flex items-center gap-2 border-b border-[#E4E6EB] dark:border-[#2F3336]"
              >
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  aria-label="Close search"
                  className="w-9 h-9 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#202327] text-[#65676B] dark:text-[#E7E9EA] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#65676B] dark:text-[#71767B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={mobileSearchInputRef}
                    type="search"
                    value={topSearch}
                    onChange={(e) => setTopSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setMobileSearchOpen(false);
                      }
                    }}
                    placeholder="Search TradeSquare"
                    aria-label="Search TradeSquare"
                    className="w-full h-10 pl-10 pr-4 rounded-full bg-[#F0F2F5] dark:bg-[#202327] text-[15px] text-[#050505] dark:text-[#E7E9EA] placeholder:text-[#65676B] dark:placeholder:text-[#71767B] focus:outline-none"
                  />
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </header>

      {/* Collapsible Fixed Left Sidebar (starts open by default) + Mobile 3-button Bottom Nav */}
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePage={activePage}
        onNavigate={navigatePage}
        user={user}
        business={business}
        onOpenModal={(m) => {
          setEditFirstName(user.firstName);
          setEditLastName(user.lastName);
          setUtilityModal(m);
        }}
        onChangeLanguage={handleChangeLanguage}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <main
        className={`flex-1 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pb-20 md:pb-10 ${
          sidebarOpen ? 'lg:pl-[260px]' : 'lg:pl-0'
        }`}
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activePage === 'home' && (
            <AuthenticatedHomeView
              user={user}
              business={business}
              onNavigate={navigatePage}
              onOpenDiscover={handleOpenDiscover}
              onOpenPublish={(t) => {
                setPublishDraftId(null);
                setPublishInitialType(t ?? 'Buyer Request');
                navigatePage('publish-opportunity');
              }}
              onViewOpportunity={setDetailOpportunity}
              onContactOpportunity={handleContactOpportunity}
              onExpressInterest={handleExpressInterest}
              onToggleSave={handleToggleSave}
              onConnectBusiness={handleConnectBusiness}
              opportunities={opportunities}
              opportunitiesLoading={opportunitiesLoading}
              opportunitiesError={opportunitiesError}
              onReloadOpportunities={loadOpportunities}
              busyOpportunityId={busyOpportunityId}
              activityVersion={activityVersion}
            />
          )}

          {activePage === 'discover' && (
            <DiscoverView
              initialQuery={discoverQuery}
              initialBusinessType={discoverType}
              onViewOpportunity={setDetailOpportunity}
              onContactOpportunity={handleContactOpportunity}
              onExpressInterest={handleExpressInterest}
              onToggleSave={handleToggleSave}
              onConnectBusiness={handleConnectBusiness}
              busyOpportunityId={busyOpportunityId}
            />
          )}

          {activePage === 'opportunities' && (
            <OpportunitiesView
              opportunities={opportunities}
              loading={opportunitiesLoading}
              onOpenPublish={(t) => {
                setPublishDraftId(null);
                setPublishInitialType(t ?? 'Buyer Request');
                navigatePage('publish-opportunity');
              }}
              onResumeDraft={(opp) => {
                setPublishDraftId(opp.id);
                setPublishInitialType(opp.type);
                navigatePage('publish-opportunity');
              }}
              onManageStatus={handleManageOpportunityStatus}
              onViewOpportunity={setDetailOpportunity}
              onContactOpportunity={handleContactOpportunity}
              onExpressInterest={handleExpressInterest}
              onToggleSave={handleToggleSave}
              busyOpportunityId={busyOpportunityId}
            />
          )}

          {activePage === 'messages' && (
            <MessagesView user={user} initialThreadId={activeThreadId} />
          )}

          {activePage === 'my-business' && (
            <MyBusinessView
              business={business}
              opportunities={opportunities}
              onOpenPublish={(t) => {
                setPublishDraftId(null);
                setPublishInitialType(t ?? 'Buyer Request');
                navigatePage('publish-opportunity');
              }}
              onViewOpportunity={setDetailOpportunity}
              onShowToast={showToast}
              onUpdated={(updated) => {
                setBusiness(updated);
                showToast('success', 'Business profile updated.');
              }}
            />
          )}

          {activePage === 'publish-opportunity' && (
            <PublishOpportunityPage
              key={publishDraftId ?? `new-${publishInitialType}`}
              initialType={publishInitialType}
              defaultIndustry={business.industry}
              businessName={business.name}
              businessLocation={[business.city, business.country].filter(Boolean).join(', ')}
              businessLogoUrl={business.logoUrl}
              verifiedRecord={business.verifiedRecord}
              draftToResume={
                publishDraftId
                  ? opportunities.find((o) => o.id === publishDraftId) ?? null
                  : null
              }
              onCancel={() => {
                setPublishDraftId(null);
                navigatePage('home');
              }}
              onPublishedNavigate={() => {
                setPublishDraftId(null);
                navigatePage('opportunities');
              }}
              onCreated={(opp) => {
                setOpportunities((prev) => {
                  const without = prev.filter((o) => o.id !== opp.id);
                  return [opp, ...without];
                });
                showToast('success', `Published ${opp.type}: ${opp.productOrService}`);
              }}
              onUpdated={(opp) => {
                setOpportunities((prev) => {
                  const without = prev.filter((o) => o.id !== opp.id);
                  return [opp, ...without];
                });
              }}
            />
          )}
        </div>
      </main>

      {/* Modals */}

      {detailOpportunity && (
        <OpportunityDetailModal
          opportunity={detailOpportunity}
          onClose={() => setDetailOpportunity(null)}
          onContact={handleContactOpportunity}
          onExpressInterest={handleExpressInterest}
        />
      )}

      {utilityModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 dark:bg-[#5B7083]/40 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUtilityModal(null);
          }}
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#16181C] rounded-2xl border border-[#E2E8F0] dark:border-[#2F3336] p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setUtilityModal(null)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg text-[#64748B] dark:text-[#71767B] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] dark:hover:text-[#E7E9EA] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {utilityModal === 'account' && (
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <h2 className="text-lg font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  Account Profile
                </h2>
                <p className="text-xs text-[#525866] dark:text-[#71767B]">{user.email}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="acc-first"
                      className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1"
                    >
                      First Name
                    </label>
                    <input
                      id="acc-first"
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full min-h-[40px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] dark:text-[#E7E9EA] px-3 text-sm focus:outline-none focus:border-[#1D9BF0]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="acc-last"
                      className="block text-xs font-medium text-[#334155] dark:text-[#E7E9EA] mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      id="acc-last"
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full min-h-[40px] rounded-lg border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] dark:text-[#E7E9EA] px-3 text-sm focus:outline-none focus:border-[#1D9BF0]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUtilityModal(null)}
                    className="px-4 py-2 text-xs font-medium text-[#525866] dark:text-[#71767B] dark:hover:text-[#E7E9EA] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] rounded-lg cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {utilityModal === 'settings' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  Workspace Settings
                </h2>
                <div className="p-3.5 rounded-xl bg-[#F3F6F8] dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#191919] dark:text-[#E7E9EA]">Appearance</span>
                    <div
                      role="group"
                      aria-label="Appearance mode"
                      className="inline-flex items-center rounded-lg bg-[#E2E8F0] dark:bg-[#16181C] p-0.5 border border-transparent dark:border-[#2F3336]"
                    >
                      {(['light', 'dark'] as const).map((mode) => {
                        const selected = theme === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setTheme(mode)}
                            aria-pressed={selected}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer ${
                              selected
                                ? 'bg-white text-[#191919] dark:bg-[#1D9BF0] dark:text-white shadow-xs'
                                : 'text-[#525866] dark:text-[#71767B] hover:text-[#191919] dark:hover:text-[#E7E9EA]'
                            }`}
                          >
                            {mode === 'dark' ? 'Dark (Lights Out)' : 'Light'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#2F3336]">
                    <span className="font-medium text-[#191919] dark:text-[#E7E9EA]">Language</span>
                    <select
                      value={user.language}
                      onChange={(e) => handleChangeLanguage(e.target.value as WorkspaceLanguage)}
                      className="rounded-md border border-[#CBD5E1] dark:border-[#2F3336] bg-white dark:bg-[#16181C] dark:text-[#E7E9EA] px-2.5 py-1 text-xs"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="rw">Kinyarwanda</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#2F3336]">
                    <span className="font-medium text-[#191919] dark:text-[#E7E9EA]">Primary Market</span>
                    <span className="text-[#525866] dark:text-[#71767B]">{business.country}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityModal(null);
                      navigatePage('my-business');
                    }}
                    className="text-xs font-semibold text-[#0A66C2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
                  >
                    Edit My Business Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:text-[#F4212E] dark:bg-[#F4212E]/10 dark:hover:bg-[#F4212E]/20 rounded-lg cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}

            {utilityModal === 'help' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#191919] dark:text-[#E7E9EA]">
                  Help &amp; Support
                </h2>
                <p className="text-sm text-[#525866] dark:text-[#71767B] leading-relaxed">
                  TradeSquare helps businesses across Rwanda and East Africa discover verified
                  commercial opportunities.
                </p>
                <ul className="text-xs text-[#334155] dark:text-[#E7E9EA] space-y-2 pt-2 border-t border-[#E8EDF2] dark:border-[#2F3336]">
                  <li>· Complete your My Business profile so counterparties understand your capacity.</li>
                  <li>· Publish a Buyer Request or Supplier Offer from Home or Opportunities.</li>
                  <li>· Use TradeSquare AI on the right panel to interpret market or partner criteria.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-blocking Toast Feedback */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
            toast.kind === 'success'
              ? 'bg-white border-[#E2E8F0] text-[#191919] dark:bg-[#16181C] dark:border-[#2F3336] dark:text-[#E7E9EA]'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-[#16181C] dark:border-[#F4212E]/40 dark:text-[#F4212E]'
          }`}
        >
          {toast.kind === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#0A66C2] dark:text-[#1D9BF0] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-[#F4212E] shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
      </div>
    </MotionConfig>
  );
}

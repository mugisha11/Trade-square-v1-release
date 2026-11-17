import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { motion, MotionConfig, useReducedMotion, type Variants } from 'motion/react';
import { Navbar } from './components/Navbar';
import { ResilientImage } from './components/ResilientImage';
import { EconomicProblemTimeline } from './components/EconomicProblemTimeline';
import { TradeSquareApproachSection } from './components/TradeSquareApproachSection';
import { FaqSection } from './components/FaqSection';
import { JoinNetworkSection } from './components/JoinNetworkSection';
import { Footer } from './components/Footer';
import { AuthPage } from './components/AuthPage';
import { AuthenticatedWorkspace } from './components/app/AuthenticatedWorkspace';
import { authFetch, setStoredSessionToken } from './lib/authClient';
import { REGIONAL_CORRIDORS } from './data/networkData';
import type { SessionPayload, WorkspacePage } from './types/workspace';

const WORKSPACE_ROUTE_TO_PAGE: Record<string, WorkspacePage> = {
  '/home': 'home',
  '/discover': 'discover',
  '/opportunities': 'opportunities',
  '/messages': 'messages',
  '/my-business': 'my-business',
  '/profile': 'my-business',
};

const PAGE_TO_WORKSPACE_ROUTE: Record<WorkspacePage, string> = {
  home: '/home',
  discover: '/discover',
  opportunities: '/opportunities',
  messages: '/messages',
  'my-business': '/my-business',
};

function normalizePathname(raw: string): string {
  if (!raw || raw === '/') return '/';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

const CORRIDOR_GRID_VARIANTS: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.08,
    },
  },
};

const CORRIDOR_CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function App() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [pathname, setPathname] = useState<string>(() =>
    normalizePathname(window.location.pathname)
  );

  const [heroPaused, setHeroPaused] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const showcaseVideoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const navigateTo = useCallback((targetPath: string, replace = false) => {
    const normalized = normalizePathname(targetPath);
    if (window.location.pathname !== normalized) {
      if (replace) {
        window.history.replaceState(null, '', normalized);
      } else {
        window.history.pushState(null, '', normalized);
      }
    }
    setPathname(normalized);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPathname(normalizePathname(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    authFetch('/api/auth/session')
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            setStoredSessionToken(null);
          }
          return null;
        }
        const data = await res.json();
        if (data?.authenticated && data.user && data.business) {
          return { user: data.user, business: data.business } as SessionPayload;
        }
        return null;
      })
      .catch(() => null)
      .then((loaded) => {
        if (!cancelled) {
          setSession(loaded);
          setSessionChecked(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    if (session) {
      if (!WORKSPACE_ROUTE_TO_PAGE[pathname]) {
        navigateTo('/home', true);
      }
    } else if (WORKSPACE_ROUTE_TO_PAGE[pathname]) {
      navigateTo('/login', true);
    }
  }, [sessionChecked, session, pathname, navigateTo]);

  function toggleVideoPlayback() {
    const video = showcaseVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setVideoPlaying(true);
    } else {
      video.pause();
      setVideoPlaying(false);
    }
  }

  function toggleVideoMute() {
    const video = showcaseVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setVideoMuted(video.muted);
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function openLoginPage(mode: 'login' | 'signup' = 'login') {
    navigateTo(mode === 'signup' ? '/signup' : '/login');
  }

  function handleAuthenticated(newSession: SessionPayload) {
    if (newSession.sessionToken) {
      setStoredSessionToken(newSession.sessionToken);
    }
    setSession(newSession);
    navigateTo('/home', true);
  }

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] flex items-center justify-center">
        <img
          src="/src/assets/images/TRADESQUARELOGO.png"
          alt="TradeSquare"
          referrerPolicy="no-referrer"
          className="h-9 w-auto object-contain opacity-80"
        />
      </div>
    );
  }

  if (session) {
    const currentWorkspacePage: WorkspacePage = WORKSPACE_ROUTE_TO_PAGE[pathname] ?? 'home';
    return (
      <AuthenticatedWorkspace
        initialSession={session}
        initialPage={currentWorkspacePage}
        onPageChange={(page) => navigateTo(PAGE_TO_WORKSPACE_ROUTE[page])}
        onLoggedOut={() => {
          setStoredSessionToken(null);
          setSession(null);
          navigateTo('/', true);
        }}
      />
    );
  }

  if (pathname === '/login' || pathname === '/signup') {
    return (
      <AuthPage
        initialMode={pathname === '/signup' ? 'signup' : 'login'}
        onModeChange={(nextMode) => navigateTo(nextMode === 'signup' ? '/signup' : '/login', true)}
        onBackToLanding={() => navigateTo('/')}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#E7E9EA] overflow-x-hidden">
        <Navbar onJoinClick={() => openLoginPage('login')} />

        <main className="flex-1">
          {/* APPLE-STYLE FULL-BLEED MOSAIC HERO SECTION */}
          <section aria-label="TradeSquare Hero" className="relative w-full bg-[#1D1D1F] dark:bg-[#000000]">
            {/* Ambient Mosaic Motion Control (Top-Right Circular Control matching Apple Hero) */}
            <motion.button
              type="button"
              onClick={() => setHeroPaused((prev) => !prev)}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              aria-label={heroPaused ? 'Resume hero showcase motion' : 'Pause hero showcase motion'}
              title={heroPaused ? 'Play visual motion' : 'Pause visual motion'}
              className="absolute top-3 right-3 sm:top-4 sm:right-5 z-20 w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {heroPaused ? (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              ) : (
                <Pause className="w-3.5 h-3.5 fill-current" />
              )}
            </motion.button>

            {/* Row 1: Full-Bleed Multi-Panel Showcase Strip */}
            <div className="grid grid-cols-2 md:grid-cols-12 w-full">
              {/* Tile 1: Left Manufacturing Detail */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="group col-span-1 md:col-span-3 h-[160px] sm:h-[210px] md:h-[250px] lg:h-[300px] xl:h-[330px] overflow-hidden bg-[#1D1D1F]"
              >
                <ResilientImage
                  src="/src/assets/images/enterprise_production_1794883004798.jpg"
                  alt="Quality assurance specialist inspecting packaged export goods in a modern African processing facility"
                  fallbackTitle="Export-Ready Production"
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                    heroPaused ? 'scale-100' : 'scale-[1.03]'
                  }`}
                />
              </motion.div>

              {/* Tile 2: Corridor Logistics Vertical Crop */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group col-span-1 md:col-span-2 h-[160px] sm:h-[210px] md:h-[250px] lg:h-[300px] xl:h-[330px] overflow-hidden bg-[#262629]"
              >
                <ResilientImage
                  src="/src/assets/images/problem_trade_corridor_1794883004849.jpg"
                  alt="Container freight corridor preparing cross-border shipments across East Africa"
                  fallbackTitle="Regional Freight Corridor"
                  className={`w-full h-full object-cover object-left transition-transform duration-700 ease-out group-hover:scale-105 ${
                    heroPaused ? 'scale-100' : 'scale-[1.04]'
                  }`}
                />
              </motion.div>

              {/* Tile 3: Crisp Architectural Center Emblem Panel */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="col-span-2 md:col-span-3 h-[150px] sm:h-[180px] md:h-[250px] lg:h-[300px] xl:h-[330px] bg-[#F5F5F7] dark:bg-[#16181C] flex flex-col items-center justify-center px-6 text-center select-none"
              >
                <motion.img
                  src="/src/assets/images/TRADESQUARELOGO.png"
                  alt="TradeSquare"
                  referrerPolicy="no-referrer"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.07, rotate: -2 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                  className="h-12 sm:h-14 w-auto object-contain mb-3"
                />
                <p className="text-[13px] sm:text-[14px] font-semibold tracking-tight text-[#1D1D1F] dark:text-[#E7E9EA] max-w-[230px]">
                  Africa has the businesses. Let&apos;s connect them to the opportunities.
                </p>
              </motion.div>

              {/* Tile 4: Wide Trade Coordination Hub */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="group hidden md:block md:col-span-4 h-[250px] lg:h-[300px] xl:h-[330px] overflow-hidden bg-[#1D1D1F]"
              >
                <ResilientImage
                  src="/src/assets/images/hero_african_commerce_1794883004897.jpg"
                  alt="Modern African commercial export and logistics coordination center"
                  fallbackTitle="African Commercial Trade Hub"
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                    heroPaused ? 'scale-100' : 'scale-[1.03]'
                  }`}
                />
              </motion.div>
            </div>

            {/* Row 2: Flanking Visual Panels + Centered Dark Typographic Hero Block */}
            <div className="grid grid-cols-1 md:grid-cols-12 w-full">
              {/* Left Flanking Tile (Desktop & Tablet) */}
              <div className="group hidden md:block md:col-span-3 min-h-[260px] lg:min-h-[300px] overflow-hidden bg-[#161617]">
                <ResilientImage
                  src="/src/assets/images/problem_trade_corridor_1794883004849.jpg"
                  alt="Regional container logistics yard supporting cross-border supply"
                  fallbackTitle="Cross-Border Logistics"
                  className="w-full h-full object-cover object-right transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>

              {/* Centerpiece Hero Statement Tile */}
              <div className="col-span-1 md:col-span-6 bg-[#1D1D1F] dark:bg-[#000000] text-[#F5F5F7] dark:text-[#E7E9EA] flex flex-col items-center justify-center text-center px-6 sm:px-10 py-12 sm:py-14 lg:py-16">
                <motion.h1
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[32px] sm:text-[42px] lg:text-[48px] xl:text-[54px] font-semibold leading-[1.08] tracking-[-0.02em] text-white max-w-xl"
                >
                  Find the right partners. Build beyond borders.
                </motion.h1>

                <motion.p
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-4 text-[16px] sm:text-[18px] lg:text-[19px] font-normal leading-[1.42] tracking-[-0.01em] text-[#D2D2D7] max-w-lg"
                >
                  TradeSquare is building an intelligent business network that helps African
                  enterprises discover buyers, suppliers and opportunities across regional markets.
                </motion.p>

                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-7 flex flex-wrap items-center justify-center gap-4"
                >
                  <motion.button
                    type="button"
                    onClick={() => openLoginPage('login')}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -2 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 text-[15px] font-normal text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D1D1F]"
                  >
                    Join the Network
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => scrollToSection('corridors')}
                    whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    className="group inline-flex items-center justify-center gap-1 min-h-[44px] px-3 py-2 text-[15px] font-normal text-[#2997FF] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2997FF] rounded-full"
                  >
                    <span>Explore Corridors</span>
                    <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Right Flanking Tile (Desktop & Tablet) */}
              <div className="group hidden md:block md:col-span-3 min-h-[260px] lg:min-h-[300px] overflow-hidden bg-[#161617]">
                <ResilientImage
                  src="/src/assets/images/hero_african_commerce_1794883004897.jpg"
                  alt="Architectural detail of modern African export coordination center"
                  fallbackTitle="Regional Trade Infrastructure"
                  className="w-full h-full object-cover object-left transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            </div>
          </section>

          {/* TRADE SQUARE NETWORK VIDEO SHOWCASE (3:2 Landscape, 100% Responsive) */}
          <section aria-label="TradeSquare Network Overview" className="bg-white dark:bg-[#000000] border-b border-slate-200/80 dark:border-[#2F3336]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.985 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-white dark:bg-[#16181C] border border-slate-200/80 dark:border-[#2F3336] shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:shadow-none"
              >
                <video
                  ref={showcaseVideoRef}
                  src="/src/assets/images/dX8B1.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                  className="w-full h-full object-cover"
                >
                  Your browser does not support embedded video playback.
                </video>

                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 z-10">
                  <motion.button
                    type="button"
                    onClick={toggleVideoMute}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                    aria-label={videoMuted ? 'Unmute video audio' : 'Mute video audio'}
                    title={videoMuted ? 'Unmute audio' : 'Mute audio'}
                    className="w-11 h-11 rounded-full bg-[#1D1D1F]/70 hover:bg-[#1D1D1F]/90 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                  >
                    {videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={toggleVideoPlayback}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                    aria-label={videoPlaying ? 'Pause overview video' : 'Play overview video'}
                    title={videoPlaying ? 'Pause video' : 'Play video'}
                    className="w-11 h-11 rounded-full bg-[#1D1D1F]/70 hover:bg-[#1D1D1F]/90 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]"
                  >
                    {videoPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </section>

        {/* SECTION 01: THE ECONOMIC PROBLEM (Modernized Alternating Vertical Timeline) */}
        <EconomicProblemTimeline />

        {/* SECTION 02: THE APPROACH (Apple 2x2 Editorial Grid) */}
        <TradeSquareApproachSection
          onExploreCorridors={() => scrollToSection('corridors')}
          onExploreVision={() => scrollToSection('vision')}
          onJoinClick={() => openLoginPage('login')}
        />

        {/* SECTION 04: REGIONAL CORRIDORS */}
        <section id="corridors" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#000000] border-t border-slate-200/80 dark:border-[#2F3336]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 lg:mb-12"
            >
              <div className="max-w-2xl">
                <p className="text-xs font-medium tracking-wide text-[#0071E3] dark:text-[#1D9BF0] mb-3">
                  Built Beyond One Country
                </p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#E7E9EA]">
                  Regional corridors where enterprises need reliable discovery.
                </h2>
              </div>
              <p className="text-sm text-[#424245] dark:text-[#71767B] max-w-md leading-relaxed">
                Real trade grows along regional supply routes. TradeSquare is structured to support
                cross-border commerce across major African economic corridors.
              </p>
            </motion.div>

            <motion.div
              variants={CORRIDOR_GRID_VARIANTS}
              initial={prefersReducedMotion ? false : 'hidden'}
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-[#2F3336] rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-[#2F3336] bg-[#F5F5F7] dark:bg-[#16181C]"
            >
              {REGIONAL_CORRIDORS.map((corridor) => (
                <motion.div
                  key={corridor.region}
                  variants={prefersReducedMotion ? undefined : CORRIDOR_CARD_VARIANTS}
                  className="group p-6 lg:p-7 flex flex-col justify-between gap-5 hover:bg-white dark:hover:bg-[#1D1F23] transition-colors duration-250"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-[#E7E9EA]">{corridor.region}</h3>
                    <p className="mt-1.5 text-xs font-medium text-[#0071E3] dark:text-[#1D9BF0]">{corridor.hubs}</p>
                    <p className="mt-4 text-sm text-[#424245] dark:text-[#71767B] leading-relaxed">{corridor.focus}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLoginPage('login')}
                    className="text-left text-xs font-medium text-[#1D1D1F] dark:text-[#E7E9EA] hover:text-[#0071E3] dark:hover:text-[#1D9BF0] transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <span>Connect in {corridor.region}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SECTION 05: LONG-TERM VISION (HIGH-CONTRAST INSTITUTIONAL ANCHOR) */}
        <section id="vision" className="py-16 sm:py-20 lg:py-28 bg-[#1D1D1F] dark:bg-[#000000] text-[#F5F5F7] dark:text-[#E7E9EA] dark:border-t dark:border-[#2F3336]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
            >
              <p className="text-xs font-medium tracking-wide text-[#A1A1A6] mb-4">
                Long-Term Vision
              </p>
              <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-[1.2]">
                &ldquo;To become a trusted intelligence and connection infrastructure powering how
                African businesses discover markets, find partners and participate in regional
                trade.&rdquo;
              </blockquote>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 lg:mt-14 pt-10 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="rounded-xl p-2 -m-2 hover:bg-white/[0.03] transition-colors"
              >
                <h3 className="text-base font-semibold text-white tracking-wide">
                  01. Useful to Ordinary Business Owners
                </h3>
                <p className="mt-2.5 text-sm text-[#D2D2D7] leading-relaxed tracking-[0.01em]">
                  Designed so a factory manager, agro-processor, or wholesale buyer can find value in
                  minutes without needing a technical team.
                </p>
              </motion.div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="rounded-xl p-2 -m-2 hover:bg-white/[0.03] transition-colors"
              >
                <h3 className="text-base font-semibold text-white tracking-wide">
                  02. Focused on Commercial Outcomes
                </h3>
                <p className="mt-2.5 text-sm text-[#D2D2D7] leading-relaxed tracking-[0.01em]">
                  Success is measured by relevant connections, credible enquiries, and durable supply
                  or distribution partnerships—not vanity software metrics.
                </p>
              </motion.div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="rounded-xl p-2 -m-2 hover:bg-white/[0.03] transition-colors"
              >
                <h3 className="text-base font-semibold text-white tracking-wide">
                  03. Credible Across Institutions & Capital
                </h3>
                <p className="mt-2.5 text-sm text-[#D2D2D7] leading-relaxed tracking-[0.01em]">
                  Built with the clarity and discipline expected by serious manufacturers, export
                  agencies, institutional buyers, and long-term investors.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 06: FREQUENTLY ASKED QUESTIONS */}
        <FaqSection onJoinClick={() => openLoginPage('signup')} />

        {/* SECTION 07: JOIN THE NETWORK */}
        <JoinNetworkSection
          onAuthenticated={handleAuthenticated}
          onOpenAuthPage={(mode) => openLoginPage(mode)}
        />
      </main>

      <Footer
        onOpenAuthPage={(mode) => openLoginPage(mode)}
        onScrollToSection={scrollToSection}
      />
    </div>
    </MotionConfig>
  );
}

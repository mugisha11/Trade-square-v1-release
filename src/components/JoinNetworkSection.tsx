import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { setStoredSessionToken } from '../lib/authClient';
import type { SessionPayload } from '../types/workspace';

type ActiveModal = null | 'login' | 'signup' | 'appstore' | 'googleplay';

interface JoinNetworkSectionProps {
  onAuthenticated?: (session: SessionPayload) => void;
  onOpenAuthPage?: (mode: 'login' | 'signup') => void;
}

export function JoinNetworkSection({
  onAuthenticated,
  onOpenAuthPage,
}: JoinNetworkSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [modal, setModal] = useState<ActiveModal>(null);

  // Auth / Signup Modal State
  const [firstName, setFirstName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('Rwanda');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Mobile App Link State
  const [appEmail, setAppEmail] = useState('');
  const [appLinkSent, setAppLinkSent] = useState(false);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal]);

  function openAuthModal(mode: 'login' | 'signup') {
    if (onOpenAuthPage) {
      onOpenAuthPage(mode);
      return;
    }
    setAuthError(null);
    setAuthSuccess(null);
    setModal(mode);
  }

  function closeModal() {
    setModal(null);
    setAuthError(null);
    setAuthSuccess(null);
    setAppLinkSent(false);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    if (modal === 'signup' && firstName.trim().length < 1) {
      setAuthError('Please enter your first name.');
      return;
    }
    if (modal === 'signup' && businessName.trim().length < 2) {
      setAuthError('Please enter your business or organization name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAuthError('Please enter a valid work email address.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (modal === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: firstName.trim(),
            businessName: businessName.trim(),
            country: country.trim() || 'Rwanda',
            email: email.trim(),
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to complete sign up.');
        }
        setStoredSessionToken(data.sessionToken ?? null);
        if (onAuthenticated) {
          onAuthenticated({ user: data.user, business: data.business, sessionToken: data.sessionToken });
          closeModal();
          return;
        }
        setAuthSuccess(`Account created for ${businessName.trim()}.`);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to log in.');
        }
        setStoredSessionToken(data.sessionToken ?? null);
        if (onAuthenticated) {
          onAuthenticated({ user: data.user, business: data.business, sessionToken: data.sessionToken });
          closeModal();
          return;
        }
        setAuthSuccess(`Signed in as ${email.trim().toLowerCase()}.`);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Unable to process request right now.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSendAppLink(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appEmail.trim())) return;
    setAppLinkSent(true);
  }

  return (
    <section id="join" className="py-16 sm:py-24 lg:py-28 bg-white dark:bg-[#000000] border-t border-slate-200/80 dark:border-[#2F3336]">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#F5F5F7] dark:bg-[#16181C] border border-slate-200/80 dark:border-[#2F3336] rounded-3xl px-6 sm:px-12 py-12 sm:py-16 lg:py-20 text-center"
        >
          <motion.img
            src="/src/assets/images/TRADESQUARELOGO.png"
            alt="TradeSquare"
            referrerPolicy="no-referrer"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.06, rotate: -2 }}
            transition={{ type: 'spring', stiffness: 360, damping: 20 }}
            className="h-10 sm:h-11 w-auto object-contain mx-auto mb-5"
          />

          <p className="text-xs font-medium tracking-wide text-[#0071E3] dark:text-[#1D9BF0] mb-3">
            Become Part of the Network
          </p>

          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold tracking-[-0.02em] leading-[1.1] text-[#1D1D1F] dark:text-[#E7E9EA] max-w-2xl mx-auto">
            Connect your business across regional markets.
          </h2>

          <p className="mt-4 text-base sm:text-[17px] text-[#424245] dark:text-[#71767B] leading-relaxed max-w-lg mx-auto">
            Create your TradeSquare account or download the mobile app to get started.
          </p>

          {/* Primary Account Actions: Sign up & Log in */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <motion.button
              type="button"
              onClick={() => openAuthModal('signup')}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="w-full sm:w-auto min-w-[160px] min-h-[46px] inline-flex items-center justify-center px-8 py-2.5 text-[15px] font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F7] dark:focus-visible:ring-offset-[#16181C]"
            >
              Sign up
            </motion.button>

            <motion.button
              type="button"
              onClick={() => openAuthModal('login')}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="w-full sm:w-auto min-w-[160px] min-h-[46px] inline-flex items-center justify-center px-8 py-2.5 text-[15px] font-medium text-[#1D1D1F] dark:text-[#E7E9EA] bg-white dark:bg-[#000000] hover:bg-slate-100 dark:hover:bg-[#202327] border border-slate-300/90 dark:border-[#2F3336] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F7] dark:focus-visible:ring-offset-[#16181C]"
            >
              Log in
            </motion.button>
          </div>

          <div className="w-full max-w-md mx-auto border-t border-slate-200/90 dark:border-[#2F3336] my-9" />

          {/* Official Mobile App Store Download Buttons */}
          <p className="text-xs font-medium text-[#6E6E73] dark:text-[#71767B] mb-4">
            Get the TradeSquare mobile app
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* Apple App Store Button */}
            <motion.button
              type="button"
              onClick={() => setModal('appstore')}
              aria-label="Download TradeSquare on the App Store"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03, y: -3 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="w-full sm:w-auto min-w-[196px] min-h-[56px] inline-flex items-center justify-center sm:justify-start gap-3 px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F7]"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3" />
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[10px] font-normal text-[#D2D2D7]">
                  Download on the
                </span>
                <span className="block text-[16px] font-semibold tracking-tight text-white">
                  App Store
                </span>
              </span>
            </motion.button>

            {/* Google Play Store Button */}
            <motion.button
              type="button"
              onClick={() => setModal('googleplay')}
              aria-label="Get TradeSquare on Google Play"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03, y: -3 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="w-full sm:w-auto min-w-[196px] min-h-[56px] inline-flex items-center justify-center sm:justify-start gap-3 px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F7]"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M3.61 1.814L13.793 12 3.61 22.186a1.73 1.73 0 0 1-.482-1.208V3.022c0-.463.18-.893.482-1.208z"
                />
                <path
                  fill="#34A853"
                  d="M17.246 8.547L13.793 12 3.61 1.814c.392-.399.985-.524 1.547-.208l12.089 6.941z"
                />
                <path
                  fill="#FBBC05"
                  d="M17.246 15.453L5.157 22.394c-.562.316-1.155.191-1.547-.208L13.793 12l3.453 3.453z"
                />
                <path
                  fill="#EA4335"
                  d="M20.69 10.525c1.132.65 1.132 2.3 0 2.95l-3.444 1.978L13.793 12l3.453-3.453 3.444 1.978z"
                />
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[10px] font-normal tracking-wider text-[#D2D2D7]">
                  GET IT ON
                </span>
                <span className="block text-[16px] font-semibold tracking-tight text-white">
                  Google Play
                </span>
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Interactive Modal for Log in, Sign up, & Mobile Store Links */}
      <AnimatePresence>
        {modal && (
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white dark:bg-[#16181C] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-[#2F3336] text-[#1D1D1F] dark:text-[#E7E9EA]"
            >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-[#202327] hover:bg-slate-200 dark:hover:bg-[#2F3336] text-[#1D1D1F] dark:text-[#E7E9EA] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {modal === 'login' || modal === 'signup' ? (
              <div>
                <img
                  src="/src/assets/images/TRADESQUARELOGO.png"
                  alt="TradeSquare"
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain mb-4"
                />
                <h3 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#E7E9EA]">
                  {modal === 'signup' ? 'Create your TradeSquare account' : 'Log in to TradeSquare'}
                </h3>
                <p className="text-sm text-[#424245] dark:text-[#71767B] mt-1.5">
                  {modal === 'signup'
                    ? 'Join the regional business network for buyers, suppliers, and partners.'
                    : 'Access your TradeSquare enterprise workspace.'}
                </p>

                {authSuccess ? (
                  <div className="mt-6 rounded-2xl bg-[#F5F5F7] dark:bg-[#000000] border border-slate-200 dark:border-[#2F3336] p-5 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-[#0071E3] dark:text-[#1D9BF0] shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-[#1D1D1F] dark:text-[#E7E9EA]">{authSuccess}</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full min-h-[42px] rounded-full bg-[#0071E3] dark:bg-[#1D9BF0] hover:bg-[#0077ED] dark:hover:bg-[#1A8CD8] text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAuthSubmit} noValidate className="mt-6 space-y-4">
                    {modal === 'signup' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="modal-firstname"
                              className="block text-xs font-medium text-[#424245] dark:text-[#71767B] mb-1.5"
                            >
                              First Name
                            </label>
                            <input
                              id="modal-firstname"
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Your first name"
                              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3.5 py-2 text-sm text-[#1D1D1F] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0071E3] dark:focus:border-[#1D9BF0] focus:ring-4 focus:ring-[#0071E3]/10"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="modal-country"
                              className="block text-xs font-medium text-[#424245] dark:text-[#71767B] mb-1.5"
                            >
                              Country
                            </label>
                            <input
                              id="modal-country"
                              type="text"
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              placeholder="e.g. Rwanda"
                              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3.5 py-2 text-sm text-[#1D1D1F] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0071E3] dark:focus:border-[#1D9BF0] focus:ring-4 focus:ring-[#0071E3]/10"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="modal-business"
                            className="block text-xs font-medium text-[#424245] dark:text-[#71767B] mb-1.5"
                          >
                            Business or Organization Name
                          </label>
                          <input
                            id="modal-business"
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Kigali Agro-Packaging Ltd."
                            className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3.5 py-2 text-sm text-[#1D1D1F] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0071E3] dark:focus:border-[#1D9BF0] focus:ring-4 focus:ring-[#0071E3]/10"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label
                        htmlFor="modal-email"
                        className="block text-xs font-medium text-[#424245] dark:text-[#71767B] mb-1.5"
                      >
                        Work Email
                      </label>
                      <input
                        id="modal-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3.5 py-2 text-sm text-[#1D1D1F] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0071E3] dark:focus:border-[#1D9BF0] focus:ring-4 focus:ring-[#0071E3]/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="modal-password"
                        className="block text-xs font-medium text-[#424245] dark:text-[#71767B] mb-1.5"
                      >
                        Password
                      </label>
                      <input
                        id="modal-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3.5 py-2 text-sm text-[#1D1D1F] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0071E3] dark:focus:border-[#1D9BF0] focus:ring-4 focus:ring-[#0071E3]/10"
                      />
                    </div>

                    {authError && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-800 dark:text-red-300">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full bg-[#0071E3] dark:bg-[#1D9BF0] hover:bg-[#0077ED] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {modal === 'signup' ? 'Create account' : 'Log in'}
                    </button>

                    <p className="text-center text-xs text-[#6E6E73] dark:text-[#71767B] pt-1">
                      {modal === 'signup' ? (
                        <>
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => openAuthModal('login')}
                            className="text-[#0071E3] dark:text-[#1D9BF0] hover:underline font-medium cursor-pointer"
                          >
                            Log in
                          </button>
                        </>
                      ) : (
                        <>
                          New to TradeSquare?{' '}
                          <button
                            type="button"
                            onClick={() => openAuthModal('signup')}
                            className="text-[#0071E3] dark:text-[#1D9BF0] hover:underline font-medium cursor-pointer"
                          >
                            Sign up
                          </button>
                        </>
                      )}
                    </p>
                  </form>
                )}
              </div>
            ) : (
              <div>
                <img
                  src="/src/assets/images/TRADESQUARELOGO.png"
                  alt="TradeSquare"
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain mb-4"
                />
                <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#E7E9EA]">
                  {modal === 'appstore'
                    ? 'TradeSquare for iPhone & iPad'
                    : 'TradeSquare for Android'}
                </h3>
                <p className="text-sm text-[#424245] dark:text-[#71767B] mt-2 leading-relaxed">
                  {modal === 'appstore'
                    ? 'Receive the iOS App Store release link as soon as TradeSquare Mobile opens for your region.'
                    : 'Receive the Google Play release link as soon as TradeSquare Mobile opens for your region.'}
                </p>

                {appLinkSent ? (
                  <div className="mt-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#000000] border border-slate-200 dark:border-[#2F3336] p-4 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0071E3] dark:text-[#1D9BF0] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1D1D1F] dark:text-[#E7E9EA]">
                      Download notification queued for <span className="font-medium">{appEmail}</span>.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendAppLink} className="mt-5 space-y-3">
                    <input
                      type="email"
                      required
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      placeholder="Enter your work email for the app link"
                      className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-[#2F3336] bg-white dark:bg-[#000000] px-3.5 py-2 text-sm text-[#1D1D1F] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0071E3] dark:focus:border-[#1D9BF0] focus:ring-4 focus:ring-[#0071E3]/10"
                    />
                    <button
                      type="submit"
                      className="w-full min-h-[44px] rounded-full bg-[#0071E3] dark:bg-[#1D9BF0] hover:bg-[#0077ED] dark:hover:bg-[#1A8CD8] text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      Send download link
                    </button>
                  </form>
                )}
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

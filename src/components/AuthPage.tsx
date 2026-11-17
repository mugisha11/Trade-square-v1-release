import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Globe2,
  HelpCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { readApiJson } from '../lib/apiBase';
import { authFetch, setStoredSessionToken } from '../lib/authClient';
import type { SessionPayload } from '../types/workspace';
import { Footer } from './Footer';
import { ThemeToggleButton } from './ThemeToggle';

interface AuthPageProps {
  initialMode: 'login' | 'signup';
  onModeChange?: (mode: 'login' | 'signup') => void;
  onBackToLanding: () => void;
  onAuthenticated: (session: SessionPayload) => void;
}

const LANGUAGES = [
  'English (UK)',
  'Ikinyarwanda',
  'Français (France)',
  'Kiswahili',
  'Español',
  'Deutsch',
  'Português',
];

const EXTRA_LANGUAGES = ['English (US)', 'العربية', 'Luganda', 'Amharic', '中文(简体)'];

const MARKET_COUNTRIES = [
  'Rwanda',
  'Kenya',
  'Uganda',
  'Tanzania',
  'DR Congo',
  'Burundi',
  'Ethiopia',
  'Nigeria',
  'Ghana',
  'South Africa',
  'Other',
];

const BUSINESS_ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'Supplier', label: 'Supplier' },
  { value: 'Buyer', label: 'Buyer' },
  { value: 'SME', label: 'SME / Trade' },
];

export function AuthPage({
  initialMode,
  onModeChange,
  onBackToLanding,
  onAuthenticated,
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('Rwanda');
  const [customCountry, setCustomCountry] = useState('');
  const [city, setCity] = useState('Kigali');
  const [businessType, setBusinessType] = useState('SME');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState(false);
  const [regHint, setRegHint] = useState<'market' | 'role' | null>(null);
  const [selectedLang, setSelectedLang] = useState('English (UK)');
  const [showMoreLangs, setShowMoreLangs] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setForgotNotice(false);
    setRegHint(null);
  }, [initialMode]);

  function switchMode(next: 'login' | 'signup') {
    setMode(next);
    setError(null);
    setForgotNotice(false);
    setRegHint(null);
    onModeChange?.(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setForgotNotice(false);

    const resolvedCountry =
      country === 'Other' ? customCountry.trim() || 'Rwanda' : country.trim() || 'Rwanda';

    if (mode === 'signup' && firstName.trim().length < 1) {
      setError('Please enter your first name.');
      return;
    }
    if (mode === 'signup' && businessName.trim().length < 2) {
      setError('Please enter your business or organization name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload =
        mode === 'signup'
          ? {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              businessName: businessName.trim(),
              country: resolvedCountry,
              city: city.trim(),
              businessType,
              email: email.trim(),
              password,
            }
          : {
              email: email.trim(),
              password,
            };

      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readApiJson<{
        error?: string;
        sessionToken?: string;
        user?: SessionPayload['user'];
        business?: SessionPayload['business'];
      }>(res);
      if (!res.ok) {
        throw new Error(
          data.error || (mode === 'signup' ? 'Unable to create account.' : 'Unable to log in.'),
        );
      }
      if (!data.user || !data.business) {
        throw new Error('Authentication succeeded but the session payload was incomplete.');
      }

      setStoredSessionToken(data.sessionToken ?? null);
      onAuthenticated({
        user: data.user,
        business: data.business,
        sessionToken: data.sessionToken,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to complete authentication.';
      setError(
        message.includes('Unexpected token') || message.includes('<!DOCTYPE')
          ? 'TradeSquare API is not connected on this deployment. Redeploy with the Netlify /api function enabled.'
          : message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Exact Facebook /reg/?entry_point=login centered registration layout with TradeSquare commercial content
  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#000000] text-[#1C1E21] dark:text-[#E7E9EA] flex flex-col relative">
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20">
          <ThemeToggleButton variant="floating" />
        </div>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-7 pb-12">
          {/* Centered Official TradeSquare Brand Lockup */}
          <button
            type="button"
            onClick={onBackToLanding}
            aria-label="Back to TradeSquare landing page"
            className="mb-5 inline-flex items-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF] dark:focus-visible:ring-[#1D9BF0] rounded-lg px-2 py-1"
          >
            <img
              src="/src/assets/images/TRADESQUARELOGO.png"
              alt="TradeSquare"
              referrerPolicy="no-referrer"
              className="h-12 sm:h-14 w-auto object-contain block"
            />
          </button>

          {/* Centered Registration Card (432px, Facebook /reg signature elevation) */}
          <div className="w-full max-w-[432px] bg-white dark:bg-[#16181C] dark:border dark:border-[#2F3336] rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] dark:shadow-none overflow-hidden">
            {/* Card Header */}
            <div className="px-4 pt-3 pb-3 text-center border-b border-[#DADDE1] dark:border-[#2F3336]">
              <h1 className="text-[25px] leading-[32px] font-bold text-[#1C1E21] dark:text-[#E7E9EA] tracking-[-0.015em]">
                Create a TradeSquare account
              </h1>
              <p className="text-[15px] leading-[24px] text-[#606770] dark:text-[#71767B] mt-0.5">
                Connect your business across regional markets.
              </p>
            </div>

            {/* Registration Form Body */}
            <form onSubmit={handleSubmit} noValidate className="p-4 space-y-[11px]">
              {/* First name + Surname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[11px]">
                <input
                  id="reg-firstname"
                  aria-label="First name"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full h-[40px] rounded-[5px] border border-[#CCD0D5] dark:border-[#2F3336] bg-[#F5F6F7] dark:bg-[#000000] px-[11px] text-[15px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#8D949E] dark:placeholder:text-[#71767B] focus:outline-none focus:bg-white dark:focus:bg-[#000000] focus:border-[#0866FF] dark:focus:border-[#1D9BF0] transition-colors"
                />
                <input
                  id="reg-lastname"
                  aria-label="Surname"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Surname"
                  className="w-full h-[40px] rounded-[5px] border border-[#CCD0D5] dark:border-[#2F3336] bg-[#F5F6F7] dark:bg-[#000000] px-[11px] text-[15px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#8D949E] dark:placeholder:text-[#71767B] focus:outline-none focus:bg-white dark:focus:bg-[#000000] focus:border-[#0866FF] dark:focus:border-[#1D9BF0] transition-colors"
                />
              </div>

              {/* Business or Organization Name */}
              <div>
                <input
                  id="reg-business"
                  aria-label="Business or organization name"
                  type="text"
                  autoComplete="organization"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Business or organization name"
                  className="w-full h-[40px] rounded-[5px] border border-[#CCD0D5] dark:border-[#2F3336] bg-[#F5F6F7] dark:bg-[#000000] px-[11px] text-[15px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#8D949E] dark:placeholder:text-[#71767B] focus:outline-none focus:bg-white dark:focus:bg-[#000000] focus:border-[#0866FF] dark:focus:border-[#1D9BF0] transition-colors"
                />
              </div>

              {/* Labelled Section 1: Primary Market & City */}
              <div className="pt-0.5">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[12px] leading-[20px] text-[#606770] dark:text-[#71767B]">
                    Primary market &amp; city
                  </span>
                  <button
                    type="button"
                    onClick={() => setRegHint((prev) => (prev === 'market' ? null : 'market'))}
                    aria-label="More information about primary market"
                    className="inline-flex items-center justify-center text-[#606770] dark:text-[#71767B] hover:text-[#1C1E21] dark:hover:text-[#E7E9EA] cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                {regHint === 'market' && (
                  <p className="mb-2 text-[11.5px] leading-[15px] text-[#1C1E21] dark:text-[#E7E9EA] bg-[#F0F2F5] dark:bg-[#202327] border border-[#DADDE1] dark:border-[#2F3336] rounded-[5px] px-2.5 py-1.5">
                    Select the country and city where your enterprise operates so regional buyers and
                    suppliers can discover your corridors.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-[11px]">
                  <select
                    id="reg-country"
                    aria-label="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-[36px] rounded-[4px] border border-[#CCD0D5] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-2 text-[15px] text-[#1C1E21] dark:text-[#E7E9EA] focus:outline-none focus:border-[#0866FF] dark:focus:border-[#1D9BF0]"
                  >
                    {MARKET_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <input
                    id="reg-city"
                    aria-label="City"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (e.g. Kigali)"
                    className="w-full h-[36px] rounded-[4px] border border-[#CCD0D5] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-2.5 text-[15px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#8D949E] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0866FF] dark:focus:border-[#1D9BF0]"
                  />
                </div>

                {country === 'Other' && (
                  <input
                    id="reg-custom-country"
                    aria-label="Specify country"
                    type="text"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    placeholder="Enter country name"
                    className="mt-2 w-full h-[36px] rounded-[4px] border border-[#CCD0D5] dark:border-[#2F3336] bg-[#F5F6F7] dark:bg-[#000000] px-2.5 text-[15px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#8D949E] dark:placeholder:text-[#71767B] focus:outline-none focus:bg-white dark:focus:bg-[#000000] focus:border-[#0866FF] dark:focus:border-[#1D9BF0]"
                  />
                )}
              </div>

              {/* Labelled Section 2: Enterprise Role */}
              <div className="pt-0.5">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[12px] leading-[20px] text-[#606770] dark:text-[#71767B]">
                    Enterprise role
                  </span>
                  <button
                    type="button"
                    onClick={() => setRegHint((prev) => (prev === 'role' ? null : 'role'))}
                    aria-label="More information about enterprise role"
                    className="inline-flex items-center justify-center text-[#606770] dark:text-[#71767B] hover:text-[#1C1E21] dark:hover:text-[#E7E9EA] cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                {regHint === 'role' && (
                  <p className="mb-2 text-[11.5px] leading-[15px] text-[#1C1E21] dark:text-[#E7E9EA] bg-[#F0F2F5] dark:bg-[#202327] border border-[#DADDE1] dark:border-[#2F3336] rounded-[5px] px-2.5 py-1.5">
                    Choose how your business primarily participates on TradeSquare. You can update
                    this anytime in My Business.
                  </p>
                )}

                <div className="grid grid-cols-3 gap-[11px]" role="radiogroup" aria-label="Enterprise role">
                  {BUSINESS_ROLE_OPTIONS.map((opt) => {
                    const checked = businessType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`h-[36px] rounded-[4px] border bg-white dark:bg-[#000000] px-2.5 flex items-center justify-between gap-1 text-[14px] text-[#1C1E21] dark:text-[#E7E9EA] cursor-pointer select-none transition-colors ${
                          checked ? 'border-[#0866FF] dark:border-[#1D9BF0]' : 'border-[#CCD0D5] dark:border-[#2F3336]'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        <input
                          type="radio"
                          name="businessType"
                          value={opt.value}
                          checked={checked}
                          onChange={() => setBusinessType(opt.value)}
                          className="accent-[#0866FF] dark:accent-[#1D9BF0] w-3.5 h-3.5 shrink-0 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Work Email Address */}
              <div>
                <input
                  id="reg-email"
                  aria-label="Work email address"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work email address"
                  className="w-full h-[40px] rounded-[5px] border border-[#CCD0D5] dark:border-[#2F3336] bg-[#F5F6F7] dark:bg-[#000000] px-[11px] text-[15px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#8D949E] dark:placeholder:text-[#71767B] focus:outline-none focus:bg-white dark:focus:bg-[#000000] focus:border-[#0866FF] dark:focus:border-[#1D9BF0] transition-colors"
                />
              </div>

              {/* New Password */}
              <div>
                <input
                  id="reg-password"
                  aria-label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full h-[40px] rounded-[5px] border border-[#CCD0D5] dark:border-[#2F3336] bg-[#F5F6F7] dark:bg-[#000000] px-[11px] text-[15px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#8D949E] dark:placeholder:text-[#71767B] focus:outline-none focus:bg-white dark:focus:bg-[#000000] focus:border-[#0866FF] dark:focus:border-[#1D9BF0] transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-[5px] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-[13px] text-red-800 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Facebook-style Fine Print Compliance Copy */}
              <div className="space-y-2.5 pt-0.5 text-[11px] leading-[15px] text-[#777777] dark:text-[#71767B]">
                <p>
                  Enterprises who use TradeSquare can discover your business profile, verified
                  capabilities, and regional market listings.
                </p>
                <p>
                  By clicking Sign Up, you agree to TradeSquare&apos;s commercial directory
                  guidelines and privacy standards. You may receive verification and partner enquiry
                  notifications.
                </p>
              </div>

              {/* Centered Iconic Green Sign Up CTA */}
              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-w-[194px] h-[36px] px-10 inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#00A400] hover:bg-[#008F00] disabled:opacity-60 text-white text-[18px] font-bold leading-none transition-colors cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign Up
                </button>
              </div>

              {/* Centered Blue Link back to Login */}
              <div className="pt-2 pb-1 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[17px] leading-[20px] font-normal text-[#1877F2] dark:text-[#1D9BF0] hover:underline cursor-pointer"
                >
                  Already have an account?
                </button>
              </div>
            </form>
          </div>
        </main>

        <Footer
          onOpenAuthPage={(nextMode) => switchMode(nextMode)}
          onScrollToSection={() => onBackToLanding()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] text-[#1C1E21] dark:text-[#E7E9EA] flex flex-col relative">
      {/* Main Split Workspace: Exact 56% / 44% Desktop Split with Hairline Vertical Divider */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.27fr_1fr]">
        {/* LEFT PANEL: Logo + Visual Trade Collage + Bold Stacked Headline */}
        <div className="relative flex flex-col justify-between px-6 sm:px-10 lg:px-14 pt-8 pb-8 lg:pb-14 lg:border-r lg:border-[#DADDE1] dark:lg:border-[#2F3336] overflow-hidden">
          {/* Top-Left Brand Logo (clicks back to landing page) */}
          <div className="relative z-10 flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToLanding}
              aria-label="Back to TradeSquare landing page"
              className="inline-flex items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866FF] dark:focus-visible:ring-[#1D9BF0] rounded-lg"
            >
              <img
                src="/src/assets/images/TRADESQUARELOGO.png"
                alt="TradeSquare"
                referrerPolicy="no-referrer"
                className="h-11 sm:h-12 w-auto object-contain block"
              />
            </button>
            <div className="lg:hidden">
              <ThemeToggleButton variant="floating" />
            </div>
          </div>

          {/* Center-Right Overlapping Visual Collage (TradeSquare Photography Only) */}
          <div className="hidden md:flex items-center justify-center my-6 lg:my-0 lg:pl-20">
            <div className="relative w-[420px] xl:w-[460px] h-[390px] xl:h-[420px] select-none">
              {/* Back-Left Secondary Photo Card */}
              <div className="absolute left-2 top-16 w-[170px] h-[175px] rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-black/5 bg-slate-100">
                <img
                  src="/src/assets/images/enterprise_production_1794883004798.jpg"
                  alt="Certified African export manufacturing"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-lg bg-black/55 backdrop-blur-xs text-white flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Floating Top-Left Accent Badge */}
              <div className="absolute left-0 top-1 w-12 h-12 rounded-full bg-[#0866FF] text-white shadow-[0_10px_24px_rgba(8,102,255,0.28)] flex items-center justify-center -rotate-6">
                <Globe2 className="w-6 h-6" />
              </div>

              {/* Back-Right Tall Portrait Card */}
              <div className="absolute right-6 top-0 w-[235px] xl:w-[250px] h-[320px] xl:h-[340px] rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.16)] border border-black/5 bg-[#1D1D1F]">
                <img
                  src="/src/assets/images/hero_african_commerce_1794883004897.jpg"
                  alt="African regional commerce and logistics coordination"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-6 right-3 px-2.5 py-1 rounded-full bg-[#5B52E8] text-white text-[11px] font-semibold shadow-sm">
                  Kigali · EAC
                </div>
                <div className="absolute inset-x-3 bottom-3 flex items-center gap-1.5">
                  <div className="h-3.5 flex-1 rounded-full border border-white/80 bg-black/25 backdrop-blur-xs" />
                  <div className="w-3.5 h-3.5 rounded-full border border-white/80 bg-black/25" />
                  <div className="w-3.5 h-3.5 rounded-full border border-white/80 bg-black/25" />
                </div>
              </div>

              {/* Front-Left Crisp White Card */}
              <div className="absolute left-10 bottom-8 w-[178px] rounded-2xl bg-white dark:bg-[#16181C] p-2.5 shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-[#E4E6EB] dark:border-[#2F3336]">
                <div className="w-5 h-5 rounded-md bg-[#0866FF] dark:bg-[#1D9BF0] text-white flex items-center justify-center mb-2">
                  <Briefcase className="w-3 h-3" />
                </div>
                <div className="h-[116px] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-[#202327]">
                  <img
                    src="/src/assets/images/problem_trade_corridor_1794883004849.jpg"
                    alt="Regional East African trade corridor"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-2.5 w-3/4 rounded-full bg-[#E4E6EB] dark:bg-[#2F3336]" />
                  <div className="h-2.5 w-1/2 rounded-full bg-[#F0F2F5] dark:bg-[#202327]" />
                </div>
              </div>

              {/* Overlapping Circular Avatar / Highlight Badge Bottom-Center */}
              <div className="absolute left-[182px] bottom-0 w-[108px] h-[108px] rounded-full p-1 bg-[#0866FF] dark:bg-[#1D9BF0] shadow-[0_12px_28px_rgba(8,102,255,0.28)]">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-[#000000] bg-white dark:bg-[#16181C]">
                  <img
                    src="/src/assets/images/enterprise_production_1794883004798.jpg"
                    alt="TradeSquare enterprise partner"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              {/* Floating Right Trust Check Badge */}
              <div className="absolute right-0 bottom-24 w-12 h-12 rounded-full bg-[#FF2E63] text-white shadow-[0_10px_24px_rgba(255,46,99,0.3)] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Bottom-Left Stacked Headline matching exact Facebook Login typography */}
          <div className="relative z-10 mt-6 lg:mt-0">
            <h1 className="text-[42px] sm:text-[56px] lg:text-[64px] xl:text-[72px] font-bold leading-[1.03] tracking-[-0.025em] text-[#1C1E21] dark:text-[#E7E9EA]">
              <span className="block">Find the</span>
              <span className="block">right</span>
              <span className="block">partners</span>
              <span className="block text-[#0866FF] dark:text-[#1D9BF0]">beyond borders.</span>
            </h1>
          </div>
        </div>

        {/* RIGHT PANEL: Clean Flat Login Form (Zero Outer Box/Shadow) */}
        <div className="relative flex flex-col items-center justify-center px-6 sm:px-10 py-10 lg:py-12 bg-white dark:bg-[#000000]">
          <div className="hidden lg:block absolute top-6 right-6">
            <ThemeToggleButton variant="floating" />
          </div>
          <div className="w-full max-w-[416px]">
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-[#1C1E21] dark:text-[#E7E9EA] mb-5">
              Log in to TradeSquare
            </h2>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <input
                  id="auth-email"
                  aria-label="Email address"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work email address"
                  className="w-full h-[56px] rounded-[14px] border border-[#CCD0D5] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-4 text-[16px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#65676B] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0866FF] dark:focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#0866FF] dark:focus:ring-[#1D9BF0] transition-colors"
                />
              </div>

              <div>
                <input
                  id="auth-password"
                  aria-label="Password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-[56px] rounded-[14px] border border-[#CCD0D5] dark:border-[#2F3336] bg-white dark:bg-[#000000] px-4 text-[16px] text-[#1C1E21] dark:text-[#E7E9EA] placeholder:text-[#65676B] dark:placeholder:text-[#71767B] focus:outline-none focus:border-[#0866FF] dark:focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#0866FF] dark:focus:ring-[#1D9BF0] transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-[14px] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 px-3.5 py-3 text-[13px] text-red-800 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[48px] mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#0866FF] dark:bg-[#1D9BF0] hover:bg-[#0057E7] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-[16px] font-semibold transition-colors cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Log in
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setForgotNotice((prev) => !prev)}
                className="text-[15px] font-medium text-[#1C1E21] dark:text-[#E7E9EA] hover:underline cursor-pointer"
              >
                Forgotten password?
              </button>
              {forgotNotice && (
                <p className="mt-2.5 text-[13px] text-[#65676B] dark:text-[#71767B] bg-[#F0F2F5] dark:bg-[#16181C] dark:border dark:border-[#2F3336] rounded-xl px-4 py-3 leading-relaxed">
                  Use your registered work email and password, or create a new TradeSquare account
                  below if you are joining for the first time.
                </p>
              )}
            </div>

            <div className="mt-12">
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="w-full h-[48px] inline-flex items-center justify-center rounded-full border border-[#0866FF] dark:border-[#2F3336] bg-white dark:bg-[#000000] hover:bg-[#0866FF]/5 dark:hover:bg-[#1D9BF0]/10 text-[#0866FF] dark:text-[#1D9BF0] text-[16px] font-semibold transition-colors cursor-pointer"
              >
                Create new account
              </button>
            </div>

            {/* Subtle Centered Brand Footer Signature */}
            <div className="mt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={onBackToLanding}
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#4B4F56] dark:text-[#71767B] hover:text-[#1C1E21] dark:hover:text-[#E7E9EA] transition-colors cursor-pointer"
              >
                <img
                  src="/src/assets/images/TRADESQUARELOGO.png"
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="h-4 w-auto object-contain"
                />
                <span>TradeSquare</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Language Selector Bar */}
      <footer className="border-t border-[#DADDE1] dark:border-[#2F3336] bg-white dark:bg-[#000000] py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-[#737373] dark:text-[#71767B]">
          {(showMoreLangs ? [...LANGUAGES, ...EXTRA_LANGUAGES] : LANGUAGES).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLang(lang)}
              className={`hover:underline cursor-pointer ${
                selectedLang === lang ? 'text-[#1C1E21] dark:text-[#E7E9EA] font-medium' : 'text-[#737373] dark:text-[#71767B]'
              }`}
            >
              {lang}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowMoreLangs((prev) => !prev)}
            className="text-[#737373] dark:text-[#71767B] hover:underline cursor-pointer"
          >
            {showMoreLangs ? 'Fewer languages' : 'More languages...'}
          </button>
        </div>
      </footer>
    </div>
  );
}

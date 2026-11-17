import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  Film,
  Loader2,
  Monitor,
  Smartphone,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface HeroMediaSlot {
  id: 'production' | 'corridor' | 'hub';
  label: string;
  imageSrc: string;
  defaultPrompt: string;
}

interface HeroVideoStudioModalProps {
  isOpen: boolean;
  initialSlotId?: 'production' | 'corridor' | 'hub';
  slots: HeroMediaSlot[];
  onClose: () => void;
  onApplyVideoToHero: (slotId: 'production' | 'corridor' | 'hub', videoSrc: string) => void;
}

const MOTION_PRESETS = [
  'Smooth cinematic camera push forward with natural daylight and subtle industrial movement.',
  'Gentle aerial pan across the logistics corridor with steady motion and crisp atmospheric depth.',
  'Warm sunlight shifting across the trade floor while workers and shipments move steadily.',
];

export function HeroVideoStudioModal({
  isOpen,
  initialSlotId = 'hub',
  slots,
  onClose,
  onApplyVideoToHero,
}: HeroVideoStudioModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [targetSlotId, setTargetSlotId] = useState<'production' | 'corridor' | 'hub'>(initialSlotId);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState<string>(MOTION_PRESETS[0]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedRatio, setGeneratedRatio] = useState<'16:9' | '9:16'>('16:9');
  const [appliedToHero, setAppliedToHero] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTargetSlotId(initialSlotId);
    const chosen = slots.find((s) => s.id === initialSlotId) ?? slots[0];
    if (chosen) {
      loadHeroSlotImage(chosen);
    }
    setError(null);
    setGeneratedVideoUrl(null);
    setAppliedToHero(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSlotId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !generating) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, generating, onClose]);

  async function loadHeroSlotImage(slot: HeroMediaSlot) {
    setTargetSlotId(slot.id);
    setSourceLabel(slot.label);
    setPrompt(slot.defaultPrompt);
    setPreviewDataUrl(slot.imageSrc);
    setError(null);
    setAppliedToHero(false);

    try {
      const response = await fetch(slot.imageSrc);
      const blob = await response.blob();
      const mime = blob.type || 'image/jpeg';
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviewDataUrl(reader.result);
          setImageBase64(reader.result);
          setImageMimeType(mime);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      setError('Could not load the selected hero photo.');
    }
  }

  function handleFileSelected(file: File | undefined) {
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPEG, or WebP photo.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Image must be 15 MB or smaller.');
      return;
    }

    setError(null);
    setGeneratedVideoUrl(null);
    setAppliedToHero(false);
    setSourceLabel(file.name);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewDataUrl(reader.result);
        setImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerateVideo() {
    if (!imageBase64) {
      setError('Please upload a photo or pick a hero image first.');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setAppliedToHero(false);

    try {
      const res = await fetch('/api/video/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: imageMimeType,
          prompt: prompt.trim() || MOTION_PRESETS[0],
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Video generation failed.');
      }

      const playableUrl = data.videoDataUrl || data.videoUri;
      if (!playableUrl) {
        throw new Error('The server did not return a playable video stream.');
      }

      setGeneratedVideoUrl(playableUrl);
      setGeneratedRatio(data.aspectRatio === '9:16' ? '9:16' : '16:9');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to animate this photo into video right now.'
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Animate images into video"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !generating) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl bg-white rounded-3xl border border-black/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.28)] overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-black/[0.07] bg-[#F5F5F7]/80 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0071E3] text-white flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-tight text-[#1D1D1F] truncate">
                    Animate Photo into Video
                  </h2>
                  <p className="text-[12.5px] text-[#6E6E73] truncate">
                    Upload any business photo or animate a TradeSquare hero visual in 16:9 or 9:16
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={generating}
                aria-label="Close video studio"
                className="w-8 h-8 rounded-full bg-black/[0.06] hover:bg-black/[0.11] disabled:opacity-40 text-[#1D1D1F] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Controls: Photo Upload + Hero Presets + Aspect Ratio + Prompt */}
              <div className="lg:col-span-6 space-y-4">
                {/* Upload Photo Dropzone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-[#1D1D1F]">
                      1. Source Photo
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[12.5px] font-medium text-[#0071E3] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from device</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleFileSelected(e.target.files?.[0])}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileSelected(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="group relative rounded-2xl border border-dashed border-[#C7C7CC] hover:border-[#0071E3] bg-[#F5F5F7] p-3 flex items-center gap-3.5 cursor-pointer transition-colors"
                  >
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt={sourceLabel || 'Selected source photo'}
                        className="w-20 h-14 rounded-xl object-cover shrink-0 border border-black/[0.08]"
                      />
                    ) : (
                      <div className="w-20 h-14 rounded-xl bg-white flex items-center justify-center shrink-0 border border-black/[0.06]">
                        <Upload className="w-5 h-5 text-[#6E6E73]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[#1D1D1F] truncate">
                        {sourceLabel || 'Drop a photo here or click to browse'}
                      </p>
                      <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        PNG, JPEG, or WebP up to 15 MB
                      </p>
                    </div>
                  </div>

                  {/* Quick Hero Image Picker */}
                  <div className="mt-2.5">
                    <p className="text-[11.5px] font-medium text-[#6E6E73] mb-1.5">
                      Or select a Hero showcase image:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => {
                        const selected = targetSlotId === slot.id && sourceLabel === slot.label;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => loadHeroSlotImage(slot)}
                            className={`relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                              selected
                                ? 'border-[#0071E3] ring-2 ring-[#0071E3]/25'
                                : 'border-black/[0.08] hover:border-black/25'
                            }`}
                          >
                            <img
                              src={slot.imageSrc}
                              alt={slot.label}
                              className="w-full h-12 object-cover"
                            />
                            <span className="block px-1.5 py-1 text-[11px] font-medium text-[#1D1D1F] bg-white truncate">
                              {slot.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio Selector (Strictly 16:9 or 9:16) */}
                <div>
                  <span className="block text-[13px] font-semibold text-[#1D1D1F] mb-2">
                    2. Output Aspect Ratio
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAspectRatio('16:9')}
                      aria-pressed={aspectRatio === '16:9'}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        aspectRatio === '16:9'
                          ? 'border-[#0071E3] bg-[#0071E3]/[0.07] text-[#0071E3]'
                          : 'border-black/[0.1] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      <Monitor className="w-4 h-4 shrink-0" />
                      <div>
                        <p className="text-[13px] font-semibold leading-tight">16:9 Landscape</p>
                        <p className="text-[11px] opacity-80">Hero &amp; widescreen</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAspectRatio('9:16')}
                      aria-pressed={aspectRatio === '9:16'}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        aspectRatio === '9:16'
                          ? 'border-[#0071E3] bg-[#0071E3]/[0.07] text-[#0071E3]'
                          : 'border-black/[0.1] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 shrink-0" />
                      <div>
                        <p className="text-[13px] font-semibold leading-tight">9:16 Portrait</p>
                        <p className="text-[11px] opacity-80">Vertical &amp; mobile</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Motion Prompt */}
                <div>
                  <label
                    htmlFor="hero-video-motion-prompt"
                    className="block text-[13px] font-semibold text-[#1D1D1F] mb-1.5"
                  >
                    3. Camera &amp; Scene Motion
                  </label>
                  <textarea
                    id="hero-video-motion-prompt"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how the photo should move..."
                    className="w-full rounded-xl border border-[#C7C7CC] bg-white px-3 py-2 text-[13.5px] text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {['Camera Push', 'Aerial Corridor Sweep', 'Daylight Motion'].map((label, i) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setPrompt(MOTION_PRESETS[i])}
                        className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[11.5px] font-medium text-[#424245] cursor-pointer transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] text-red-800 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={generating || !imageBase64}
                  className="w-full h-11 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-55 text-white text-[14.5px] font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Animating photo into {aspectRatio} video...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate {aspectRatio} Video</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Preview Stage */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-[#1D1D1F] rounded-2xl p-4 sm:p-5 text-white min-h-[340px]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[12px] font-medium text-[#A1A1A6]">
                    {generatedVideoUrl
                      ? `Generated ${generatedRatio} Video`
                      : `Preview (${aspectRatio})`}
                  </span>
                  <span className="text-[11px] font-medium text-[#8E8E93]">
                    gemini-omni-1.2-flash
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  {generating ? (
                    <div
                      className={`w-full rounded-xl overflow-hidden bg-[#2C2C2E] flex flex-col items-center justify-center gap-3 p-6 text-center ${
                        aspectRatio === '9:16' ? 'max-w-[220px] aspect-[9/16]' : 'aspect-video'
                      }`}
                    >
                      <Loader2 className="w-7 h-7 animate-spin text-[#2997FF]" />
                      <p className="text-[13px] font-medium text-[#F5F5F7]">
                        Rendering motion frames...
                      </p>
                      <p className="text-[11.5px] text-[#A1A1A6]">
                        This typically takes 20–60 seconds.
                      </p>
                    </div>
                  ) : generatedVideoUrl ? (
                    <div
                      className={`w-full rounded-xl overflow-hidden bg-black border border-white/10 ${
                        generatedRatio === '9:16' ? 'max-w-[230px] aspect-[9/16]' : 'aspect-video'
                      }`}
                    >
                      <video
                        src={generatedVideoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : previewDataUrl ? (
                    <div
                      className={`relative w-full rounded-xl overflow-hidden bg-black/50 border border-white/10 ${
                        aspectRatio === '9:16' ? 'max-w-[220px] aspect-[9/16]' : 'aspect-video'
                      }`}
                    >
                      <img
                        src={previewDataUrl}
                        alt="Still frame ready to animate"
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent flex items-end p-3">
                        <p className="text-[12px] text-white/90">
                          Ready to animate into {aspectRatio} video
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {generatedVideoUrl && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={generatedVideoUrl}
                      download={`tradesquare-${targetSlotId}-${generatedRatio.replace(':', 'x')}.mp4`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[12.5px] font-medium text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MP4</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        onApplyVideoToHero(targetSlotId, generatedVideoUrl);
                        setAppliedToHero(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-[12.5px] font-semibold text-white transition-colors cursor-pointer"
                    >
                      {appliedToHero ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Playing in Hero</span>
                        </>
                      ) : (
                        <>
                          <Film className="w-3.5 h-3.5" />
                          <span>Use in Hero Mosaic</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

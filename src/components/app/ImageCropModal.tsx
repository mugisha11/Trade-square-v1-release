import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, ZoomIn, ZoomOut, X } from 'lucide-react';

export type CropMediaKind = 'logo' | 'cover';

interface ImageCropModalProps {
  kind: CropMediaKind;
  imageSrc: string;
  onCancel: () => void;
  onApply: (result: { dataUrl: string; mimeType: string }) => void | Promise<void>;
}

const COVER_ASPECT = 1128 / 201;
const LOGO_ASPECT = 1;
const COVER_OUT = { w: 1584, h: Math.round(1584 / COVER_ASPECT) };
const LOGO_OUT = { w: 400, h: 400 };

export function ImageCropModal({ kind, imageSrc, onCancel, onApply }: ImageCropModalProps) {
  const aspect = kind === 'cover' ? COVER_ASPECT : LOGO_ASPECT;
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [minZoom, setMinZoom] = useState(1);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const measureStage = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const maxW = Math.min(el.parentElement?.clientWidth ?? 640, 640);
    const frameW = maxW;
    const frameH = frameW / aspect;
    setStage({ w: frameW, h: frameH });
  }, [aspect]);

  useEffect(() => {
    measureStage();
    window.addEventListener('resize', measureStage);
    return () => window.removeEventListener('resize', measureStage);
  }, [measureStage]);

  useEffect(() => {
    setReady(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageSrc]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }

  useEffect(() => {
    if (!natural.w || !natural.h || !stage.w || !stage.h) return;
    const fit = Math.max(stage.w / natural.w, stage.h / natural.h);
    setMinZoom(fit);
    setZoom(fit);
    setOffset({ x: 0, y: 0 });
    setReady(true);
  }, [natural, stage]);

  function clampOffset(next: { x: number; y: number }, z: number) {
    if (!natural.w || !stage.w) return next;
    const dispW = natural.w * z;
    const dispH = natural.h * z;
    const maxX = Math.max(0, (dispW - stage.w) / 2);
    const maxY = Math.max(0, (dispH - stage.h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(
      clampOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }, zoom)
    );
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function changeZoom(next: number) {
    const z = Math.min(minZoom * 3, Math.max(minZoom, next));
    setZoom(z);
    setOffset((o) => clampOffset(o, z));
  }

  async function handleApply() {
    if (!natural.w || !stage.w || saving) return;
    setSaving(true);
    try {
      const out = kind === 'cover' ? COVER_OUT : LOGO_OUT;
      const canvas = document.createElement('canvas');
      canvas.width = out.w;
      canvas.height = out.h;
      const ctx = canvas.getContext('2d');
      if (!ctx || !imgRef.current) throw new Error('Could not prepare image.');

      const scale = out.w / stage.w;
      const dispW = natural.w * zoom;
      const dispH = natural.h * zoom;
      const imgX = (stage.w - dispW) / 2 + offset.x;
      const imgY = (stage.h - dispH) / 2 + offset.y;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.w, out.h);
      ctx.drawImage(
        imgRef.current,
        imgX * scale,
        imgY * scale,
        dispW * scale,
        dispH * scale
      );

      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.92);
      await onApply({ dataUrl, mimeType });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={kind === 'cover' ? 'Position cover photo' : 'Position logo'}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/55"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div className="w-full max-w-[680px] rounded-xl bg-white dark:bg-[#1D2226] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0E0E0] dark:border-[#38434F]">
          <h2 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">
            {kind === 'cover' ? 'Edit cover photo' : 'Edit logo'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-8 w-8 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] inline-flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#666666] dark:text-[#A8A8A8]" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2">
          <p className="text-sm text-[#666666] dark:text-[#A8A8A8] mb-3">
            Drag to reposition. Use the slider to zoom so the image fills the frame.
          </p>

          <div className="flex justify-center bg-[#1B1F23] rounded-lg overflow-hidden py-6 px-3">
            <div
              ref={stageRef}
              className={`relative overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing ${
                kind === 'logo' ? 'rounded-lg' : ''
              }`}
              style={{
                width: stage.w || '100%',
                height: stage.h || 180,
                maxWidth: '100%',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt=""
                draggable={false}
                onLoad={onImageLoad}
                className="absolute max-w-none pointer-events-none"
                style={{
                  width: natural.w ? natural.w * zoom : 'auto',
                  height: natural.h ? natural.h * zoom : 'auto',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  opacity: ready ? 1 : 0,
                }}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 px-1">
            <ZoomOut className="w-4 h-4 text-[#666666] dark:text-[#A8A8A8] shrink-0" />
            <input
              type="range"
              min={minZoom}
              max={minZoom * 3}
              step={0.01}
              value={zoom}
              onChange={(e) => changeZoom(Number(e.target.value))}
              className="flex-1 accent-[#0A66C2]"
              aria-label="Zoom"
            />
            <ZoomIn className="w-4 h-4 text-[#666666] dark:text-[#A8A8A8] shrink-0" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#E0E0E0] dark:border-[#38434F]">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-8 px-4 rounded-full text-sm font-semibold text-[#666666] dark:text-[#A8A8A8] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!ready || saving}
            onClick={() => void handleApply()}
            className="h-8 px-5 rounded-full bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

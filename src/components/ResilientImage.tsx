import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle: string;
  fallbackSubtitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  fallbackSubtitle,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-600 p-8 text-center border border-slate-200 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Building2 className="w-8 h-8 text-slate-400 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-slate-800">{fallbackTitle}</p>
        {fallbackSubtitle && (
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{fallbackSubtitle}</p>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function VerifiedBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
  const isSmall = size === 'sm';

  return (
    <span
      title="Verified business record"
      aria-label="Verified business"
      className={`inline-flex items-center gap-1 font-semibold text-[#0866FF] dark:text-[#1D9BF0] whitespace-nowrap shrink-0 ${
        isSmall ? 'text-[12px]' : 'text-[13px]'
      } ${className}`}
    >
      <BadgeCheck
        className={`${isSmall ? 'w-4 h-4' : 'w-[17px] h-[17px]'} fill-[#0866FF] dark:fill-[#1D9BF0] text-white shrink-0`}
        aria-hidden="true"
      />
      <span>Verified</span>
    </span>
  );
}

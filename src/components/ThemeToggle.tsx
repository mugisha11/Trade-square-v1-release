import { Moon, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '../lib/theme';

interface ThemeToggleButtonProps {
  variant?: 'topbar' | 'navbar' | 'floating';
  className?: string;
}

export function ThemeToggleButton({
  variant = 'topbar',
  className = '',
}: ThemeToggleButtonProps) {
  const { isDark, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const variantClasses =
    variant === 'navbar'
      ? 'w-8 h-8 rounded-full bg-white/10 hover:bg-white/18 text-[#E8E8ED] hover:text-white'
      : variant === 'floating'
        ? 'h-9 px-3.5 rounded-full bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#1C1E21] border border-[#DADDE1] dark:bg-[#16181C] dark:hover:bg-[#202327] dark:text-[#E7E9EA] dark:border-[#2F3336] text-[13px] font-medium gap-1.5 shadow-xs'
        : 'w-10 h-10 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] dark:bg-[#202327] dark:hover:bg-[#2F3336] dark:text-[#E7E9EA]';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9BF0] ${variantClasses} ${className}`}
    >
      <motion.span
        key={isDark ? 'sun' : 'moon'}
        initial={prefersReducedMotion ? false : { rotate: -30, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center justify-center"
      >
        {isDark ? (
          <Sun className="w-[16px] h-[16px] text-[#1D9BF0]" strokeWidth={2.1} />
        ) : (
          <Moon className="w-[16px] h-[16px]" strokeWidth={2} />
        )}
      </motion.span>
      {variant === 'floating' && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </motion.button>
  );
}

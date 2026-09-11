/**
 * Space Theme Design Tokens — Single Source of Truth
 * Maps each space to its visual identity tokens.
 */

export type SpaceId = 'worship' | 'health' | 'work' | 'home' | 'plans';

export interface SpaceThemeTokens {
  color: string;
  icon: string;
  label: string;
  textClass: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  cardPillClass: string;
  cardBorderHoverClass: string;
  activeNavBgClass: string;
  activeNavTextClass: string;
  activeNavBorderClass: string;
  activeNavShadowClass: string;
  activeNavIconClass: string;
  focusRingClass: string;
}

const SPACE_THEMES: Record<SpaceId, SpaceThemeTokens> = {
  worship: {
    color: 'emerald',
    icon: '🕌',
    label: 'عبادة',
    textClass: 'text-emerald-400',
    badgeBgClass: 'bg-emerald-500/10',
    badgeBorderClass: 'border-emerald-500/20',
    cardPillClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cardBorderHoverClass: 'hover:border-emerald-500/50',
    activeNavBgClass: 'from-emerald-500/25 to-teal-500/25',
    activeNavTextClass: 'text-emerald-300',
    activeNavBorderClass: 'border-emerald-500/40',
    activeNavShadowClass: 'shadow-emerald-500/10',
    activeNavIconClass: 'text-emerald-400',
    focusRingClass: 'focus:ring-emerald-500/50',
  },
  health: {
    color: 'teal',
    icon: '🏋️',
    label: 'صحة',
    textClass: 'text-teal-400',
    badgeBgClass: 'bg-teal-500/10',
    badgeBorderClass: 'border-teal-500/20',
    cardPillClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    cardBorderHoverClass: 'hover:border-teal-500/50',
    activeNavBgClass: 'from-teal-500/25 to-cyan-500/25',
    activeNavTextClass: 'text-teal-300',
    activeNavBorderClass: 'border-teal-500/40',
    activeNavShadowClass: 'shadow-teal-500/10',
    activeNavIconClass: 'text-teal-400',
    focusRingClass: 'focus:ring-teal-500/50',
  },
  work: {
    color: 'sky',
    icon: '💼',
    label: 'عمل',
    textClass: 'text-sky-400',
    badgeBgClass: 'bg-sky-500/10',
    badgeBorderClass: 'border-sky-500/20',
    cardPillClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    cardBorderHoverClass: 'hover:border-sky-500/50',
    activeNavBgClass: 'from-sky-500/25 to-blue-500/25',
    activeNavTextClass: 'text-sky-300',
    activeNavBorderClass: 'border-sky-500/40',
    activeNavShadowClass: 'shadow-sky-500/10',
    activeNavIconClass: 'text-sky-400',
    focusRingClass: 'focus:ring-sky-500/50',
  },
  home: {
    color: 'amber',
    icon: '🏠',
    label: 'منزل',
    textClass: 'text-amber-400',
    badgeBgClass: 'bg-amber-500/10',
    badgeBorderClass: 'border-amber-500/20',
    cardPillClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    cardBorderHoverClass: 'hover:border-amber-500/50',
    activeNavBgClass: 'from-amber-500/25 to-yellow-500/25',
    activeNavTextClass: 'text-amber-300',
    activeNavBorderClass: 'border-amber-500/40',
    activeNavShadowClass: 'shadow-amber-500/10',
    activeNavIconClass: 'text-amber-400',
    focusRingClass: 'focus:ring-amber-500/50',
  },
  plans: {
    color: 'indigo',
    icon: '🎯',
    label: 'خطة',
    textClass: 'text-indigo-400',
    badgeBgClass: 'bg-indigo-500/10',
    badgeBorderClass: 'border-indigo-500/20',
    cardPillClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    cardBorderHoverClass: 'hover:border-indigo-500/50',
    activeNavBgClass: 'from-indigo-500/25 to-violet-500/25',
    activeNavTextClass: 'text-indigo-300',
    activeNavBorderClass: 'border-indigo-500/40',
    activeNavShadowClass: 'shadow-indigo-500/10',
    activeNavIconClass: 'text-indigo-400',
    focusRingClass: 'focus:ring-indigo-500/50',
  },
};

export function getSpaceTheme(spaceId: SpaceId | string): SpaceThemeTokens {
  return SPACE_THEMES[spaceId as SpaceId] || SPACE_THEMES.work;
}

export { SPACE_THEMES };

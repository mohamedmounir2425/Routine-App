/**
 * Dhikr Session Theme System — Centralized Design Tokens
 * Provides 4 distinct visual atmospheres for the Dhikr reading experience:
 * 1. 🌿 Serenity (السكينة) — Default natural sage/olive
 * 2. 🌅 Dawn (نور الفجر) — Warm morning charcoal & soft sand
 * 3. 🌙 Evening (سكون المساء) — Deep twilight indigo & cool moonlight
 * 4. 🕯️ Solitude (الخلوة) — Minimalist deep onyx & quiet stone
 */

export type DhikrThemeId = 'serenity' | 'dawn' | 'evening' | 'solitude';

export interface DhikrThemeTokens {
  id: DhikrThemeId;
  nameArabic: string;
  subtitleArabic: string;
  icon: string;

  // Backgrounds
  sessionBgHex: string;
  sessionBgStyle: string; // Full CSS or Tailwind class
  headerBgStyle: string;
  dockBgStyle: string;

  // Ambient Orbs
  ambientOrb1Class: string;
  ambientOrb2Class: string;
  ambientOrbOpacityNormal: string;
  ambientOrbOpacityFocus: string;

  // Primary Arabic Typography (Comfortable off-whites, never harsh #FFFFFF)
  arabicTextColor: string; // hex
  primaryTextColor: string;
  secondaryTextColor: string;

  // Card Surfaces
  cardBgNormal: string;
  cardBgFocus: string;
  cardBorderNormal: string;
  cardBorderFocus: string;
  cardBorderDone: string;
  cardBorderWaiting: string;

  // Accent & Action Gradients
  accentPrimary: string;
  accentSecondary: string;
  accentText: string;
  accentGradient: string;
  accentGradientFocus: string;
  accentShadow: string;
  accentRingWaiting: string;

  // Progress Bar
  progressBarTrack: string;
  progressBarFill: string;

  // Badges & Meta
  badgeClass: string;
  badgeFocusClass: string;

  // Virtue / Tadabbur Drawer
  tadabburDrawerNormal: string;
  tadabburDrawerFocus: string;
  tadabburButtonNormal: string;
  tadabburButtonFocus: string;

  // Completed State
  completedText: string;
  completedBadge: string;
  completedIconColor: string;

  // Preview Card Swatches for Settings Modal
  preview: {
    bgHex: string;
    cardBgHex: string;
    borderHex: string;
    accentHex: string;
    textHex: string;
    sampleSnippet: string;
  };
}

export const DHIKR_THEMES: Record<DhikrThemeId, DhikrThemeTokens> = {
  serenity: {
    id: 'serenity',
    nameArabic: 'السكينة',
    subtitleArabic: 'هدوء + طبيعة + ذكر (مريح للعين)',
    icon: '🌿',

    // Exact requested palette:
    // Background: #0B1512 | Surface: #14231E | Arabic Text: #F1F3E8
    // Secondary: #AEB8AD | Accent: #8FAF8B | Counter: #789B76
    sessionBgHex: '#0B1512',
    sessionBgStyle: 'bg-[#0B1512]',
    headerBgStyle: 'bg-[#0B1512]/92 border-[#8FAF8B]/18',
    dockBgStyle: 'bg-[#14231E]/88 border-[#8FAF8B]/18',

    ambientOrb1Class: 'bg-[#8FAF8B]/12',
    ambientOrb2Class: 'bg-[#789B76]/10',
    ambientOrbOpacityNormal: 'opacity-80',
    ambientOrbOpacityFocus: 'opacity-20',

    arabicTextColor: '#F1F3E8', // Sage off-white
    primaryTextColor: 'text-[#F1F3E8]',
    secondaryTextColor: 'text-[#AEB8AD]',

    cardBgNormal: 'bg-[#14231E]/85',
    cardBgFocus: 'bg-[#0E1915]/95',
    cardBorderNormal: 'border-[#8FAF8B]/18 hover:border-[#8FAF8B]/35',
    cardBorderFocus: 'border-[#8FAF8B]/18',
    cardBorderDone: 'border-[#8FAF8B]/30 bg-[#14231E]/95',
    cardBorderWaiting: 'border-[#8FAF8B]/60 bg-[#14231E] ring-1 ring-[#8FAF8B]/30 shadow-[#8FAF8B]/15',

    accentPrimary: 'text-[#8FAF8B]',
    accentSecondary: 'text-[#789B76]',
    accentText: 'text-[#0B1512]',
    accentGradient: 'bg-gradient-to-r from-[#789B76] via-[#8FAF8B] to-[#9ebb9a] text-[#0B1512] shadow-[#8FAF8B]/20',
    accentGradientFocus: 'bg-gradient-to-r from-[#6b8b69] to-[#789B76] text-[#0B1512] shadow-none',
    accentShadow: 'shadow-[#8FAF8B]/20',
    accentRingWaiting: 'ring-[#8FAF8B]/40 shadow-[#8FAF8B]/25',

    progressBarTrack: 'bg-[#14231E]',
    progressBarFill: 'bg-gradient-to-r from-[#789B76] to-[#8FAF8B] shadow-[#8FAF8B]/25',

    badgeClass: 'bg-[#8FAF8B]/12 text-[#8FAF8B] border border-[#8FAF8B]/18',
    badgeFocusClass: 'bg-[#8FAF8B]/10 text-[#8FAF8B]/90 border border-[#8FAF8B]/18',

    tadabburDrawerNormal: 'bg-[#14231E]/95 border border-[#8FAF8B]/18 text-[#F1F3E8]',
    tadabburDrawerFocus: 'bg-[#0E1915]/98 border border-[#8FAF8B]/18 text-[#F1F3E8]',
    tadabburButtonNormal: 'text-[#8FAF8B] bg-[#8FAF8B]/12 border border-[#8FAF8B]/18 hover:bg-[#8FAF8B]/20',
    tadabburButtonFocus: 'text-[#8FAF8B] bg-[#8FAF8B]/12 border border-[#8FAF8B]/18',

    completedText: 'text-[#8FAF8B]',
    completedBadge: 'bg-[#8FAF8B]/18 text-[#8FAF8B] border border-[#8FAF8B]/25',
    completedIconColor: 'text-[#8FAF8B]',

    preview: {
      bgHex: '#0B1512',
      cardBgHex: '#14231E',
      borderHex: '#8FAF8B',
      accentHex: '#8FAF8B',
      textHex: '#F1F3E8',
      sampleSnippet: '﴿ الذكر ﴾',
    },
  },

  dawn: {
    id: 'dawn',
    nameArabic: 'نور الفجر',
    subtitleArabic: 'صباح هادئ + بداية يوم + نور خفيف',
    icon: '🌅',

    // Exact requested palette:
    // Background: #17130E | Surface: #251F17 | Arabic Text: #F5EEDF
    // Secondary: #BDB19D | Accent: #D0A96E | Counter: #B89055
    sessionBgHex: '#17130E',
    sessionBgStyle: 'bg-[#17130E]',
    headerBgStyle: 'bg-[#17130E]/92 border-[#D0A96E]/18',
    dockBgStyle: 'bg-[#251F17]/88 border-[#D0A96E]/18',

    ambientOrb1Class: 'bg-[#D0A96E]/12',
    ambientOrb2Class: 'bg-[#B89055]/10',
    ambientOrbOpacityNormal: 'opacity-75',
    ambientOrbOpacityFocus: 'opacity-20',

    arabicTextColor: '#F5EEDF', // Warm dawn alabaster off-white
    primaryTextColor: 'text-[#F5EEDF]',
    secondaryTextColor: 'text-[#BDB19D]',

    cardBgNormal: 'bg-[#251F17]/85',
    cardBgFocus: 'bg-[#1B1610]/95',
    cardBorderNormal: 'border-[#D0A96E]/18 hover:border-[#D0A96E]/35',
    cardBorderFocus: 'border-[#D0A96E]/18',
    cardBorderDone: 'border-[#D0A96E]/30 bg-[#251F17]/95',
    cardBorderWaiting: 'border-[#D0A96E]/60 bg-[#251F17] ring-1 ring-[#D0A96E]/30 shadow-[#D0A96E]/15',

    accentPrimary: 'text-[#D0A96E]',
    accentSecondary: 'text-[#B89055]',
    accentText: 'text-[#17130E]',
    accentGradient: 'bg-gradient-to-r from-[#B89055] via-[#D0A96E] to-[#deb97f] text-[#17130E] shadow-[#D0A96E]/20',
    accentGradientFocus: 'bg-gradient-to-r from-[#a27e46] to-[#B89055] text-[#17130E] shadow-none',
    accentShadow: 'shadow-[#D0A96E]/20',
    accentRingWaiting: 'ring-[#D0A96E]/40 shadow-[#D0A96E]/25',

    progressBarTrack: 'bg-[#251F17]',
    progressBarFill: 'bg-gradient-to-r from-[#B89055] to-[#D0A96E] shadow-[#D0A96E]/25',

    badgeClass: 'bg-[#D0A96E]/12 text-[#D0A96E] border border-[#D0A96E]/18',
    badgeFocusClass: 'bg-[#D0A96E]/10 text-[#D0A96E]/90 border border-[#D0A96E]/18',

    tadabburDrawerNormal: 'bg-[#251F17]/95 border border-[#D0A96E]/18 text-[#F5EEDF]',
    tadabburDrawerFocus: 'bg-[#1B1610]/98 border border-[#D0A96E]/18 text-[#F5EEDF]',
    tadabburButtonNormal: 'text-[#D0A96E] bg-[#D0A96E]/12 border border-[#D0A96E]/18 hover:bg-[#D0A96E]/20',
    tadabburButtonFocus: 'text-[#D0A96E] bg-[#D0A96E]/12 border border-[#D0A96E]/18',

    completedText: 'text-[#D0A96E]',
    completedBadge: 'bg-[#D0A96E]/18 text-[#D0A96E] border border-[#D0A96E]/25',
    completedIconColor: 'text-[#D0A96E]',

    preview: {
      bgHex: '#17130E',
      cardBgHex: '#251F17',
      borderHex: '#D0A96E',
      accentHex: '#D0A96E',
      textHex: '#F5EEDF',
      sampleSnippet: '﴿ الذكر ﴾',
    },
  },

  evening: {
    id: 'evening',
    nameArabic: 'سكون المساء',
    subtitleArabic: 'غروب → هدوء → نهاية اليوم',
    icon: '🌙',

    // Exact requested palette:
    // Background: #0C101C | Surface: #151A2A | Arabic Text: #EEF0F7
    // Secondary: #AEB3C4 | Accent: #8996C7 | Counter: #727FAF
    sessionBgHex: '#0C101C',
    sessionBgStyle: 'bg-[#0C101C]',
    headerBgStyle: 'bg-[#0C101C]/92 border-[#8996C7]/18',
    dockBgStyle: 'bg-[#151A2A]/88 border-[#8996C7]/18',

    ambientOrb1Class: 'bg-[#8996C7]/12',
    ambientOrb2Class: 'bg-[#727FAF]/10',
    ambientOrbOpacityNormal: 'opacity-75',
    ambientOrbOpacityFocus: 'opacity-20',

    arabicTextColor: '#EEF0F7', // Cool twilight off-white
    primaryTextColor: 'text-[#EEF0F7]',
    secondaryTextColor: 'text-[#AEB3C4]',

    cardBgNormal: 'bg-[#151A2A]/85',
    cardBgFocus: 'bg-[#0E121E]/95',
    cardBorderNormal: 'border-[#8996C7]/18 hover:border-[#8996C7]/35',
    cardBorderFocus: 'border-[#8996C7]/18',
    cardBorderDone: 'border-[#8996C7]/30 bg-[#151A2A]/95',
    cardBorderWaiting: 'border-[#8996C7]/60 bg-[#151A2A] ring-1 ring-[#8996C7]/30 shadow-[#8996C7]/15',

    accentPrimary: 'text-[#8996C7]',
    accentSecondary: 'text-[#727FAF]',
    accentText: 'text-[#0C101C]',
    accentGradient: 'bg-gradient-to-r from-[#727FAF] via-[#8996C7] to-[#a2aedc] text-[#0C101C] shadow-[#8996C7]/20',
    accentGradientFocus: 'bg-gradient-to-r from-[#606d9a] to-[#727FAF] text-[#0C101C] shadow-none',
    accentShadow: 'shadow-[#8996C7]/20',
    accentRingWaiting: 'ring-[#8996C7]/40 shadow-[#8996C7]/25',

    progressBarTrack: 'bg-[#151A2A]',
    progressBarFill: 'bg-gradient-to-r from-[#727FAF] to-[#8996C7] shadow-[#8996C7]/25',

    badgeClass: 'bg-[#8996C7]/12 text-[#8996C7] border border-[#8996C7]/18',
    badgeFocusClass: 'bg-[#8996C7]/10 text-[#8996C7]/90 border border-[#8996C7]/18',

    tadabburDrawerNormal: 'bg-[#151A2A]/95 border border-[#8996C7]/18 text-[#EEF0F7]',
    tadabburDrawerFocus: 'bg-[#0E121E]/98 border border-[#8996C7]/18 text-[#EEF0F7]',
    tadabburButtonNormal: 'text-[#8996C7] bg-[#8996C7]/12 border border-[#8996C7]/18 hover:bg-[#8996C7]/20',
    tadabburButtonFocus: 'text-[#8996C7] bg-[#8996C7]/12 border border-[#8996C7]/18',

    completedText: 'text-[#8996C7]',
    completedBadge: 'bg-[#8996C7]/18 text-[#8996C7] border border-[#8996C7]/25',
    completedIconColor: 'text-[#8996C7]',

    preview: {
      bgHex: '#0C101C',
      cardBgHex: '#151A2A',
      borderHex: '#8996C7',
      accentHex: '#8996C7',
      textHex: '#EEF0F7',
      sampleSnippet: '﴿ الذكر ﴾',
    },
  },

  solitude: {
    id: 'solitude',
    nameArabic: 'الخلوة',
    subtitleArabic: 'غرفة هادئة + إضاءة خافتة + قراءة',
    icon: '🕯️',

    // Exact requested palette:
    // Background: #11110F | Surface: #1B1A17 | Arabic Text: #E9E5D8
    // Secondary: #AAA598 | Accent: #B8A77A | Counter: #98875F
    sessionBgHex: '#11110F',
    sessionBgStyle: 'bg-[#11110F]',
    headerBgStyle: 'bg-[#11110F]/92 border-[#B8A77A]/16',
    dockBgStyle: 'bg-[#1B1A17]/88 border-[#B8A77A]/16',

    ambientOrb1Class: 'bg-[#B8A77A]/6',
    ambientOrb2Class: 'bg-[#98875F]/5',
    ambientOrbOpacityNormal: 'opacity-40',
    ambientOrbOpacityFocus: 'opacity-10', // Near zero ambient

    arabicTextColor: '#E9E5D8', // Warm parchment off-white
    primaryTextColor: 'text-[#E9E5D8]',
    secondaryTextColor: 'text-[#AAA598]',

    cardBgNormal: 'bg-[#1B1A17]/85',
    cardBgFocus: 'bg-[#141310]/95',
    cardBorderNormal: 'border-[#B8A77A]/16 hover:border-[#B8A77A]/30',
    cardBorderFocus: 'border-[#B8A77A]/16',
    cardBorderDone: 'border-[#B8A77A]/25 bg-[#1B1A17]/95',
    cardBorderWaiting: 'border-[#B8A77A]/50 bg-[#1B1A17] ring-1 ring-[#B8A77A]/20 shadow-[#B8A77A]/10',

    accentPrimary: 'text-[#B8A77A]',
    accentSecondary: 'text-[#98875F]',
    accentText: 'text-[#11110F]',
    accentGradient: 'bg-gradient-to-r from-[#98875F] via-[#B8A77A] to-[#cbbe97] text-[#11110F] shadow-[#B8A77A]/15',
    accentGradientFocus: 'bg-gradient-to-r from-[#83734e] to-[#98875F] text-[#11110F] shadow-none',
    accentShadow: 'shadow-[#B8A77A]/15',
    accentRingWaiting: 'ring-[#B8A77A]/35 shadow-[#B8A77A]/20',

    progressBarTrack: 'bg-[#1B1A17]',
    progressBarFill: 'bg-gradient-to-r from-[#98875F] to-[#B8A77A] shadow-[#B8A77A]/20',

    badgeClass: 'bg-[#B8A77A]/10 text-[#B8A77A] border border-[#B8A77A]/16',
    badgeFocusClass: 'bg-[#B8A77A]/10 text-[#B8A77A]/90 border border-[#B8A77A]/16',

    tadabburDrawerNormal: 'bg-[#1B1A17]/95 border border-[#B8A77A]/16 text-[#E9E5D8]',
    tadabburDrawerFocus: 'bg-[#141310]/98 border border-[#B8A77A]/16 text-[#E9E5D8]',
    tadabburButtonNormal: 'text-[#B8A77A] bg-[#B8A77A]/10 border border-[#B8A77A]/16 hover:bg-[#B8A77A]/20',
    tadabburButtonFocus: 'text-[#B8A77A] bg-[#B8A77A]/10 border border-[#B8A77A]/16',

    completedText: 'text-[#B8A77A]',
    completedBadge: 'bg-[#B8A77A]/16 text-[#B8A77A] border border-[#B8A77A]/22',
    completedIconColor: 'text-[#B8A77A]',

    preview: {
      bgHex: '#11110F',
      cardBgHex: '#1B1A17',
      borderHex: '#B8A77A',
      accentHex: '#B8A77A',
      textHex: '#E9E5D8',
      sampleSnippet: '﴿ الذكر ﴾',
    },
  },
};

/**
 * Returns the default theme id according to Azkar category context if the user has
 * never set an explicit theme preference.
 * - Morning Azkar: Dawn (🌅 نور الفجر)
 * - Evening Azkar: Evening (🌙 سكون المساء)
 * - Otherwise: Serenity (🌿 السكينة)
 */
export function getDefaultThemeForCategory(categoryKey?: string): DhikrThemeId {
  if (categoryKey === 'morning') return 'dawn';
  if (categoryKey === 'evening') return 'evening';
  return 'serenity';
}

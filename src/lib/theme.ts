import { MonochromeTheme } from '@/types/job';

export interface ThemeTokens {
  theme: MonochromeTheme;
  isDark: boolean;
  isOrange: boolean;
  pageBg: string;
  navBg: string;
  cardSurface: string;
  subSurface: string;
  inputSurface: string;
  primaryBtn: string;
  contrastBtn: string;
  secondaryBtn: string;
  orangeBadge: string;
  selectedCard: string;
  mutedText: string;
  strongText: string;
  barTrack: string;
  barFill: string;
  borderSubtle: string;
  navTrack: string;
}

export function getThemeTokens(theme: MonochromeTheme): ThemeTokens {
  if (theme === 'orange') {
    return {
      theme,
      isDark: true,
      isOrange: true,
      pageBg: 'bg-[#0d0603] text-orange-50',
      navBg: 'border-orange-500/30 bg-[#0d0603]/95',
      cardSurface: 'border-orange-500/30 bg-[#160a04] text-orange-50',
      subSurface: 'border-orange-500/25 bg-[#1f0e06] text-orange-50',
      inputSurface:
        'border-orange-500/35 bg-[#120803] text-orange-50 focus:border-orange-400',
      primaryBtn:
        'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400 font-bold shadow-md shadow-orange-500/25',
      contrastBtn: 'bg-orange-100 text-[#160a04] hover:bg-white font-bold',
      secondaryBtn:
        'border-orange-500/35 bg-[#120803] text-orange-200 hover:border-orange-400 hover:text-white',
      orangeBadge: 'border-orange-400/50 bg-orange-500/20 text-orange-300',
      selectedCard:
        'border-orange-400 bg-[#1d0d05] shadow-[0_0_0_1px_#fb923c]',
      mutedText: 'text-orange-200/70',
      strongText: 'text-orange-50',
      barTrack: 'bg-[#2a1208]',
      barFill: 'bg-gradient-to-r from-orange-500 to-amber-400',
      borderSubtle: 'border-orange-500/25',
      navTrack: 'border-orange-500/30 bg-[#160a04]',
    };
  }

  if (theme === 'light') {
    return {
      theme,
      isDark: false,
      isOrange: false,
      pageBg: 'bg-neutral-50 text-black',
      navBg: 'border-neutral-200 bg-white/95',
      cardSurface: 'border-neutral-200 bg-white text-black',
      subSurface: 'border-neutral-200 bg-neutral-50 text-black',
      inputSurface:
        'border-neutral-300 bg-white text-black focus:border-orange-500',
      primaryBtn:
        'bg-orange-500 text-white hover:bg-orange-600 font-bold shadow-sm shadow-orange-500/20',
      contrastBtn: 'bg-black text-white hover:bg-neutral-800 font-bold',
      secondaryBtn:
        'border-neutral-300 bg-white text-neutral-800 hover:border-orange-500 hover:text-orange-600',
      orangeBadge: 'border-orange-500/40 bg-orange-50 text-orange-700',
      selectedCard:
        'border-orange-500 bg-white shadow-[0_0_0_1px_#f97316]',
      mutedText: 'text-neutral-600',
      strongText: 'text-black',
      barTrack: 'bg-neutral-200',
      barFill: 'bg-orange-500',
      borderSubtle: 'border-neutral-200',
      navTrack: 'border-neutral-300 bg-neutral-100',
    };
  }

  return {
    theme: 'dark',
    isDark: true,
    isOrange: false,
    pageBg: 'bg-black text-white',
    navBg: 'border-neutral-800 bg-black/95',
    cardSurface: 'border-neutral-800 bg-neutral-950 text-white',
    subSurface: 'border-neutral-800 bg-black text-white',
    inputSurface:
      'border-neutral-800 bg-black text-white focus:border-orange-500',
    primaryBtn:
      'bg-orange-500 text-black hover:bg-orange-400 font-bold shadow-sm shadow-orange-500/20',
    contrastBtn: 'bg-white text-black hover:bg-neutral-200 font-bold',
    secondaryBtn:
      'border-neutral-800 bg-black text-neutral-200 hover:border-orange-500 hover:text-orange-400',
    orangeBadge: 'border-orange-500/40 bg-orange-500/15 text-orange-400',
    selectedCard:
      'border-orange-500 bg-neutral-950 shadow-[0_0_0_1px_#f97316]',
    mutedText: 'text-neutral-400',
    strongText: 'text-white',
    barTrack: 'bg-neutral-900',
    barFill: 'bg-orange-500',
    borderSubtle: 'border-neutral-800',
    navTrack: 'border-neutral-800 bg-neutral-950',
  };
}

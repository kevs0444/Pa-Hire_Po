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
  const isDark = theme === 'dark';

  if (isDark) {
    return {
      theme: 'dark',
      isDark: true,
      isOrange: false,
      pageBg: 'bg-[#0b0f17] text-slate-100',
      navBg: 'border-slate-800 bg-[#111827]',
      cardSurface: 'border-slate-800 bg-[#111827] text-slate-100',
      subSurface: 'border-slate-800 bg-slate-900/75 text-slate-200',
      inputSurface:
        'border-slate-700 bg-[#0b0f17] text-slate-100 focus:border-blue-500',
      primaryBtn:
        'bg-[#2563eb] text-white hover:bg-blue-500 font-semibold',
      contrastBtn:
        'bg-slate-100 text-slate-900 hover:bg-white font-semibold',
      secondaryBtn:
        'border-slate-700 bg-[#111827] text-slate-200 hover:bg-slate-800 hover:border-slate-600',
      orangeBadge:
        'border-blue-500/35 bg-blue-500/12 text-blue-300',
      selectedCard:
        'border-slate-700 border-l-[3px] border-l-blue-500 bg-slate-900/90 text-slate-100',
      mutedText: 'text-slate-400',
      strongText: 'text-slate-50',
      barTrack: 'bg-slate-800',
      barFill: 'bg-blue-500',
      borderSubtle: 'border-slate-800',
      navTrack: 'border-slate-800 bg-slate-900',
    };
  }

  return {
    theme: 'light',
    isDark: false,
    isOrange: false,
    pageBg: 'bg-[#f3f2ef] text-slate-900',
    navBg: 'border-slate-200 bg-white',
    cardSurface:
      'border-slate-200/90 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
    subSurface: 'border-slate-200 bg-slate-50/85 text-slate-900',
    inputSurface:
      'border-slate-300 bg-white text-slate-900 focus:border-[#0a66c2]',
    primaryBtn:
      'bg-[#0a66c2] text-white hover:bg-[#004182] font-semibold',
    contrastBtn:
      'bg-slate-900 text-white hover:bg-slate-800 font-semibold',
    secondaryBtn:
      'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
    orangeBadge:
      'border-[#0a66c2]/25 bg-[#0a66c2]/10 text-[#0a66c2]',
    selectedCard:
      'border-slate-300 border-l-[3px] border-l-[#0a66c2] bg-[#f8fafc] text-slate-900',
    mutedText: 'text-slate-600',
    strongText: 'text-slate-900',
    barTrack: 'bg-slate-200',
    barFill: 'bg-[#0a66c2]',
    borderSubtle: 'border-slate-200',
    navTrack: 'border-slate-200 bg-slate-100',
  };
}

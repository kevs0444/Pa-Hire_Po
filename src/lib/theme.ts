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
  activeBorder: string;
  badgeSuccess: string;
  badgeNeutral: string;
  badgeAccent: string;
  badgeWarning: string;
  badgeDanger: string;
}

export function getThemeTokens(theme: MonochromeTheme): ThemeTokens {
  const isDark = theme === 'dark';

  if (isDark) {
    return {
      theme: 'dark',
      isDark: true,
      isOrange: false,
      pageBg: 'bg-[#121214] text-zinc-100',
      navBg: 'border-zinc-800/90 bg-[#18181b]',
      cardSurface: 'border-zinc-800/90 bg-[#18181b] text-zinc-100',
      subSurface: 'border-zinc-800/80 bg-[#202024] text-zinc-200',
      inputSurface:
        'border-zinc-700 bg-[#121214] text-zinc-100 focus:border-zinc-400',
      primaryBtn:
        'bg-zinc-100 text-zinc-950 hover:bg-white font-semibold shadow-xs',
      contrastBtn:
        'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-semibold border border-zinc-700',
      secondaryBtn:
        'border-zinc-700/80 bg-[#1e1e22] text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600',
      orangeBadge:
        'border-zinc-700 bg-zinc-800/60 text-zinc-200',
      selectedCard:
        'border-zinc-700 border-l-[3px] border-l-zinc-300 bg-[#222227] text-zinc-100',
      mutedText: 'text-zinc-400',
      strongText: 'text-zinc-50',
      barTrack: 'bg-zinc-800',
      barFill: 'bg-zinc-300',
      borderSubtle: 'border-zinc-800/80',
      navTrack: 'border-zinc-800 bg-zinc-900',
      activeBorder: 'border-zinc-300',
      badgeSuccess: 'border-emerald-800/70 bg-emerald-950/60 text-emerald-300',
      badgeNeutral: 'border-zinc-700 bg-zinc-800 text-zinc-300',
      badgeAccent: 'border-zinc-700 bg-zinc-800 text-zinc-200',
      badgeWarning: 'border-amber-700/70 bg-amber-950/50 text-amber-300',
      badgeDanger: 'border-red-700/70 bg-red-950/50 text-red-300',
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
    activeBorder: 'border-[#0a66c2]',
    badgeSuccess: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    badgeNeutral: 'border-slate-200 bg-slate-100 text-slate-700',
    badgeAccent: 'border-[#0a66c2]/25 bg-[#0a66c2]/10 text-[#0a66c2]',
    badgeWarning: 'border-amber-300 bg-amber-50 text-amber-800',
    badgeDanger: 'border-red-300 bg-red-50 text-red-800',
  };
}

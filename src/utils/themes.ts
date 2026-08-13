import { ColorTheme, SymbolPair, SymbolTheme } from '../types';

export const SYMBOL_PAIRS: SymbolPair[] = [
  {
    id: 'bengali',
    nameEn: 'Bengali Kata-Kuti (কাটা - কুটি)',
    nameBn: 'বাংলা কাটা-কুটি',
    xLabel: 'কাটা',
    oLabel: 'কুটি',
    xIcon: '✕',
    oIcon: '◯',
    xColor: 'text-rose-500',
    oColor: 'text-indigo-500'
  },
  {
    id: 'classic',
    nameEn: 'Classic (X vs O)',
    nameBn: 'ক্লাসিক (X vs O)',
    xLabel: 'X',
    oLabel: 'O',
    xIcon: 'X',
    oIcon: 'O',
    xColor: 'text-blue-500',
    oColor: 'text-amber-500'
  },
  {
    id: 'fire_ice',
    nameEn: 'Fire vs Ice (🔥 vs ❄️)',
    nameBn: 'আগুন vs বরফ (🔥 vs ❄️)',
    xLabel: 'Fire',
    oLabel: 'Ice',
    xIcon: '🔥',
    oIcon: '❄️',
    xColor: 'text-orange-500',
    oColor: 'text-sky-400'
  },
  {
    id: 'cats_dogs',
    nameEn: 'Cat vs Dog (🐱 vs 🐶)',
    nameBn: 'বিড়াল vs কুকুর (🐱 vs 🐶)',
    xLabel: 'Cat',
    oLabel: 'Dog',
    xIcon: '🐱',
    oIcon: '🐶',
    xColor: 'text-amber-500',
    oColor: 'text-emerald-500'
  }
];

export interface ThemeConfig {
  id: ColorTheme;
  nameEn: string;
  nameBn: string;
  bgClass: string;
  cardBg: string;
  accentX: string;
  accentO: string;
  textPrimary: string;
  textSecondary: string;
  boardBg: string;
  cellBg: string;
  cellHoverBg: string;
}

export const COLOR_THEMES: Record<ColorTheme, ThemeConfig> = {
  classic: {
    id: 'classic',
    nameEn: 'Royal Blue',
    nameBn: 'রয়্যাল ব্লু',
    bgClass: 'bg-slate-950 text-slate-100',
    cardBg: 'bg-slate-900/80 border-slate-800',
    accentX: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    accentO: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    boardBg: 'bg-slate-900/90 border-slate-800 shadow-2xl',
    cellBg: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-100',
    cellHoverBg: 'hover:bg-slate-700/60'
  },
  neon: {
    id: 'neon',
    nameEn: 'Neon Cyber',
    nameBn: 'নিয়ন সাইবার',
    bgClass: 'bg-gray-950 text-gray-100',
    cardBg: 'bg-gray-900/90 border-fuchsia-900/40',
    accentX: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/40 shadow-fuchsia-500/20',
    accentO: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40 shadow-cyan-500/20',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-400',
    boardBg: 'bg-gray-900/95 border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.15)]',
    cellBg: 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-100',
    cellHoverBg: 'hover:bg-gray-700/80'
  },
  bengali_wood: {
    id: 'bengali_wood',
    nameEn: 'Bengali Heritage',
    nameBn: 'ঐতিহ্যবাহী লাল-মাটি',
    bgClass: 'bg-stone-950 text-stone-100',
    cardBg: 'bg-stone-900/90 border-amber-900/40',
    accentX: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    accentO: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    textPrimary: 'text-stone-100',
    textSecondary: 'text-stone-400',
    boardBg: 'bg-stone-900/95 border-amber-800/40 shadow-2xl',
    cellBg: 'bg-stone-800/90 hover:bg-stone-700/90 text-stone-100',
    cellHoverBg: 'hover:bg-stone-700/70'
  },
  pastel: {
    id: 'pastel',
    nameEn: 'Soft Light',
    nameBn: 'সফট লাইট (হালকা)',
    bgClass: 'bg-slate-50 text-slate-800',
    cardBg: 'bg-white border-slate-200 shadow-sm',
    accentX: 'text-rose-600 bg-rose-50 border-rose-200',
    accentO: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-500',
    boardBg: 'bg-white border-slate-200 shadow-xl',
    cellBg: 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-800',
    cellHoverBg: 'hover:bg-slate-200/60'
  },
  cyberpunk: {
    id: 'cyberpunk',
    nameEn: 'Gold & Black',
    nameBn: 'গোল্ডেন ড্রাগন',
    bgClass: 'bg-zinc-950 text-amber-100',
    cardBg: 'bg-zinc-900/90 border-amber-500/30',
    accentX: 'text-amber-400 bg-amber-500/10 border-amber-500/40',
    accentO: 'text-purple-400 bg-purple-500/10 border-purple-500/40',
    textPrimary: 'text-amber-100',
    textSecondary: 'text-zinc-400',
    boardBg: 'bg-zinc-900/95 border-amber-500/30 shadow-2xl',
    cellBg: 'bg-zinc-800/90 hover:bg-zinc-700/90 text-amber-100',
    cellHoverBg: 'hover:bg-zinc-700/70'
  }
};

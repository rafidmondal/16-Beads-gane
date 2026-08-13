import { ColorTheme, GameStats, Language, SymbolTheme } from '../types';

const STATS_KEY = 'katakuti_game_stats';
const PREFS_KEY = 'katakuti_game_prefs';

export interface UserPrefs {
  language: Language;
  soundEnabled: boolean;
  colorTheme: ColorTheme;
  symbolTheme: SymbolTheme;
}

const defaultStats: GameStats = {
  xWins: 0,
  oWins: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0
};

const defaultPrefs: UserPrefs = {
  language: 'bn', // Default to Bengali as requested by user in Bengali ("bujle ami prd debo")
  soundEnabled: true,
  colorTheme: 'classic',
  symbolTheme: 'bengali' // 'কাটা' & 'কুটি'
};

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats;
    return JSON.parse(raw);
  } catch {
    return defaultStats;
  }
}

export function saveStats(stats: GameStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore error
  }
}

export function resetStatsInStorage(): GameStats {
  saveStats(defaultStats);
  return defaultStats;
}

export function loadPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(prefs: UserPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore error
  }
}

export type GameMode = 'ai' | 'pvp';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GridSize = 3 | 4 | 5;
export type PlayerSymbol = 'X' | 'O';

export type SymbolTheme = 'classic' | 'bengali' | 'fire_ice' | 'cats_dogs';

export interface SymbolPair {
  id: SymbolTheme;
  nameEn: string;
  nameBn: string;
  xLabel: string;
  oLabel: string;
  xIcon: string; // text or emoji or symbol
  oIcon: string;
  xColor: string;
  oColor: string;
}

export type ColorTheme = 'classic' | 'neon' | 'bengali_wood' | 'pastel' | 'cyberpunk';

export type Language = 'en' | 'bn';

export interface WinInfo {
  winner: PlayerSymbol | 'DRAW' | null;
  line: number[] | null; // cell indices
  direction?: 'horizontal' | 'vertical' | 'diagonal-main' | 'diagonal-anti';
}

export interface GameStats {
  xWins: number;
  oWins: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
}

export interface MoveHistoryItem {
  board: (PlayerSymbol | null)[];
  currentPlayer: PlayerSymbol;
  lastMoveIndex: number | null;
}

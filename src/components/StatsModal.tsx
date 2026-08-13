import React from 'react';
import { X, BarChart3, Trophy, Flame, RotateCcw } from 'lucide-react';
import { ColorTheme, GameStats, Language } from '../types';
import { COLOR_THEMES } from '../utils/themes';
import { t } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface StatsModalProps {
  isOpen: boolean;
  language: Language;
  colorTheme: ColorTheme;
  stats: GameStats;
  onClose: () => void;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  language,
  colorTheme,
  stats,
  onClose,
  onResetStats
}) => {
  if (!isOpen) return null;

  const tr = t(language);
  const currentTheme = COLOR_THEMES[colorTheme];

  const winRate = stats.totalGames > 0
    ? Math.round((stats.xWins / stats.totalGames) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-3xl p-5 border ${currentTheme.boardBg} max-h-[90vh] overflow-y-auto relative shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-amber-400" size={22} />
            <span>{tr.stats}</span>
          </h2>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            id="close-stats-btn"
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
            <div className="text-xs text-rose-400 font-bold mb-1">{tr.scoreX}</div>
            <div className="text-3xl font-black text-rose-500">{stats.xWins}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <div className="text-xs text-emerald-400 font-bold mb-1">{tr.scoreO}</div>
            <div className="text-3xl font-black text-emerald-500">{stats.oWins}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div className="text-xs text-slate-400 font-bold mb-1">{tr.draws}</div>
            <div className="text-3xl font-black text-slate-300">{stats.draws}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center">
            <div className="text-xs text-indigo-400 font-bold mb-1">{tr.totalGames}</div>
            <div className="text-3xl font-black text-indigo-400">{stats.totalGames}</div>
          </div>
        </div>

        {/* Streaks & Win Rate */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 mb-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Flame size={16} className="text-amber-500" />
              <span>{tr.currentStreak}</span>
            </span>
            <span className="font-bold text-amber-400 text-lg">{stats.currentStreak}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Trophy size={16} className="text-amber-400" />
              <span>{tr.bestStreak}</span>
            </span>
            <span className="font-bold text-amber-300 text-lg">{stats.bestStreak}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <span className="text-slate-400 font-semibold">Player 1 Win Rate</span>
            <span className="font-bold text-emerald-400 text-lg">{winRate}%</span>
          </div>
        </div>

        {/* Reset Stats */}
        <button
          onClick={() => {
            soundManager.playClick();
            onResetStats();
          }}
          id="reset-stats-btn"
          className="w-full py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw size={15} />
          <span>{tr.resetStats}</span>
        </button>
      </div>
    </div>
  );
};

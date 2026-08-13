import React from 'react';
import { motion } from 'motion/react';
import { Bot, User, Trophy, Flame } from 'lucide-react';
import { ColorTheme, GameMode, GameStats, Language, PlayerSymbol, SymbolPair, WinInfo } from '../types';
import { COLOR_THEMES } from '../utils/themes';
import { t } from '../utils/translations';

interface ScoreBoardProps {
  language: Language;
  colorTheme: ColorTheme;
  symbolPair: SymbolPair;
  gameMode: GameMode;
  currentPlayer: PlayerSymbol;
  winInfo: WinInfo;
  isAiThinking: boolean;
  stats: GameStats;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  language,
  colorTheme,
  symbolPair,
  gameMode,
  currentPlayer,
  winInfo,
  isAiThinking,
  stats
}) => {
  const theme = COLOR_THEMES[colorTheme];
  const tr = t(language);

  const isXTurn = currentPlayer === 'X' && !winInfo.winner;
  const isOTurn = currentPlayer === 'O' && !winInfo.winner;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mb-4">
      {/* Player Score Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
        {/* Player X */}
        <motion.div
          animate={{ scale: isXTurn ? 1.03 : 1 }}
          transition={{ duration: 0.2 }}
          className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center relative overflow-hidden ${
            isXTurn
              ? `${theme.accentX} ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/10`
              : `${theme.cardBg} opacity-80`
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
            <User size={14} className="text-rose-400" />
            <span className="truncate">{symbolPair.xLabel}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-500 flex items-center gap-1">
            <span>{symbolPair.xIcon}</span>
            <span className="text-xl text-slate-300 ml-1">({stats.xWins})</span>
          </div>
          {isXTurn && (
            <motion.div
              layoutId="turn-indicator"
              className="absolute bottom-0 inset-x-0 h-1 bg-rose-500"
            />
          )}
        </motion.div>

        {/* Draws & Streak Center */}
        <div className={`p-2 sm:p-3 rounded-2xl border ${theme.cardBg} flex flex-col items-center justify-center text-center`}>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-amber-400 font-medium">
            <Flame size={13} />
            <span>{tr.currentStreak}: {stats.currentStreak}</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold my-0.5 text-slate-300">
            {tr.draws}: {stats.draws}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Trophy size={10} className="text-amber-400" />
            <span>{tr.totalGames}: {stats.totalGames}</span>
          </div>
        </div>

        {/* Player O / Bot */}
        <motion.div
          animate={{ scale: isOTurn ? 1.03 : 1 }}
          transition={{ duration: 0.2 }}
          className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center relative overflow-hidden ${
            isOTurn
              ? `${theme.accentO} ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10`
              : `${theme.cardBg} opacity-80`
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
            {gameMode === 'ai' ? <Bot size={14} className="text-emerald-400" /> : <User size={14} className="text-emerald-400" />}
            <span className="truncate">{gameMode === 'ai' ? tr.botName : symbolPair.oLabel}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 flex items-center gap-1">
            <span>{symbolPair.oIcon}</span>
            <span className="text-xl text-slate-300 ml-1">({stats.oWins})</span>
          </div>
          {isOTurn && (
            <motion.div
              layoutId="turn-indicator"
              className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500"
            />
          )}
        </motion.div>
      </div>

      {/* Game Status Banner */}
      <div className={`w-full py-2 px-4 rounded-xl text-center text-sm font-bold border ${theme.cardBg} flex items-center justify-center gap-2 shadow-sm`}>
        {winInfo.winner === 'X' && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-rose-400 flex items-center gap-2">
            <span className="text-lg">{symbolPair.xIcon}</span>
            <span>{symbolPair.xLabel} {tr.winnerIs} 🎉</span>
          </motion.div>
        )}
        {winInfo.winner === 'O' && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-emerald-400 flex items-center gap-2">
            <span className="text-lg">{symbolPair.oIcon}</span>
            <span>{gameMode === 'ai' ? tr.botName : symbolPair.oLabel} {tr.winnerIs} 🎉</span>
          </motion.div>
        )}
        {winInfo.winner === 'DRAW' && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-amber-400">
            🤝 {tr.drawGame}
          </motion.div>
        )}
        {!winInfo.winner && (
          <div className="flex items-center gap-2 text-slate-300">
            {isAiThinking ? (
              <span className="animate-pulse text-emerald-400 flex items-center gap-2">
                <Bot size={16} className="animate-spin" /> {tr.aiThinking}
              </span>
            ) : (
              <span>
                {currentPlayer === 'X'
                  ? `${symbolPair.xLabel} (${symbolPair.xIcon}) - ${tr.turnX}`
                  : `${gameMode === 'ai' ? tr.botName : symbolPair.oLabel} (${symbolPair.oIcon}) - ${tr.turnO}`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

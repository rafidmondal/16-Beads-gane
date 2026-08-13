import React from 'react';
import { RotateCcw, Lightbulb, Undo2, Bot, Users, Sparkles } from 'lucide-react';
import { ColorTheme, Difficulty, GameMode, GridSize, Language } from '../types';
import { COLOR_THEMES } from '../utils/themes';
import { t } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface ControlsProps {
  language: Language;
  colorTheme: ColorTheme;
  gameMode: GameMode;
  difficulty: Difficulty;
  gridSize: GridSize;
  canUndo: boolean;
  disabled: boolean;
  onChangeMode: (mode: GameMode) => void;
  onChangeDifficulty: (diff: Difficulty) => void;
  onChangeGridSize: (size: GridSize) => void;
  onReset: () => void;
  onUndo: () => void;
  onHint: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  language,
  colorTheme,
  gameMode,
  difficulty,
  gridSize,
  canUndo,
  disabled,
  onChangeMode,
  onChangeDifficulty,
  onChangeGridSize,
  onReset,
  onUndo,
  onHint
}) => {
  const theme = COLOR_THEMES[colorTheme];
  const tr = t(language);

  return (
    <div className="w-full max-w-md mx-auto px-4 mb-6 flex flex-col gap-3">
      {/* Action Buttons Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Reset / New Game */}
        <button
          onClick={() => {
            soundManager.playClick();
            onReset();
          }}
          id="reset-match-btn"
          className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
        >
          <RotateCcw size={16} />
          <span>{tr.resetGame}</span>
        </button>

        {/* Undo */}
        <button
          onClick={() => {
            if (canUndo && !disabled) {
              soundManager.playClick();
              onUndo();
            }
          }}
          id="undo-btn"
          disabled={!canUndo || disabled}
          className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all ${
            canUndo && !disabled
              ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-100 border-slate-700 active:scale-95'
              : 'bg-slate-800/30 text-slate-600 border-slate-800/50 cursor-not-allowed'
          }`}
        >
          <Undo2 size={16} />
          <span>{tr.undo}</span>
        </button>

        {/* Hint */}
        <button
          onClick={() => {
            if (!disabled) {
              soundManager.playClick();
              onHint();
            }
          }}
          id="hint-btn"
          disabled={disabled}
          className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all ${
            !disabled
              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 active:scale-95'
              : 'bg-slate-800/30 text-slate-600 border-slate-800/50 cursor-not-allowed'
          }`}
        >
          <Lightbulb size={16} className="text-amber-400" />
          <span>{tr.hint}</span>
        </button>
      </div>

      {/* Mode & Grid Config Options */}
      <div className={`p-3 rounded-2xl border ${theme.cardBg} flex flex-col gap-2.5 text-xs`}>
        {/* Game Mode Selector */}
        <div className="flex items-center justify-between">
          <span className={`font-semibold ${theme.textSecondary}`}>{tr.modeAi}:</span>
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => {
                soundManager.playClick();
                onChangeMode('ai');
              }}
              id="mode-ai-btn"
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                gameMode === 'ai'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot size={13} />
              <span>{tr.modeAi.split(' ')[0]}</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onChangeMode('pvp');
              }}
              id="mode-pvp-btn"
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                gameMode === 'pvp'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={13} />
              <span>{tr.modePvp.split(' ')[0]}</span>
            </button>
          </div>
        </div>

        {/* Difficulty Selector (if AI mode) */}
        {gameMode === 'ai' && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
            <span className={`font-semibold ${theme.textSecondary}`}>{tr.difficulty}:</span>
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
                <button
                  key={diff}
                  onClick={() => {
                    soundManager.playClick();
                    onChangeDifficulty(diff);
                  }}
                  id={`difficulty-${diff}-btn`}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    difficulty === diff
                      ? diff === 'hard'
                        ? 'bg-rose-600 text-white'
                        : diff === 'medium'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tr[diff]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid Size Selector */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
          <span className={`font-semibold ${theme.textSecondary}`}>{tr.gridSize}:</span>
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {([3, 4, 5] as GridSize[]).map(size => (
              <button
                key={size}
                onClick={() => {
                  soundManager.playClick();
                  onChangeGridSize(size);
                }}
                id={`grid-size-${size}-btn`}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  gridSize === size
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { ColorTheme, GridSize, PlayerSymbol, SymbolPair, WinInfo } from '../types';
import { COLOR_THEMES } from '../utils/themes';

interface BoardProps {
  gridSize: GridSize;
  board: (PlayerSymbol | null)[];
  winInfo: WinInfo;
  hintIndex: number | null;
  colorTheme: ColorTheme;
  symbolPair: SymbolPair;
  disabled: boolean;
  onCellClick: (index: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  gridSize,
  board,
  winInfo,
  hintIndex,
  colorTheme,
  symbolPair,
  disabled,
  onCellClick
}) => {
  const theme = COLOR_THEMES[colorTheme];

  // Grid style class based on size
  const gridColsClass =
    gridSize === 3 ? 'grid-cols-3' : gridSize === 4 ? 'grid-cols-4' : 'grid-cols-5';

  // Calculate SVG winning line coordinates
  const getWinningLineCoords = () => {
    if (!winInfo.line || winInfo.line.length === 0) return null;

    const firstIdx = winInfo.line[0];
    const lastIdx = winInfo.line[winInfo.line.length - 1];

    const startRow = Math.floor(firstIdx / gridSize);
    const startCol = firstIdx % gridSize;
    const endRow = Math.floor(lastIdx / gridSize);
    const endCol = lastIdx % gridSize;

    const step = 100 / gridSize;
    const x1 = (startCol + 0.5) * step;
    const y1 = (startRow + 0.5) * step;
    const x2 = (endCol + 0.5) * step;
    const y2 = (endRow + 0.5) * step;

    return { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%` };
  };

  const lineCoords = getWinningLineCoords();

  return (
    <div className="w-full max-w-md mx-auto px-4 my-2">
      <div className={`relative p-3 sm:p-4 rounded-3xl border ${theme.boardBg} backdrop-blur-md aspect-square flex items-center justify-center`}>
        {/* Cell Grid */}
        <div className={`w-full h-full grid ${gridColsClass} gap-2 sm:gap-3`}>
          {board.map((cell, idx) => {
            const isWinningCell = winInfo.line?.includes(idx);
            const isHint = hintIndex === idx;

            return (
              <motion.button
                key={idx}
                id={`cell-${idx}`}
                whileHover={!cell && !disabled ? { scale: 1.05 } : {}}
                whileTap={!cell && !disabled ? { scale: 0.95 } : {}}
                onClick={() => onCellClick(idx)}
                disabled={disabled || cell !== null || winInfo.winner !== null}
                className={`relative rounded-2xl flex items-center justify-center font-black transition-all duration-200 select-none cursor-pointer overflow-hidden ${
                  theme.cellBg
                } ${
                  isWinningCell
                    ? cell === 'X'
                      ? 'bg-rose-500/20 border-2 border-rose-500 shadow-lg shadow-rose-500/30'
                      : 'bg-emerald-500/20 border-2 border-emerald-500 shadow-lg shadow-emerald-500/30'
                    : ''
                } ${
                  isHint ? 'ring-4 ring-amber-400/80 bg-amber-400/10 animate-pulse' : ''
                } ${
                  !cell && !disabled ? theme.cellHoverBg : ''
                }`}
              >
                {cell === 'X' && (
                  <motion.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`text-2xl sm:text-4xl md:text-5xl ${symbolPair.xColor}`}
                  >
                    {symbolPair.xIcon}
                  </motion.span>
                )}

                {cell === 'O' && (
                  <motion.span
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`text-2xl sm:text-4xl md:text-5xl ${symbolPair.oColor}`}
                  >
                    {symbolPair.oIcon}
                  </motion.span>
                )}

                {/* Hover indicator preview if empty */}
                {!cell && !disabled && !winInfo.winner && (
                  <span className="opacity-0 hover:opacity-20 text-slate-400 text-xl font-bold transition-opacity">
                    +
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* SVG Winning Line Overlay */}
        {lineCoords && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none p-3 sm:p-4 z-20">
            <motion.line
              x1={lineCoords.x1}
              y1={lineCoords.y1}
              x2={lineCoords.x2}
              y2={lineCoords.y2}
              stroke={winInfo.winner === 'X' ? '#f43f5e' : '#10b981'}
              strokeWidth={gridSize === 3 ? '10' : '7'}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </svg>
        )}
      </div>
    </div>
  );
};

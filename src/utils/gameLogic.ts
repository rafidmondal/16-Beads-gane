import { Difficulty, GridSize, PlayerSymbol, WinInfo } from '../types';

// Get target line length needed to win based on grid size
export function getTargetLineLength(gridSize: GridSize): number {
  if (gridSize === 3) return 3;
  if (gridSize === 4) return 4;
  return 4; // 4 in a row for 5x5 or 5 in a row. Let's set 4 for 5x5 for faster and more dynamic gameplay!
}

// Generate all possible winning lines of `targetLength` for a `gridSize` board
export function getWinningLines(gridSize: GridSize, targetLength: number = getTargetLineLength(gridSize)): number[][] {
  const lines: number[][] = [];

  // Rows
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c <= gridSize - targetLength; c++) {
      const line: number[] = [];
      for (let k = 0; k < targetLength; k++) {
        line.push(r * gridSize + (c + k));
      }
      lines.push(line);
    }
  }

  // Columns
  for (let c = 0; c < gridSize; c++) {
    for (let r = 0; r <= gridSize - targetLength; r++) {
      const line: number[] = [];
      for (let k = 0; k < targetLength; k++) {
        line.push((r + k) * gridSize + c);
      }
      lines.push(line);
    }
  }

  // Main diagonals (\)
  for (let r = 0; r <= gridSize - targetLength; r++) {
    for (let c = 0; c <= gridSize - targetLength; c++) {
      const line: number[] = [];
      for (let k = 0; k < targetLength; k++) {
        line.push((r + k) * gridSize + (c + k));
      }
      lines.push(line);
    }
  }

  // Anti diagonals (/)
  for (let r = 0; r <= gridSize - targetLength; r++) {
    for (let c = targetLength - 1; c < gridSize; c++) {
      const line: number[] = [];
      for (let k = 0; k < targetLength; k++) {
        line.push((r + k) * gridSize + (c - k));
      }
      lines.push(line);
    }
  }

  return lines;
}

// Check winner on current board
export function checkWin(board: (PlayerSymbol | null)[], gridSize: GridSize): WinInfo {
  const lines = getWinningLines(gridSize);

  for (const line of lines) {
    const first = board[line[0]];
    if (first && line.every(idx => board[idx] === first)) {
      return {
        winner: first,
        line: line
      };
    }
  }

  // Check draw
  if (board.every(cell => cell !== null)) {
    return {
      winner: 'DRAW',
      line: null
    };
  }

  return {
    winner: null,
    line: null
  };
}

// Get empty indices
export function getEmptyIndices(board: (PlayerSymbol | null)[]): number[] {
  const empty: number[] = [];
  board.forEach((cell, idx) => {
    if (cell === null) empty.push(idx);
  });
  return empty;
}

// Get AI Move
export function getAIMove(
  board: (PlayerSymbol | null)[],
  gridSize: GridSize,
  difficulty: Difficulty,
  aiSymbol: PlayerSymbol
): number {
  const emptyIndices = getEmptyIndices(board);
  if (emptyIndices.length === 0) return -1;

  // Easy mode: 70% random, 30% smart
  if (difficulty === 'easy') {
    if (Math.random() < 0.7) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }
  }

  // Medium mode: 40% random, 60% smart
  if (difficulty === 'medium') {
    if (Math.random() < 0.4) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }
  }

  const humanSymbol: PlayerSymbol = aiSymbol === 'O' ? 'X' : 'O';

  // Check immediate win for AI
  for (const idx of emptyIndices) {
    const tempBoard = [...board];
    tempBoard[idx] = aiSymbol;
    if (checkWin(tempBoard, gridSize).winner === aiSymbol) {
      return idx;
    }
  }

  // Check immediate block for Human
  for (const idx of emptyIndices) {
    const tempBoard = [...board];
    tempBoard[idx] = humanSymbol;
    if (checkWin(tempBoard, gridSize).winner === humanSymbol) {
      return idx;
    }
  }

  // For 3x3 Hard mode: Minimax
  if (gridSize === 3 && difficulty === 'hard') {
    return minimaxBestMove(board, aiSymbol);
  }

  // Heuristic evaluation for 4x4, 5x5, or fallback
  let bestScore = -Infinity;
  let bestMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

  const lines = getWinningLines(gridSize);

  for (const idx of emptyIndices) {
    let score = 0;

    // Center preference score
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    const centerOffset = Math.abs(row - (gridSize - 1) / 2) + Math.abs(col - (gridSize - 1) / 2);
    score -= centerOffset * 2;

    // Evaluate line potentials
    for (const line of lines) {
      if (line.includes(idx)) {
        let aiCount = 0;
        let humanCount = 0;
        line.forEach(cellIdx => {
          if (board[cellIdx] === aiSymbol) aiCount++;
          if (board[cellIdx] === humanSymbol) humanCount++;
        });

        if (humanCount === 0) {
          score += Math.pow(10, aiCount + 1);
        }
        if (aiCount === 0) {
          score += Math.pow(8, humanCount + 1);
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  return bestMove;
}

// Minimax algorithm for 3x3
function minimaxBestMove(board: (PlayerSymbol | null)[], aiSymbol: PlayerSymbol): number {
  const humanSymbol: PlayerSymbol = aiSymbol === 'O' ? 'X' : 'O';
  const empty = getEmptyIndices(board);

  let bestScore = -Infinity;
  let bestMove = empty[0];

  for (const idx of empty) {
    const temp = [...board];
    temp[idx] = aiSymbol;
    const score = minimax(temp, 0, false, aiSymbol, humanSymbol, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  return bestMove;
}

function minimax(
  board: (PlayerSymbol | null)[],
  depth: number,
  isMaximizing: boolean,
  aiSymbol: PlayerSymbol,
  humanSymbol: PlayerSymbol,
  alpha: number,
  beta: number
): number {
  const win = checkWin(board, 3);
  if (win.winner === aiSymbol) return 10 - depth;
  if (win.winner === humanSymbol) return depth - 10;
  if (win.winner === 'DRAW') return 0;
  if (depth >= 6) return 0; // limit depth for speed

  const empty = getEmptyIndices(board);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const idx of empty) {
      board[idx] = aiSymbol;
      const evalScore = minimax(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta);
      board[idx] = null;
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const idx of empty) {
      board[idx] = humanSymbol;
      const evalScore = minimax(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta);
      board[idx] = null;
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Get Hint for human player
export function getHint(board: (PlayerSymbol | null)[], gridSize: GridSize, playerSymbol: PlayerSymbol): number {
  return getAIMove(board, gridSize, 'hard', playerSymbol);
}

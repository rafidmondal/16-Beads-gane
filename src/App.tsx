import React, { useState, useEffect, useCallback } from 'react';
import { soundManager } from './utils/audio';

// Standard Board Coordinates (37 Points)
const COORDS = [
  // Top Triangle Head (0 to 5)
  { l: 32, t: 3 }, { l: 50, t: 3 }, { l: 68, t: 3 },
  { l: 41, t: 14 }, { l: 50, t: 14 }, { l: 59, t: 14 },

  // 5x5 Main Grid (6 to 30)
  { l: 5, t: 25 }, { l: 27.5, t: 25 }, { l: 50, t: 25 }, { l: 72.5, t: 25 }, { l: 95, t: 25 }, // Row 0
  { l: 5, t: 37.5 }, { l: 27.5, t: 37.5 }, { l: 50, t: 37.5 }, { l: 72.5, t: 37.5 }, { l: 95, t: 37.5 }, // Row 1
  { l: 5, t: 50 }, { l: 27.5, t: 50 }, { l: 50, t: 50 }, { l: 72.5, t: 50 }, { l: 95, t: 50 }, // Row 2 (Center)
  { l: 5, t: 62.5 }, { l: 27.5, t: 62.5 }, { l: 50, t: 62.5 }, { l: 72.5, t: 62.5 }, { l: 95, t: 62.5 }, // Row 3
  { l: 5, t: 75 }, { l: 27.5, t: 75 }, { l: 50, t: 75 }, { l: 72.5, t: 75 }, { l: 95, t: 75 }, // Row 4

  // Bottom Triangle Head (31 to 36)
  { l: 41, t: 86 }, { l: 50, t: 86 }, { l: 59, t: 86 },
  { l: 32, t: 97 }, { l: 50, t: 97 }, { l: 68, t: 97 }
];

// Board Connections (Lines)
const LINE_PAIRS: [number, number][] = [
  // Top Head
  [0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [3, 8], [1, 4], [4, 8], [2, 5], [5, 8],

  // 5x5 Grid Horizontals
  [6, 7], [7, 8], [8, 9], [9, 10],
  [11, 12], [12, 13], [13, 14], [14, 15],
  [16, 17], [17, 18], [18, 19], [19, 20],
  [21, 22], [22, 23], [23, 24], [24, 25],
  [26, 27], [27, 28], [28, 29], [29, 30],

  // 5x5 Grid Verticals
  [6, 11], [11, 16], [16, 21], [21, 26],
  [7, 12], [12, 17], [17, 22], [22, 27],
  [8, 13], [13, 18], [18, 23], [23, 28],
  [9, 14], [14, 19], [19, 24], [24, 29],
  [10, 15], [15, 20], [20, 25], [25, 30],

  // 5x5 Grid Diagonals
  [6, 12], [12, 18], [8, 12], [12, 16],
  [8, 14], [14, 20], [10, 14], [14, 18],
  [16, 22], [22, 28], [18, 22], [22, 26],
  [18, 24], [24, 30], [20, 24], [24, 28],

  // Bottom Head
  [28, 31], [31, 34], [28, 32], [32, 35], [28, 33], [33, 36],
  [31, 32], [32, 33], [34, 35], [35, 36]
];

// Jump Triples [A, B, C]
const TRIPLES: [number, number, number][] = [
  // Horizontals
  [0, 1, 2], [3, 4, 5],
  [6, 7, 8], [7, 8, 9], [8, 9, 10],
  [11, 12, 13], [12, 13, 14], [13, 14, 15],
  [16, 17, 18], [17, 18, 19], [18, 19, 20],
  [21, 22, 23], [22, 23, 24], [23, 24, 25],
  [26, 27, 28], [27, 28, 29], [28, 29, 30],
  [31, 32, 33], [34, 35, 36],

  // Verticals
  [1, 4, 8], [4, 8, 13],
  [6, 11, 16], [11, 16, 21], [16, 21, 26],
  [7, 12, 17], [12, 17, 22], [17, 22, 27],
  [8, 13, 18], [13, 18, 23], [18, 23, 28],
  [9, 14, 19], [14, 19, 24], [19, 24, 29],
  [10, 15, 20], [15, 20, 25], [20, 25, 30],
  [23, 28, 32], [28, 32, 35],

  // Diagonals
  [0, 3, 8], [2, 5, 8],
  [28, 31, 34], [28, 33, 36],
  [6, 12, 18], [8, 12, 16],
  [8, 14, 20], [10, 14, 18],
  [16, 22, 28], [18, 22, 26],
  [18, 24, 30], [20, 24, 28]
];

// Generate Adjacency Graph
const ADJ: number[][] = Array.from({ length: 37 }, () => []);
LINE_PAIRS.forEach(([u, v]) => {
  if (!ADJ[u].includes(v)) ADJ[u].push(v);
  if (!ADJ[v].includes(u)) ADJ[v].push(u);
});

// Generate Jump Map
interface Jump {
  over: number;
  to: number;
}
const JUMPS: Jump[][] = Array.from({ length: 37 }, () => []);
TRIPLES.forEach(([a, b, c]) => {
  JUMPS[a].push({ over: b, to: c });
  JUMPS[c].push({ over: b, to: a });
});

function createInitialBoard(): number[] {
  const b = new Array(37).fill(0);
  for (let i = 0; i <= 15; i++) b[i] = 2; // Black / AI Beads
  for (let i = 21; i <= 36; i++) b[i] = 1; // Ivory / Player Beads
  return b;
}

type GameMode = 'vs_computer' | 'vs_friend';

// Premium SVG Icons
const HomeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const SingleUserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TwoUsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M9 21v-2a4 4 0 0 0-4-4H3a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const VolumeOnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

export default function App() {
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [gameMode, setGameMode] = useState<GameMode>('vs_computer');
  const [board, setBoard] = useState<number[]>(() => createInitialBoard());
  const [turn, setTurn] = useState<number>(1); // 1 = Ivory, 2 = Black
  const [selected, setSelected] = useState<number>(-1);
  const [hasBonusTurn, setHasBonusTurn] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('Your Move');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  
  // About & Rules Modal state
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  
  // Policy Modal state
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);

  // PWA beforeinstallprompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Auto show install invitation after 1.5 seconds if available or standalone
    const timer = setTimeout(() => {
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBanner(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } else {
      alert('To install this app, tap your browser menu and select "Add to Home Screen" or "Install App".');
      setShowInstallBanner(false);
    }
  };


  // Helper functions
  const getLegalJumps = useCallback((pos: number, playerTurn: number, currentBoard: number[]) => {
    const opp = playerTurn === 1 ? 2 : 1;
    return JUMPS[pos].filter(j => currentBoard[j.over] === opp && currentBoard[j.to] === 0);
  }, []);

  const getLegalMoves = useCallback((pos: number, currentBoard: number[]) => {
    return ADJ[pos].filter(to => currentBoard[to] === 0);
  }, []);

  const hasAnyLegalMoves = useCallback((playerTurn: number, currentBoard: number[]) => {
    for (let i = 0; i < 37; i++) {
      if (currentBoard[i] === playerTurn) {
        if (getLegalJumps(i, playerTurn, currentBoard).length > 0) return true;
        if (getLegalMoves(i, currentBoard).length > 0) return true;
      }
    }
    return false;
  }, [getLegalJumps, getLegalMoves]);

  const checkWinCondition = useCallback((currentBoard: number[], currentTurn: number, mode: GameMode): boolean => {
    const p1Count = currentBoard.filter(v => v === 1).length;
    const p2Count = currentBoard.filter(v => v === 2).length;

    if (p2Count === 0) {
      if (mode === 'vs_computer') {
        setStatusText('Victory! You captured all 16 opponent beads!');
        soundManager.playWin();
      } else {
        setStatusText('Player 1 (Ivory) Wins! All opponent beads captured!');
        soundManager.playWin();
      }
      setGameOver(true);
      return true;
    } else if (p1Count === 0) {
      if (mode === 'vs_computer') {
        setStatusText('Computer Won!');
        soundManager.playLoss();
      } else {
        setStatusText('Player 2 (Black) Wins! All opponent beads captured!');
        soundManager.playWin();
      }
      setGameOver(true);
      return true;
    } else if (!hasAnyLegalMoves(currentTurn, currentBoard)) {
      if (mode === 'vs_computer') {
        if (currentTurn === 1) {
          setStatusText('No moves available! Computer Wins!');
          soundManager.playLoss();
        } else {
          setStatusText('Computer is completely blocked! You Win!');
          soundManager.playWin();
        }
      } else {
        if (currentTurn === 1) {
          setStatusText('Player 1 is completely blocked! Player 2 Wins!');
        } else {
          setStatusText('Player 2 is completely blocked! Player 1 Wins!');
        }
        soundManager.playWin();
      }
      setGameOver(true);
      return true;
    }
    return false;
  }, [hasAnyLegalMoves]);

  const startGame = (mode: GameMode) => {
    soundManager.playGameStart();
    setGameMode(mode);
    setShowMenu(false);
    const newB = createInitialBoard();
    setBoard(newB);
    setTurn(1);
    setSelected(-1);
    setHasBonusTurn(false);
    setGameOver(false);
    setStatusText(mode === 'vs_computer' ? 'Your Move' : 'Player 1 Turn (Ivory)');
  };

  const initGame = () => {
    soundManager.playGameStart();
    const newB = createInitialBoard();
    setBoard(newB);
    setTurn(1);
    setSelected(-1);
    setHasBonusTurn(false);
    setGameOver(false);
    setStatusText(gameMode === 'vs_computer' ? 'Your Move' : 'Player 1 Turn (Ivory)');
  };

  // Execute a Capture Jump Move (Awards Bonus Turn)
  const executeCapture = useCallback((from: number, over: number, to: number, playerTurn: number) => {
    soundManager.playCapture();
    setBoard(prevBoard => {
      const nextBoard = [...prevBoard];
      nextBoard[to] = playerTurn;
      nextBoard[from] = 0;
      nextBoard[over] = 0;

      setSelected(-1);
      setHasBonusTurn(true);

      const isEnded = checkWinCondition(nextBoard, playerTurn, gameMode);
      if (!isEnded) {
        if (gameMode === 'vs_computer') {
          if (playerTurn === 1) {
            setStatusText('Free Bonus Move! Capture again or make a move.');
          } else {
            setStatusText('Computer Bonus Turn...');
          }
        } else {
          setStatusText(
            playerTurn === 1
              ? 'Player 1 Bonus Turn! Move or capture again.'
              : 'Player 2 Bonus Turn! Move or capture again.'
          );
        }
      }

      return nextBoard;
    });
  }, [checkWinCondition, gameMode]);

  // Execute a Simple Step Move (Consumes Turn)
  const executeSimpleMove = useCallback((from: number, to: number, playerTurn: number) => {
    soundManager.playMove();
    setBoard(prevBoard => {
      const nextBoard = [...prevBoard];
      nextBoard[to] = playerTurn;
      nextBoard[from] = 0;

      setSelected(-1);
      setHasBonusTurn(false);

      const nextTurn = playerTurn === 1 ? 2 : 1;
      setTurn(nextTurn);

      const isEnded = checkWinCondition(nextBoard, nextTurn, gameMode);
      if (!isEnded) {
        if (gameMode === 'vs_computer') {
          setStatusText(nextTurn === 1 ? 'Your Move' : 'Computer Thinking...');
        } else {
          setStatusText(nextTurn === 1 ? 'Player 1 Turn (Ivory)' : 'Player 2 Turn (Black)');
        }
      }

      return nextBoard;
    });
  }, [checkWinCondition, gameMode]);

  // AI Computer Turn (only active in vs_computer mode)
  useEffect(() => {
    if (showMenu || gameOver || gameMode !== 'vs_computer' || turn !== 2) return;

    const timer = setTimeout(() => {
      // 1. Priority 1: Captures (Gives another bonus turn)
      const captureMoves: { from: number; over: number; to: number }[] = [];
      for (let i = 0; i < 37; i++) {
        if (board[i] === 2) {
          const jumps = getLegalJumps(i, 2, board);
          jumps.forEach(j => captureMoves.push({ from: i, over: j.over, to: j.to }));
        }
      }

      if (captureMoves.length > 0) {
        const move = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        executeCapture(move.from, move.over, move.to, 2);
        return;
      }

      // 2. Priority 2: Simple Moves (Consumes turn & bonus turn)
      const simpleMoves: { from: number; to: number }[] = [];
      for (let i = 0; i < 37; i++) {
        if (board[i] === 2) {
          const steps = getLegalMoves(i, board);
          steps.forEach(to => simpleMoves.push({ from: i, to }));
        }
      }

      if (simpleMoves.length > 0) {
        const move = simpleMoves[Math.floor(Math.random() * simpleMoves.length)];
        executeSimpleMove(move.from, move.to, 2);
      } else {
        checkWinCondition(board, 2, 'vs_computer');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    turn,
    hasBonusTurn,
    board,
    gameOver,
    gameMode,
    showMenu,
    getLegalJumps,
    getLegalMoves,
    executeCapture,
    executeSimpleMove,
    checkWinCondition
  ]);

  // Player Tap Handler
  const handleTap = (i: number) => {
    if (gameOver || showMenu) return;
    if (gameMode === 'vs_computer' && turn === 2) return; // Computer thinking

    // Select Player's Bead
    if (board[i] === turn) {
      soundManager.playSelect();
      setSelected(i);
      return;
    }

    // Execute Move
    if (selected !== -1 && board[i] === 0) {
      const jumps = getLegalJumps(selected, turn, board);
      const matchedJump = jumps.find(j => j.to === i);

      if (matchedJump) {
        executeCapture(selected, matchedJump.over, matchedJump.to, turn);
      } else if (ADJ[selected].includes(i)) {
        executeSimpleMove(selected, i, turn);
      } else {
        soundManager.playInvalid();
      }
    } else {
      soundManager.playInvalid();
    }
  };

  const handleToggleSound = () => {
    const enabled = soundManager.toggleSound();
    setSoundEnabled(enabled);
  };

  const p1Count = board.filter(v => v === 1).length;
  const p2Count = board.filter(v => v === 2).length;

  const currentJumps = selected !== -1 ? getLegalJumps(selected, turn, board) : [];
  const currentSteps = selected !== -1 ? getLegalMoves(selected, board) : [];

  return (
    <div className="game-wrapper">
      <style>{`
        :root {
          --bg-dark:       #060403;
          --gold-line:     #e2b453;
          --gold-bright:   #fce49c;
          --gold-border:   #5e441f;
          --gold-frame:    #b88d3b;
          --serif-font:    'Georgia', 'Times New Roman', serif;
          --sans-font:     -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        * { 
          box-sizing: border-box; 
          -webkit-tap-highlight-color: transparent; 
        }

        .game-wrapper {
          margin: 0; 
          padding: 0; 
          width: 100vw; 
          height: 100vh;
          background-color: var(--bg-dark);
          color: #ffffff;
          font-family: var(--sans-font);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          -webkit-user-select: none; 
          user-select: none;
          position: relative;
        }

        /* HOME / MENU OVERLAY */
        .menu-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #18110a 0%, #060403 100%);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 24px 16px;
          text-align: center;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .menu-title {
          font-family: var(--serif-font);
          font-size: 2.2rem;
          font-weight: bold;
          color: var(--gold-bright);
          text-shadow: 0 2px 10px rgba(226, 180, 83, 0.4);
          margin: 0 0 4px 0;
          letter-spacing: 0.05em;
        }

        .menu-subtitle {
          font-size: 0.85rem;
          color: var(--gold-line);
          margin-bottom: 32px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .mode-cards-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          max-width: 320px;
        }

        .mode-card {
          background: linear-gradient(180deg, #22180f 0%, #110a05 100%);
          border: 1.5px solid var(--gold-frame);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          box-shadow: 0 6px 16px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1);
          text-align: left;
        }

        .mode-card:hover, .mode-card:active {
          transform: translateY(-2px) scale(1.02);
          border-color: var(--gold-bright);
          box-shadow: 0 10px 24px rgba(226, 180, 83, 0.25), inset 0 1px 2px rgba(255,255,255,0.2);
        }

        .mode-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(184, 141, 59, 0.15);
          border: 1px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mode-info .mode-name {
          font-family: var(--serif-font);
          font-size: 1.1rem;
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .mode-info .mode-desc {
          font-size: 0.75rem;
          color: #a89474;
          line-height: 1.2;
        }

        .rule-preview-chatgpt {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(180deg, #18110a 0%, #0d0905 100%);
          border: 1px solid #10a37f;
          border-radius: 16px;
          padding: 4px 10px 4px 6px;
          color: #ffffff;
          text-decoration: none;
          box-shadow: 0 3px 10px rgba(16, 163, 127, 0.2), 0 2px 5px rgba(0,0,0,0.8);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .rule-preview-chatgpt:hover {
          background: linear-gradient(180deg, #10a37f 0%, #086b53 100%);
          border-color: #1dd3a6;
          box-shadow: 0 4px 14px rgba(16, 163, 127, 0.4);
          transform: translateY(-1px) scale(1.02);
        }

        .chatgpt-logo-wrap {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #10a37f;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }

        .chatgpt-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.1;
        }

        .chatgpt-title {
          font-family: var(--serif-font);
          color: var(--gold-bright);
          font-weight: bold;
          font-size: 0.65rem;
          letter-spacing: 0.04em;
        }

        .chatgpt-sub {
          font-size: 0.55rem;
          color: #a89474;
          font-weight: 500;
        }

        .rule-preview-chatgpt:hover .chatgpt-title {
          color: #ffffff;
        }
        .rule-preview-chatgpt:hover .chatgpt-sub {
          color: #e2f9f2;
        }

        /* TOP HEADER */
        .top-container {
          width: 100%;
          max-width: 430px;
          padding: 10px 16px 2px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .nav-bar {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .nav-btn {
          background: linear-gradient(180deg, #1d140b, #0c0804);
          border: 1px solid var(--gold-border);
          color: var(--gold-bright);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          letter-spacing: 0.03em;
        }

        .nav-btn:active {
          transform: scale(0.96);
        }

        .players-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .player-card {
          flex: 1;
          background: linear-gradient(180deg, #18110a 0%, #0c0804 100%);
          border: 1.2px solid var(--gold-border);
          border-radius: 12px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.05), 0 4px 8px rgba(0,0,0,0.6);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .player-card.active-turn {
          border-color: var(--gold-bright);
          box-shadow: 0 0 10px rgba(252, 228, 156, 0.25);
        }

        .player-card.right {
          justify-content: flex-end;
          text-align: right;
        }

        .player-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .player-avatar.ivory-icon {
          background: radial-gradient(circle at 35% 30%, #ffffff 0%, #eae0d0 35%, #bca98b 70%, #736248 100%);
          border: 1px solid #7a664d;
        }

        .player-avatar.black-icon {
          background: radial-gradient(circle at 35% 30%, #808080 0%, #3e3e3e 35%, #1c1c1c 70%, #050505 100%);
          border: 1.2px solid #a89163;
        }

        .player-info .name {
          font-family: var(--serif-font);
          font-size: 0.85rem;
          font-weight: 600;
          color: #f0e8dc;
        }

        .player-info .sub {
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          color: var(--gold-line);
          font-weight: 600;
          text-transform: uppercase;
        }

        .vs-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #060403;
          border: 1.2px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          color: var(--gold-bright);
          font-weight: bold;
          margin: 0 4px;
        }

        .score-bars-row {
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 0 2px;
        }

        .pips-group {
          display: flex;
          gap: 3px;
          max-width: 150px;
          flex-wrap: wrap;
        }

        .pip {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #181108;
        }

        .pip.ivory-pip { background: radial-gradient(circle at 35% 30%, #ffffff, #c7b599); }
        .pip.black-pip { background: radial-gradient(circle at 35% 30%, #888888, #222222); border: 0.5px solid #aaa; }

        .turn-pill {
          padding: 5px 18px;
          border-radius: 12px;
          background: linear-gradient(180deg, #150e08, #090503);
          border: 1px solid var(--gold-border);
          font-family: var(--serif-font);
          font-size: 0.78rem;
          color: var(--gold-bright);
          text-align: center;
          letter-spacing: 0.03em;
        }

        /* BOARD CONTAINER */
        .board-wrap {
          position: relative;
          width: 95vw;
          max-width: 420px;
          flex: 1;
          margin: 6px 0 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .board-slab {
          position: absolute; 
          inset: 0;
          border-radius: 20px;
          background: repeating-linear-gradient(135deg, #19110a 0px, #19110a 3px, #110b06 3px, #110b06 8px);
          border: 2px solid var(--gold-frame);
          box-shadow: 0 0 0 3px #080503, 0 0 0 4.5px var(--gold-border), inset 0 0 30px rgba(0,0,0,0.9);
        }

        .grid-square {
          position: absolute;
          inset: 12px 8px;
          z-index: 1;
        }

        svg.lines {
          position: absolute; 
          inset: 0; 
          width: 100%; 
          height: 100%;
          pointer-events: none;
        }

        svg.lines line {
          stroke: var(--gold-line);
          stroke-width: 1.8px;
          vector-effect: non-scaling-stroke;
          stroke-linecap: round;
        }

        .points-layer { 
          position: absolute; 
          inset: 0; 
        }

        .spot {
          position: absolute;
          width: 10%; 
          height: 6%;
          transform: translate(-50%,-50%);
          display: flex; 
          align-items: center; 
          justify-content: center;
          cursor: pointer;
          z-index: 2;
        }

        .spot .node {
          width: 10px; 
          height: 10px;
          border-radius: 50%;
          background: transparent;
          border: 1.5px solid #d8a846;
        }

        .spot.hint .node {
          border: 2px dashed var(--gold-bright);
          animation: hintPulse 1.2s ease-in-out infinite;
        }

        .spot.capture-hint .node {
          border: 2px solid #ff4d4d;
          background: rgba(255, 77, 77, 0.4);
          animation: hintPulse 0.8s ease-in-out infinite;
        }

        @keyframes hintPulse {
          0%, 100% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        .bead {
          position: absolute;
          width: min(6.8vw, 27px); 
          height: min(6.8vw, 27px);
          border-radius: 50%;
          display: none;
          transition: transform .15s ease;
        }

        .bead.p1 {
          display: block;
          background: radial-gradient(circle at 35% 30%, #ffffff 0%, #eae0d0 35%, #bca98b 70%, #736248 100%);
          box-shadow: inset 0 -2px 3px rgba(0,0,0,0.4), inset 0 1.5px 2px rgba(255,255,255,0.9), 0 3px 6px rgba(0,0,0,0.75);
        }

        .bead.p2 {
          display: block;
          background: radial-gradient(circle at 32% 28%, #808080 0%, #3e3e3e 35%, #1c1c1c 70%, #050505 100%);
          border: 1.2px solid #cbb27d;
          box-shadow: 0 0 6px rgba(0,0,0,0.95);
        }

        .spot.selected .bead {
          transform: scale(1.2) translateY(-3px);
          box-shadow: 0 8px 14px rgba(0,0,0,0.85), 0 0 0 2.5px var(--gold-bright);
        }

        .action-btns {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .restart-btn {
          padding: 6px 14px;
          font-size: 0.75rem;
          background: linear-gradient(180deg, #b88d3b, #5e441f);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }

        .about-link-btn {
          margin-top: 0;
          background: transparent;
          border: none;
          color: var(--gold-line);
          font-size: 0.75rem;
          text-decoration: underline;
          cursor: pointer;
          opacity: 0.85;
          letter-spacing: 0.05em;
        }
        .about-link-btn:hover {
          color: var(--gold-bright);
          opacity: 1;
        }

        /* PWA INSTALL POPUP */
        .pwa-install-popup {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 380px;
          background: linear-gradient(180deg, #1f160e 0%, #0d0804 100%);
          border: 1.5px solid var(--gold-frame);
          border-radius: 14px;
          padding: 10px 14px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.9), 0 0 15px rgba(226, 180, 83, 0.2);
          z-index: 100;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        .pwa-popup-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pwa-popup-icon {
          font-size: 1.5rem;
        }

        .pwa-popup-text {
          flex: 1;
        }

        .pwa-popup-title {
          font-size: 0.82rem;
          font-weight: bold;
          color: var(--gold-bright);
        }

        .pwa-popup-desc {
          font-size: 0.68rem;
          color: #bfa888;
        }

        .pwa-install-btn {
          background: linear-gradient(180deg, #b88d3b 0%, #5e441f 100%);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.72rem;
          font-weight: bold;
          cursor: pointer;
        }

        .pwa-close-btn {
          background: transparent;
          border: none;
          color: #a89474;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 2px 4px;
        }

        /* ABOUT MODAL OVERLAY */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          z-index: 120;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .modal-content {
          background: linear-gradient(180deg, #19110a 0%, #0a0603 100%);
          border: 1.5px solid var(--gold-frame);
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 12px 36px rgba(0,0,0,0.9);
          color: #e5d8c5;
          padding: 20px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--gold-border);
          padding-bottom: 10px;
          margin-bottom: 14px;
        }

        .modal-header h2 {
          font-family: var(--serif-font);
          font-size: 1.15rem;
          color: var(--gold-bright);
          margin: 0;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: var(--gold-line);
          font-size: 1.2rem;
          cursor: pointer;
        }

        .modal-body h3 {
          font-family: var(--serif-font);
          font-size: 0.92rem;
          color: var(--gold-bright);
          margin: 14px 0 6px 0;
        }

        .modal-body p, .modal-body ul {
          font-size: 0.78rem;
          line-height: 1.5;
          color: #c7b599;
          margin: 0 0 10px 0;
        }

        .modal-body a {
          color: var(--gold-bright);
          text-decoration: underline;
          word-break: break-all;
        }
        .modal-body a:hover {
          color: #ffffff;
        }

        .modal-body ul {
          padding-left: 18px;
        }

        .modal-body li {
          margin-bottom: 6px;
        }

        .modal-footer-brand {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid var(--gold-border);
          text-align: center;
          font-size: 0.7rem;
          color: var(--gold-line);
          letter-spacing: 0.05em;
        }

        .policy-btn-container {
          margin: 16px 0;
          text-align: center;
        }

        .p-btn {
          background: linear-gradient(180deg, #b88d3b 0%, #5e441f 100%);
          color: #ffffff;
          padding: 10px 20px;
          border: 1.5px solid var(--gold-frame);
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.82rem;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.6), 0 0 10px rgba(226, 180, 83, 0.2);
          transition: all 0.2s ease;
        }

        .p-btn:hover {
          background: linear-gradient(180deg, #e2b453 0%, #856128 100%);
          box-shadow: 0 6px 18px rgba(226, 180, 83, 0.4);
          transform: translateY(-1px);
        }

      `}</style>

      {/* HOME / MENU OVERLAY */}
      {showMenu && (
        <div className="menu-overlay">
          {/* First screen view - 100% identical original layout & positioning */}
          <div className="w-full min-h-full flex flex-col items-center justify-between shrink-0 py-6 px-4">
            {/* Header at Top */}
            <div className="text-center pt-2">
              <h1 className="menu-title">SHOLO GUTI</h1>
              <div className="menu-subtitle">16 BEAD STRATEGY BOARD GAME</div>
            </div>

            {/* Mode Cards in Middle */}
            <div className="w-full flex flex-col items-center my-auto py-2">
              <div className="mode-cards-container">
                <div className="mode-card" onClick={() => startGame('vs_computer')}>
                  <div className="mode-icon">
                    <SingleUserIcon />
                  </div>
                  <div className="mode-info">
                    <div className="mode-name">Play vs Computer</div>
                    <div className="mode-desc">Single player game against intelligent AI Bot</div>
                  </div>
                </div>

                <div className="mode-card" onClick={() => startGame('vs_friend')}>
                  <div className="mode-icon">
                    <TwoUsersIcon />
                  </div>
                  <div className="mode-info">
                    <div className="mode-name">Pass & Play (vs Friend)</div>
                    <div className="mode-desc">2 Players on same device, take turns tapping</div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[320px] flex justify-start mt-3">
                <a
                  href="https://chatgpt.com/?prompt=Please+search+https%3A%2F%2F16-bead-game.raxzen.in%2F+and+search+%2216+Bead%22+or+%2216+Ghuti%22.+Give+me+a+short%2C+clean%2C+point-to-point+answer+covering%3A+1.+What+the+game+is%2C+2.+Rules%2C+3.+How+to+play%2C+4.+Piece+movement%2C+5.+Capturing%2C+6.+How+to+win%2C+7.+Key+strategies%2C+8.+Main+features%2C+9.+Future+potential.+Use+only+verified+information.+Keep+each+point+brief+and+do+not+give+a+long+explanation."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rule-preview-chatgpt"
                  title="Ask ChatGPT for 16 Bead Game Rules"
                >
                  <div className="chatgpt-logo-wrap">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558l-5.8144-3.3543 2.0201-1.1685a.0757.0757 0 0 1 .071 0l4.8303 2.7865a4.4944 4.4944 0 0 1-.5015 8.1001v-5.6868a.7853.7853 0 0 0-.6055-.677zm2.2992-3.1332l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0l-5.8428 3.3685v-2.3324a.0804.0804 0 0 1 .0332-.0615l4.816-2.7818a4.4992 4.4992 0 0 1 6.6754 4.6508zm-12.0158-5.732a4.4755 4.4755 0 0 1 2.8764 1.0408l-.1419.0804-4.7783 2.7582a.7948.7948 0 0 0-.3927.6813v6.7369l-2.02-1.1686a.071.071 0 0 1-.038-.052V6.7571A4.504 4.504 0 0 1 11.7235 2.89z"/>
                    </svg>
                  </div>
                  <div className="chatgpt-text">
                    <span className="chatgpt-title">GAME RULES</span>
                    <span className="chatgpt-sub">Ask ChatGPT AI ↗</span>
                  </div>
                </a>
              </div>
            </div>

            {/* About & Policies Links at Bottom of 100vh Screen */}
            <div className="flex gap-4 items-center justify-center pt-2 pb-2">
              <button className="about-link-btn" onClick={() => { soundManager.playClick(); setShowAboutModal(true); }}>
                About &amp; Rules
              </button>
              <span className="text-amber-800/60">•</span>
              <button className="about-link-btn" onClick={() => { soundManager.playClick(); setShowPolicyModal(true); }}>
                All Policies
              </button>
            </div>
          </div>

          {/* Invisible Box / Long Extra Space below About & Rules / All Policies */}
          <div className="w-full shrink-0" style={{ height: '280px', pointerEvents: 'none' }} />

          {/* Ad banner at the very bottom below the long invisible box */}
          <div className="w-full shrink-0 flex flex-col items-center justify-center pt-2 pb-10">
            <iframe
              title="Advertisement"
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <style>
                      body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }
                    </style>
                  </head>
                  <body>
                    <script type="text/javascript">
                      atOptions = {
                        'key' : '8b1e40d7bd9028cdfe79e13bc8922c3d',
                        'format' : 'iframe',
                        'height' : 50,
                        'width' : 320,
                        'params' : {}
                      };
                    </script>
                    <script type="text/javascript" src="https://www.highperformanceformat.com/8b1e40d7bd9028cdfe79e13bc8922c3d/invoke.js"></script>
                  </body>
                </html>
              `}
              width={320}
              height={50}
              style={{ border: 'none', overflow: 'hidden', background: 'transparent' }}
            />
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="top-container">
        <div className="nav-bar">
          <button className="nav-btn" onClick={() => { soundManager.playClick(); setShowMenu(true); }}>
            <HomeIcon /> MODES
          </button>
          <button className="nav-btn" onClick={handleToggleSound} title={soundEnabled ? "Mute Sound" : "Enable Sound"}>
            {soundEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />} {soundEnabled ? 'SOUND' : 'MUTED'}
          </button>
          <button className="nav-btn" onClick={() => { soundManager.playClick(); setShowAboutModal(true); }}>
            RULES
          </button>
          <button className="nav-btn" onClick={initGame}>
            <RefreshIcon /> RESTART
          </button>
        </div>

        <div className="players-row">
          <div className={`player-card ${turn === 1 ? 'active-turn' : ''}`}>
            <div className="player-avatar ivory-icon"></div>
            <div className="player-info">
              <div className="name">{gameMode === 'vs_computer' ? 'You' : 'Player 1'}</div>
              <div className="sub">IVORY</div>
            </div>
          </div>

          <div className="vs-badge">VS</div>

          <div className={`player-card right ${turn === 2 ? 'active-turn' : ''}`}>
            <div className="player-info">
              <div className="name">{gameMode === 'vs_computer' ? 'Computer' : 'Player 2'}</div>
              <div className="sub">BLACK</div>
            </div>
            <div className="player-avatar black-icon"></div>
          </div>
        </div>

        <div className="score-bars-row">
          <div className="pips-group">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={`pip ${i < p1Count ? 'ivory-pip' : ''}`} />
            ))}
          </div>
          <div className="pips-group">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={`pip ${i < p2Count ? 'black-pip' : ''}`} />
            ))}
          </div>
        </div>

        <div className="turn-pill">{statusText}</div>

        {gameOver && (
          <div className="action-btns">
            <button className="restart-btn" onClick={initGame}>
              <RefreshIcon /> Play Again
            </button>
            <button className="restart-btn" onClick={() => setShowMenu(true)}>
              <HomeIcon /> Change Mode
            </button>
          </div>
        )}
      </div>

      {/* BOARD CONTAINER */}
      <div className="board-wrap">
        <div className="board-slab"></div>
        <div className="grid-square">
          <svg className="lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {LINE_PAIRS.map(([u, v], idx) => (
              <line
                key={idx}
                x1={`${COORDS[u].l}%`}
                y1={`${COORDS[u].t}%`}
                x2={`${COORDS[v].l}%`}
                y2={`${COORDS[v].t}%`}
              />
            ))}
          </svg>

          <div className="points-layer">
            {COORDS.map((coord, i) => {
              const isSelected = selected === i;
              const isHint = currentSteps.includes(i);
              const isCaptureHint = currentJumps.some(j => j.to === i);

              return (
                <div
                  key={i}
                  className={`spot ${isSelected ? 'selected' : ''} ${isHint ? 'hint' : ''} ${isCaptureHint ? 'capture-hint' : ''}`}
                  style={{ top: `${coord.t}%`, left: `${coord.l}%` }}
                  onClick={() => handleTap(i)}
                >
                  <div
                    className="node"
                    id={`node-${i}`}
                    style={{ display: board[i] !== 0 ? 'none' : 'block' }}
                  />
                  <div
                    className={`bead ${board[i] === 1 ? 'p1' : ''} ${board[i] === 2 ? 'p2' : ''}`}
                    id={`bead-${i}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PWA INSTALL POPUP BANNER */}
      {showInstallBanner && (
        <div className="pwa-install-popup">
          <div className="pwa-popup-content">
            <div className="pwa-popup-icon">📱</div>
            <div className="pwa-popup-text">
              <div className="pwa-popup-title">Install 16 Bead Game</div>
              <div className="pwa-popup-desc">Add to Home Screen for fast offline play!</div>
            </div>
            <button className="pwa-install-btn" onClick={handleInstallApp}>
              Install
            </button>
            <button className="pwa-close-btn" onClick={() => setShowInstallBanner(false)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ABOUT & RULES MODAL */}
      {showAboutModal && (
        <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>16 Bead Game (Sholo Guti)</h2>
              <button className="modal-close" onClick={() => setShowAboutModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <h3>🎮 About Bead 16 Game</h3>
              <p>
                Bead 16, also known as 16 Guti, is a free online traditional strategy board game from the Raxzen game collection.
              </p>
              <p>
                The game brings the classic strategy of a 16-bead board game into a modern, premium, browser-based experience with a carefully designed board, smooth interactions, visual move guidance, capture mechanics, responsive controls, and a polished tabletop-inspired interface.
              </p>
              <p>
                <strong>The objective is simple:</strong><br />
                Move your beads strategically, capture your opponent's beads, control the board, and be the last player standing.
              </p>

              <hr className="my-3 border-amber-900/40" />

              <h3>♟️ Classic 16-Bead Strategy</h3>
              <p>
                Bead 16 is built around a larger strategic board containing 37 playable positions connected through a structured network of lines.
              </p>
              <p>
                Each side begins with 16 beads, giving both players a large number of pieces to control and creating considerably more strategic possibilities than smaller board games.
              </p>
              <p>The game includes:</p>
              <ul>
                <li>16 beads per side</li>
                <li>37 playable board positions</li>
                <li>Connected movement paths</li>
                <li>Capture jumps</li>
                <li>Bonus moves after captures</li>
                <li>Legal-move detection</li>
                <li>Capture indicators</li>
                <li>Move hints</li>
                <li>Win and loss detection</li>
                <li>Restart functionality</li>
                <li>Live bead-count display</li>
              </ul>
              <p>The board structure and movement system are implemented directly within the game logic.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>🤖 Play Against the Computer</h3>
              <p>You can challenge the built-in Computer opponent and play a complete single-player match.</p>
              <p>The computer automatically evaluates available capture moves first and performs a capture whenever one is available. If no capture is available, it selects from available normal moves.</p>
              <p>This creates an automatic opponent that can continue playing without requiring another person.</p>
              <p>The computer also supports the game's capture-bonus mechanic, allowing it to continue its turn after a successful capture.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>👥 Play With a Friend</h3>
              <p>Two people can play against each other on the same device in Pass & Play mode.</p>
              <p>This makes Bead 16 suitable for:</p>
              <ul>
                <li>Friends</li>
                <li>Family</li>
                <li>Local challenges</li>
                <li>Casual matches</li>
                <li>Traditional board-game sessions</li>
                <li>Quick competitive games</li>
              </ul>
              <p>Instead of playing only against AI, players can enjoy the strategy directly with another person.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>⚔️ Capture &amp; Bonus-Move System</h3>
              <p>Capturing an opponent's bead is one of the most important parts of the gameplay.</p>
              <p>When a legal jump is available, the game visually highlights the capture position.</p>
              <p>After a successful capture, the player receives a bonus move, allowing another strategic action.</p>
              <p>The game therefore rewards players who can recognize opportunities and chain their moves effectively.</p>
              <p>This creates an important strategic choice: <em>Move normally — or capture and continue your attack?</em></p>

              <hr className="my-3 border-amber-900/40" />

              <h3>🧠 Smart Move Guidance</h3>
              <p>You don't have to guess where your selected bead can move. When a bead is selected, the game visually indicates:</p>
              <ul>
                <li>Available normal moves</li>
                <li>Available capture positions</li>
                <li>The selected bead</li>
                <li>Capture opportunities</li>
              </ul>
              <p>Normal legal destinations receive a visual hint, while capture destinations receive a distinct capture indicator.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>🏆 Multiple Ways to Win</h3>
              <p>The game checks the board continuously for winning conditions.</p>
              <p>A player can win by successfully capturing all of the opponent's beads or when an opponent has no legal moves remaining.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>💎 Premium Tabletop Design</h3>
              <p>Bead 16 has been designed around a premium traditional board-game aesthetic combining deep dark surroundings, gold board lines, rich wooden textures, ivory and black metallic beads, elegant typography, and animated move indicators.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>📱 Designed for Mobile &amp; Desktop</h3>
              <p>Suitable for Smartphones, Tablets, Laptops, and Desktop computers with responsive viewport dimensions and touch optimization.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>⚡ Simple Controls, Deep Strategy</h3>
              <p>Select your bead and choose a highlighted legal destination. The game handles underlying movement and capture rules automatically.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>🔄 Replay &amp; New Games</h3>
              <p>Once a match ends, the game provides a Start New Game option so players can immediately begin another round.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>🌍 Built for Players Everywhere</h3>
              <p>Bead 16 is designed as a browser-based experience that can be enjoyed by players around the world without complicated setup.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>🚀 Part of the Raxzen Game Collection</h3>
              <p>Other Raxzen games include:</p>
              <ul>
                <li>
                  ⚔️ <strong>Army Run 3D</strong><br />
                  <a href="https://army-run-3d-game.raxzen.in/" target="_blank" rel="noopener noreferrer">https://army-run-3d-game.raxzen.in/</a>
                </li>
                <li>
                  ❌⭕ <strong>Tic-Tac-Toe</strong><br />
                  <a href="https://tic-tac-toe.raxze.in/" target="_blank" rel="noopener noreferrer">https://tic-tac-toe.raxze.in/</a>
                </li>
                <li>
                  🪙 <strong>Toss Heads or Tails</strong><br />
                  <a href="https://toss-heads-or-tails.raxzen.in/" target="_blank" rel="noopener noreferrer">https://toss-heads-or-tails.raxzen.in/</a>
                </li>
                <li>
                  ♟️ <strong>Bead 3</strong><br />
                  <a href="https://bead-3-game.raxzen.in/" target="_blank" rel="noopener noreferrer">https://bead-3-game.raxzen.in/</a>
                </li>
              </ul>

              <hr className="my-3 border-amber-900/40" />

              <h3>👨💻 Developer &amp; Continuous Development</h3>
              <p>Bead 16 is developed as part of the Raxzen ecosystem with a long-term development mindset focused on continuous improvement across UI/UX, performance, mobile optimization, security, and gameplay features.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>🌟 The Raxzen Vision</h3>
              <p>Raxzen aims to create a growing ecosystem of games, AI products, interactive experiences, creative tools, and useful digital services that are: Free • Modern • Clean • Accessible • Interactive • Useful • Continuously Improving.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>❓ Frequently Asked Questions</h3>
              <p><strong>What is Bead 16?</strong><br />Bead 16, also known as 16 Guti, is a traditional-style strategy board game featuring 16 beads per side and a connected multi-position board.</p>
              <p><strong>Is Bead 16 free?</strong><br />Yes. It is designed as a free browser-based Raxzen game.</p>
              <p><strong>Can I play against the computer?</strong><br />Yes. Includes a built-in Computer opponent.</p>
              <p><strong>Can I play with a friend?</strong><br />Yes. Supports local Vs Friend (Pass &amp; Play) on the same device.</p>
              <p><strong>How many beads does each player have?</strong><br />Each side starts with 16 beads.</p>
              <p><strong>What happens when I capture a bead?</strong><br />A successful capture awards a bonus move, allowing another move before the turn ends.</p>
              <p><strong>Does the game show possible moves?</strong><br />Yes. Visual indicators display available normal moves and capture opportunities.</p>
              <p><strong>How do I win?</strong><br />You win by capturing all opponent beads or leaving the opponent without legal moves.</p>

              <hr className="my-3 border-amber-900/40" />

              <h3>🌐 Developer Links</h3>
              <p>
                <strong>Developer Website:</strong><br />
                <a href="https://rafid-mondal.raxzen.in/" target="_blank" rel="noopener noreferrer">https://rafid-mondal.raxzen.in/</a>
              </p>
              <p>
                <strong>Developer's Other Apps &amp; Services:</strong><br />
                <a href="https://raxzenapp-p9ksao39.manus.space/" target="_blank" rel="noopener noreferrer">https://raxzenapp-p9ksao39.manus.space/</a>
              </p>
              <p>
                <strong>Bead 16 Game:</strong><br />
                <a href="https://bead-16-game.raxzen.in/" target="_blank" rel="noopener noreferrer">https://bead-16-game.raxzen.in/</a>
              </p>

              <hr className="my-3 border-amber-900/40" />

              <h3>📩 Developer &amp; Support</h3>
              <p>
                For support, feedback, technical questions, or development requirements:<br />
                <strong>Email:</strong> <a href="mailto:radidmondal@gmail.com">radidmondal@gmail.com</a>
              </p>

              {/* Policy Button */}
              <div className="policy-btn-container">
                <button className="p-btn" onClick={() => setShowPolicyModal(true)}>
                  📋 All Policies
                </button>
              </div>

              <div className="modal-footer-brand">
                ♟️ Bead 16 — Classic Strategy, Modern Experience<br />
                16 Beads • One Board • Endless Strategic Possibilities<br />
                Powered by Raxzen
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POLICY POPUP MODAL */}
      {showPolicyModal && (
        <div className="modal-overlay" onClick={() => setShowPolicyModal(false)} style={{ zIndex: 200 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '94%',
              height: '82vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '16px'
            }}
          >
            <div className="modal-header" style={{ marginBottom: '10px', paddingBottom: '8px' }}>
              <h2>📋 All Policies</h2>
              <button className="modal-close" onClick={() => setShowPolicyModal(false)}>✕</button>
            </div>
            <div style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden', borderRadius: '8px', background: '#ffffff' }}>
              <iframe
                src="https://docs.google.com/document/d/1SDTn5ON6UasWdOBQvwNtQqN8TfL5dUSj/preview"
                title="Privacy &amp; Terms Policies"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

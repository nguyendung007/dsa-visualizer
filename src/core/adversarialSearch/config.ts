// ─── Adversarial Search Index ──────────────────────────────────────────────────
// Core logic cho các thuật toán tìm kiếm đối kháng

// ─── Constants ──────────────────────────────────────────────────────────────────
export const EMPTY = 0;
export const PLAYER_X = 1; // Người chơi
export const PLAYER_O = 2; // AI

export const WIN_SCORE = 1000000;
export const INFINITY = Number.MAX_SAFE_INTEGER;

// ─── Types ──────────────────────────────────────────────────────────────────────
export type Player = typeof EMPTY | typeof PLAYER_X | typeof PLAYER_O;
export type Board = number[][];
export type Move = { row: number; col: number; player?: Player; };

export interface WinResult {
  winner: Player | null;
  winCells: Move[];
}

export interface MinimaxStep {
  type: string;
  depth: number;
  score?: number;
  isMaximizing?: boolean;
  message?: string;
  move?: Move;
  currentPlayer?: Player;
  nodeId?: string;
  alpha?: number;
  beta?: number;
  bestMove?: Move;
  bestScore?: number;
  nodesExplored?: number;
  prunedBranches?: number;
}

export interface MinimaxResult {
  score: number;
  move?: Move;
  steps: MinimaxStep[];
  nodesExplored: number;
  prunedBranches?: number;
}

export interface AIResult {
  steps: MinimaxStep[];
  move: Move;
  score: number;
  nodesExplored: number;
  prunedBranches: number;
}

export interface ComparisonResult {
  minimax: AIResult;
  alphaBeta: AIResult;
  comparison: {
    nodesSaved: number;
    percentageSaved: string;
    sameMove: boolean;
  };
}

export interface GameStateResponse {
  success: boolean;
  message?: string;
  gameOver?: boolean;
  winner?: Player | null;
  winCells?: Move[];
}

export interface GameStateData {
  board: Board;
  currentPlayer: Player;
  moveHistory: Move[];
  gameOver: boolean;
  winner: Player | null;
  winCells: Move[];
  movesCount: number;
}
// ─── Adversarial Search Index ──────────────────────────────────────────────────
// Core logic cho các thuật toán tìm kiếm đối kháng

import {
  EMPTY,
  PLAYER_X,
  PLAYER_O,
  WIN_SCORE,
  INFINITY,
  type Player,
  type Board,
  type Move,
  type WinResult,
  type MinimaxStep,
  type MinimaxResult,
  type AIResult,
  type ComparisonResult,
  type GameStateResponse,
  type GameStateData
} from './config.js';

// ─── Board Utilities ──────────────────────────────────────────────────────────

/**
 * Tạo bàn cờ mới
 */
export function createBoard(size: number = 9): Board {
  return Array.from({ length: size }, () => Array(size).fill(EMPTY));
}

/**
 * Kiểm tra nước đi hợp lệ
 */
export function isValidMove(board: Board, row: number, col: number): boolean {
  const size = board.length;
  return row >= 0 && row < size && col >= 0 && col < size && board[row][col] === EMPTY;
}

/**
 * Lấy danh sách các nước đi hợp lệ
 */
export function getValidMoves(board: Board): Move[] {
  const size = board.length;
  const moves: Move[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === EMPTY) moves.push({ row: r, col: c });
    }
  }
  return moves;
}

/**
 * Copy bàn cờ
 */
export function copyBoard(board: Board): Board {
  return board.map(row => [...row]);
}

/**
 * Đặt quân cờ
 */
export function makeMove(board: Board, row: number, col: number, player: Player): Board {
  const newBoard = copyBoard(board);
  newBoard[row][col] = player;
  return newBoard;
}

// ─── Win Detection ────────────────────────────────────────────────────────────

/**
 * Kiểm tra thắng trên bàn cờ
 * Trả về { winner: PLAYER_X | PLAYER_O | null, winCells: [...] }
 */
export function checkWin(board: Board, row: number, col: number, player: Player): WinResult {
  if (!player) return { winner: null, winCells: [] };
  
  const size = board.length;
  
  // Nếu row/col không hợp lệ, kiểm tra toàn bộ bàn cờ
  if (row < 0 || row >= size || col < 0 || col >= size) {
    // Kiểm tra tất cả các ô
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === player) {
          const result = checkWin(board, r, c, player);
          if (result.winner) return result;
        }
      }
    }
    return { winner: null, winCells: [] };
  }
  
  const directions = [
    [0, 1],  // Ngang
    [1, 0],  // Dọc
    [1, 1],  // Chéo phải
    [1, -1]  // Chéo trái
  ];

  for (const [dr, dc] of directions) {
    let cells: Move[] = [{ row, col }];
    
    // Check hướng dương
    for (let step = 1; step < 5; step++) {
      const nr = row + dr * step;
      const nc = col + dc * step;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size || board[nr][nc] !== player) break;
      cells.push({ row: nr, col: nc });
    }
    
    // Check hướng âm
    for (let step = 1; step < 5; step++) {
      const nr = row - dr * step;
      const nc = col - dc * step;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size || board[nr][nc] !== player) break;
      cells.push({ row: nr, col: nc });
    }
    
    if (cells.length >= 5) {
      return { winner: player, winCells: cells };
    }
  }
  
  return { winner: null, winCells: [] };
}

/**
 * Kiểm tra bàn cờ đã đầy chưa
 */
export function isBoardFull(board: Board): boolean {
  return getValidMoves(board).length === 0;
}

// ─── Heuristic / Evaluation ──────────────────────────────────────────────────

/**
 * Đếm số lượng quân cờ liên tiếp trong một hướng
 */
function countInDirection(board: Board, row: number, col: number, dr: number, dc: number, player: Player): number {
  const size = board.length;
  let count = 0;
  let r = row + dr;
  let c = col + dc;
  
  while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}

/**
 * Đánh giá một vị trí cụ thể
 */
function evaluatePosition(board: Board, row: number, col: number, player: Player): number {
  const directions = [[0,1], [1,0], [1,1], [1,-1]];
  let score = 0;
  
  for (const [dr, dc] of directions) {
    const count = 1 + countInDirection(board, row, col, dr, dc, player) 
                    + countInDirection(board, row, col, -dr, -dc, player);
    
    // Đánh giá dựa trên số quân liên tiếp
    if (count >= 5) {
      score += WIN_SCORE;
    } else if (count === 4) {
      score += 100000;
    } else if (count === 3) {
      score += 10000;
    } else if (count === 2) {
      score += 1000;
    } else if (count === 1) {
      score += 100;
    }
  }
  
  return score;
}

/**
 * Hàm đánh giá toàn bộ bàn cờ
 * Trả về điểm số từ góc nhìn của PLAYER_X (dương = X có lợi, âm = O có lợi)
 */
export function evaluateBoard(board: Board, player: Player = PLAYER_X): number {
  const size = board.length;
  const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
  let score = 0;
  
  // Đánh giá cho từng quân cờ trên bàn
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === player) {
        score += evaluatePosition(board, r, c, player);
      } else if (board[r][c] === opponent) {
        score -= evaluatePosition(board, r, c, opponent);
      }
    }
  }
  
  return score;
}

// ─── Minimax Algorithm ──────────────────────────────────────────────────────

/**
 * Tạo ID cho node trong cây tìm kiếm
 */
function nodeId(row: number, col: number, depth: number): string {
  return `${row},${col}-d${depth}`;
}

/**
 * Minimax thuần túy (không cắt tỉa)
 */
export function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  player: Player,
  maxDepth: number,
  steps: MinimaxStep[] = []
): MinimaxResult {
  const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
  const currentPlayer = isMaximizing ? player : opponent;
  
  // Kiểm tra thắng (cho toàn bộ board)
  const winResult = checkWin(board, -1, -1, currentPlayer);
  if (winResult.winner) {
    const score = winResult.winner === player ? WIN_SCORE : -WIN_SCORE;
    steps.push({
      type: 'terminal',
      depth,
      score,
      isMaximizing,
      message: `Phát hiện thắng cho ${winResult.winner === PLAYER_X ? 'X' : 'O'}`
    });
    return { score, steps, nodesExplored: 1 };
  }
  
  if (depth === 0) {
    const score = evaluateBoard(board, player);
    steps.push({
      type: 'evaluate',
      depth,
      score,
      isMaximizing,
      nodesExplored: 1,
      message: `Đánh giá ở độ sâu ${depth}: ${score}`
    });
    return { score, steps, nodesExplored: 1 };
  }
  
  const moves = getValidMoves(board);
  if (moves.length === 0) {
    const score = evaluateBoard(board, player);
    steps.push({
      type: 'terminal',
      depth,
      score,
      isMaximizing,
      message: `Không còn nước đi: ${score}`
    });
    return { score, steps, nodesExplored: 1 };
  }
  
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMove = moves[0];
  let totalNodes = 1;
  
  // Giới hạn số nước đi để performance
  const topMoves = moves.slice(0, Math.min(moves.length, 10));
  
  for (const move of topMoves) {
    const newBoard = makeMove(board, move.row, move.col, currentPlayer);
    const id = nodeId(move.row, move.col, depth);
    
    steps.push({
      type: 'explore',
      depth,
      move,
      currentPlayer,
      isMaximizing,
      nodeId: id,
      message: `Đang xét nước đi (${move.row},${move.col}) tại depth ${depth}`
    });
    
    const result = minimax(
      newBoard,
      depth - 1,
      !isMaximizing,
      player,
      maxDepth,
      steps
    );
    
    totalNodes += result.nodesExplored;
    const score = result.score;
    
    steps.push({
      type: 'result',
      depth,
      move,
      score,
      isMaximizing,
      nodeId: id,
      message: `Nước đi (${move.row},${move.col}) có điểm: ${score}`
    });
    
    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }
  
  steps.push({
    type: 'best_move',
    depth,
    bestMove,
    bestScore,
    isMaximizing,
    message: `Chọn nước đi tốt nhất tại depth ${depth}: (${bestMove.row},${bestMove.col}) = ${bestScore}`
  });
  
  return {
    score: bestScore,
    move: bestMove,
    steps,
    nodesExplored: totalNodes
  };
}

// ─── Alpha-Beta Pruning ─────────────────────────────────────────────────────

/**
 * Alpha-Beta Pruning
 */
export function alphaBeta(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  player: Player,
  maxDepth: number,
  steps: MinimaxStep[] = []
): MinimaxResult {
  const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
  const currentPlayer = isMaximizing ? player : opponent;
  
  // Kiểm tra thắng (cho toàn bộ board)
  const winResult = checkWin(board, -1, -1, currentPlayer);
  if (winResult.winner) {
    const score = winResult.winner === player ? WIN_SCORE : -WIN_SCORE;
    steps.push({
      type: 'terminal',
      depth,
      score,
      alpha,
      beta,
      isMaximizing,
      message: `Phát hiện thắng cho ${winResult.winner === PLAYER_X ? 'X' : 'O'}`
    });
    return { score, steps, nodesExplored: 1, prunedBranches: 0 };
  }
  
  if (depth === 0) {
    const score = evaluateBoard(board, player);
    steps.push({
      type: 'evaluate',
      depth,
      score,
      alpha,
      beta,
      isMaximizing,
      message: `Đánh giá leaf: ${score}`
    });
    return { score, steps, nodesExplored: 1, prunedBranches: 0 };
  }
  
  const moves = getValidMoves(board);
  if (moves.length === 0) {
    const score = evaluateBoard(board, player);
    steps.push({
      type: 'terminal',
      depth,
      score,
      message: `Không còn nước đi: ${score}`
    });
    return { score, steps, nodesExplored: 1, prunedBranches: 0 };
  }
  
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMove = moves[0];
  let totalNodes = 1;
  let totalPruned = 0;
  
  // Giới hạn số nước đi để performance
  const topMoves = moves.slice(0, Math.min(moves.length, 10));
  
  for (const move of topMoves) {
    const newBoard = makeMove(board, move.row, move.col, currentPlayer);
    const id = nodeId(move.row, move.col, depth);
    
    steps.push({
      type: 'explore',
      depth,
      move,
      currentPlayer,
      isMaximizing,
      alpha,
      beta,
      nodeId: id,
      message: `Đang xét (${move.row},${move.col}) tại depth ${depth}, α=${alpha}, β=${beta}`
    });
    
    const result = alphaBeta(
      newBoard,
      depth - 1,
      alpha,
      beta,
      !isMaximizing,
      player,
      maxDepth,
      steps
    );
    
    totalNodes += result.nodesExplored;
    totalPruned += result.prunedBranches || 0;
    const score = result.score;
    
    steps.push({
      type: 'result',
      depth,
      move,
      score,
      isMaximizing,
      alpha,
      beta,
      nodeId: id,
      message: `( ${move.row},${move.col}) = ${score}, α=${alpha}, β=${beta}`
    });
    
    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
    }
    
    // Cắt tỉa
    if (alpha >= beta) {
      steps.push({
        type: 'prune',
        depth,
        move,
        alpha,
        beta,
        nodeId: id,
        message: `✂️ Cắt tỉa tại (${move.row},${move.col})! α=${alpha} >= β=${beta}`
      });
      totalPruned++;
      break;
    }
  }
  
  steps.push({
    type: 'best_move',
    depth,
    bestMove,
    bestScore,
    isMaximizing,
    alpha,
    beta,
    message: `Chọn (${bestMove.row},${bestMove.col}) = ${bestScore}`
  });
  
  return {
    score: bestScore,
    move: bestMove,
    steps,
    nodesExplored: totalNodes,
    prunedBranches: totalPruned
  };
}

// ─── AI Engine ──────────────────────────────────────────────────────────────

/**
 * Tạo steps cho animation từ Minimax hoặc Alpha-Beta
 */


export function generateAISteps(
  board: Board,
  algorithm: string = 'alphaBeta',
  depth: number = 3,
  player: Player = PLAYER_O
): AIResult {
  const isMaximizing = true;
  const steps: MinimaxStep[] = [];
  
  let result: MinimaxResult;
  if (algorithm === 'minimax') {
    result = minimax(board, depth, isMaximizing, player, depth, steps);
  } else {
    // Alpha-Beta
    result = alphaBeta(board, depth, -Infinity, Infinity, isMaximizing, player, depth, steps);
  }
  
  // Đảm bảo result.move tồn tại
  if (!result.move) {
    throw new Error('Không tìm thấy nước đi hợp lệ');
  }
  
  // Thêm step kết luận
  steps.push({
    type: 'ai_decision',
    depth: depth,
    move: result.move,
    score: result.score,
    nodesExplored: result.nodesExplored,
    prunedBranches: result.prunedBranches ?? 0,
    message: `🎯 AI chọn (${result.move.row},${result.move.col}) với điểm ${result.score}`
  });
  
  return {
    steps,
    move: result.move,
    score: result.score,
    nodesExplored: result.nodesExplored,
    prunedBranches: result.prunedBranches ?? 0
  };
}

/**
 * Tạo steps cho AI vs AI (so sánh)
 */
export function compareAlgorithms(board: Board, depth: number = 3, player: Player = PLAYER_X): ComparisonResult {
  const isMaximizing = player === PLAYER_X;
  
  // Chạy Minimax
  const miniSteps: MinimaxStep[] = [];
  const miniResult = minimax(board, depth, isMaximizing, player, depth, miniSteps);
  
  // Chạy Alpha-Beta
  const abSteps: MinimaxStep[] = [];
  const abResult = alphaBeta(board, depth, -Infinity, Infinity, isMaximizing, player, depth, abSteps);
  
  return {
    minimax: {
      steps: miniSteps,
      move: miniResult.move!,
      score: miniResult.score,
      nodesExplored: miniResult.nodesExplored,
      prunedBranches: 0
    },
    alphaBeta: {
      steps: abSteps,
      move: abResult.move!,
      score: abResult.score,
      nodesExplored: abResult.nodesExplored,
      prunedBranches: abResult.prunedBranches || 0
    },
    // Dữ liệu so sánh
    comparison: {
      nodesSaved: miniResult.nodesExplored - (abResult.nodesExplored || 0),
      percentageSaved: ((miniResult.nodesExplored - (abResult.nodesExplored || 0)) / miniResult.nodesExplored * 100).toFixed(2),
      sameMove: miniResult.move!.row === abResult.move!.row && miniResult.move!.col === abResult.move!.col
    }
  };
}

// ─── Game State Management ──────────────────────────────────────────────────

/**
 * Quản lý trạng thái game
 */


export class GameState {
  size: number;
  board: Board;
  currentPlayer: Player;
  moveHistory: Move[];
  gameOver: boolean;
  winner: Player | null;
  winCells: Move[];

  constructor(size: number = 9) {
    this.size = size;
    this.board = createBoard(size);
    this.currentPlayer = PLAYER_X;
    this.moveHistory = [];
    this.gameOver = false;
    this.winner = null;
    this.winCells = [];
  }
  
  /**
   * Thực hiện nước đi
   */
  makeMove(row: number, col: number): GameStateResponse {
    if (this.gameOver) return { success: false, message: 'Game đã kết thúc' };
    if (!isValidMove(this.board, row, col)) {
      return { success: false, message: 'Nước đi không hợp lệ' };
    }
    
    this.board = makeMove(this.board, row, col, this.currentPlayer);
    this.moveHistory.push({ row, col, player: this.currentPlayer });
    
    // Kiểm tra thắng
    const result = checkWin(this.board, row, col, this.currentPlayer);
    if (result.winner) {
      this.gameOver = true;
      this.winner = result.winner;
      this.winCells = result.winCells;
      return { 
        success: true, 
        gameOver: true, 
        winner: result.winner,
        winCells: result.winCells,
        message: `🏆 ${result.winner === PLAYER_X ? 'X' : 'O'} thắng!`
      };
    }
    
    // Kiểm tra hòa
    if (isBoardFull(this.board)) {
      this.gameOver = true;
      this.winner = null;
      return { success: true, gameOver: true, winner: null, message: '🤝 Hòa!' };
    }
    
    // Đổi người chơi
    this.currentPlayer = this.currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
    return { success: true, gameOver: false };
  }
  
  /**
   * Reset game
   */
  reset(): void {
    this.board = createBoard(this.size);
    this.currentPlayer = PLAYER_X;
    this.moveHistory = [];
    this.gameOver = false;
    this.winner = null;
    this.winCells = [];
  }
  
  /**
   * Lấy trạng thái hiện tại
   */
  getState(): GameStateData {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      moveHistory: this.moveHistory,
      gameOver: this.gameOver,
      winner: this.winner,
      winCells: this.winCells,
      movesCount: this.moveHistory.length
    };
  }
  
  /**
   * Copy state từ GameState khác
   */
  static copyFrom(gameState: GameState): GameState {
    const newGame = new GameState(gameState.size);
    newGame.board = gameState.board.map(row => [...row]);
    newGame.currentPlayer = gameState.currentPlayer;
    newGame.moveHistory = [...gameState.moveHistory];
    newGame.gameOver = gameState.gameOver;
    newGame.winner = gameState.winner;
    newGame.winCells = [...gameState.winCells];
    return newGame;
  }
}

// Export lại tất cả từ config để tương thích
export {
  EMPTY,
  PLAYER_X,
  PLAYER_O,
  WIN_SCORE,
  INFINITY
};
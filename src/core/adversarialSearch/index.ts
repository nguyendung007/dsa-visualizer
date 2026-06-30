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

// ============================
// UTILITY FUNCTIONS
// ============================

export function createBoard(size: number = 9): Board {
  return Array.from({ length: size }, () => Array(size).fill(EMPTY));
}

export function isValidMove(board: Board, row: number, col: number): boolean {
  const size = board.length;
  return row >= 0 && row < size && col >= 0 && col < size && board[row][col] === EMPTY;
}

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

export function copyBoard(board: Board): Board {
  return board.map(row => [...row]);
}

export function makeMove(board: Board, row: number, col: number, player: Player): Board {
  const newBoard = copyBoard(board);
  newBoard[row][col] = player;
  return newBoard;
}

// ============================
// WIN DETECTION
// ============================

export function checkWin(board: Board, row: number, col: number, player: Player): WinResult {
  if (!player) return { winner: null, winCells: [] };
  
  const size = board.length;

  if (row < 0 || row >= size || col < 0 || col >= size) {
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
    [0, 1],
    [1, 0],  
    [1, 1],  
    [1, -1]  
  ];

  for (const [dr, dc] of directions) {
    let cells: Move[] = [{ row, col }];
    
    for (let step = 1; step < 5; step++) {
      const nr = row + dr * step;
      const nc = col + dc * step;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size || board[nr][nc] !== player) break;
      cells.push({ row: nr, col: nc });
    }
    
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

export function isBoardFull(board: Board): boolean {
  return getValidMoves(board).length === 0;
}

// ============================
// ENHANCED EVALUATION FUNCTION (from bot3.cpp)
// ============================

/**
 * Đếm số chuỗi liên tiếp của player theo hướng (dr, dc)
 * Tương tự countStreaks trong bot3.cpp
 */
function countStreaks(board: Board, size: number, player: Player, dr: number, dc: number): number {
  let count = 0;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Bỏ qua nếu ô trước đó đã cùng hướng (tránh đếm trùng)
      const pr = r - dr, pc = c - dc;
      if (pr >= 0 && pr < size && pc >= 0 && pc < size && board[pr][pc] === player) continue;
      
      let streak = 0;
      let nr = r, nc = c;
      while (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) {
        streak++;
        nr += dr;
        nc += dc;
      }
      
      // Chỉ đếm chuỗi có độ dài từ 2 trở lên để tránh nhiễu
      if (streak >= 2) {
        count += streak * streak; // Bình phương để ưu tiên chuỗi dài hơn
      }
    }
  }
  return count;
}

/**
 * Đánh giá bàn cờ dựa trên số chuỗi (streak-based evaluation)
 * Tương tự evaluate trong bot3.cpp nhưng cải tiến hơn
 */
export function evaluateBoard(board: Board, player: Player = PLAYER_X): number {
  const size = board.length;
  const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
  let score = 0;
  
  // Các hướng: ngang, dọc, chéo chính, chéo phụ
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  
  for (const [dr, dc] of directions) {
    // Điểm cho player (càng nhiều chuỗi càng tốt)
    score += 100 * countStreaks(board, size, player, dr, dc);
    // Trừ điểm cho opponent
    score -= 100 * countStreaks(board, size, opponent, dr, dc);
  }
  
  return score;
}

// ============================
// CANDIDATE FILTERING (from bot3.cpp)
// ============================

/**
 * Lọc các ô trống gần quân cờ hiện có
 * Tương tự getCandidates trong bot3.cpp
 */
export function getCandidates(board: Board): Move[] {
  const size = board.length;
  const radius = size <= 8 ? 1 : 2;
  const center = Math.floor(size / 2);
  const seen = new Set<string>();
  const candidates: Move[] = [];
  
  // Tìm các ô trống gần quân cờ
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === EMPTY) continue;
      
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
          if (board[nr][nc] !== EMPTY) continue;
          
          const key = `${nr},${nc}`;
          if (seen.has(key)) continue;
          seen.add(key);
          candidates.push({ row: nr, col: nc });
        }
      }
    }
  }
  
  // Nếu không có candidate (bàn cờ trống), chọn trung tâm
  if (candidates.length === 0) {
    candidates.push({ row: center, col: center });
    return candidates;
  }
  
  // Sắp xếp theo khoảng cách đến trung tâm (ưu tiên gần tâm)
  // Tương tự center_pick trong bot2.cpp và bot3.cpp
  candidates.sort((a, b) => {
    const da = Math.max(Math.abs(a.row - center), Math.abs(a.col - center));
    const db = Math.max(Math.abs(b.row - center), Math.abs(b.col - center));
    return da - db;
  });
  
  return candidates;
}

/**
 * Lấy top N nước đi tốt nhất dựa trên đánh giá sơ bộ
 */
function getTopMoves(board: Board, candidates: Move[], maxMoves: number = 10): Move[] {
  if (candidates.length <= maxMoves) return candidates;
  
  const scored = candidates.map(move => {
    // Đánh giá sơ bộ: mô phỏng đặt quân và tính điểm
    const tempBoard = copyBoard(board);
    tempBoard[move.row][move.col] = PLAYER_O; // Giả sử đang là AI
    const score = evaluateBoard(tempBoard, PLAYER_O);
    return { ...move, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxMoves).map(({ row, col }) => ({ row, col }));
}

// ============================
// DYNAMIC DEPTH (from bot3.cpp)
// ============================

/**
 * Tính độ sâu động dựa trên kích thước bàn cờ
 * Tương tự hard_level trong bot3.cpp
 */
export function getDynamicDepth(size: number): number {
  if (size <= 5) return 8;
  if (size <= 8) return 5;
  return 3;
}

/**
 * Tính số lượng top moves dựa trên kích thước bàn cờ
 */
function getTopMovesCount(size: number): number {
  if (size <= 5) return 8;
  if (size <= 8) return 10;
  return 12;
}

// ============================
// WIN/LOSS/DRAW DETECTION FOR AI
// ============================

function checkTerminal(board: Board, player: Player, opponent: Player): { terminal: boolean; score: number } {
  // Kiểm tra win cho player
  const winResult = checkWin(board, -1, -1, player);
  if (winResult.winner === player) {
    return { terminal: true, score: WIN_SCORE };
  }
  
  // Kiểm tra win cho opponent
  const oppWinResult = checkWin(board, -1, -1, opponent);
  if (oppWinResult.winner === opponent) {
    return { terminal: true, score: -WIN_SCORE };
  }
  
  // Kiểm tra hòa
  if (isBoardFull(board)) {
    return { terminal: true, score: 0 };
  }
  
  return { terminal: false, score: 0 };
}

// ============================
// MINIMAX WITH CANDIDATE FILTERING & TOP MOVES
// ============================

export function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  player: Player,
  maxDepth: number,
  steps: MinimaxStep[] = [],
  candidates?: Move[]
): MinimaxResult {
  const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
  const currentPlayer = isMaximizing ? player : opponent;
  
  // Kiểm tra terminal (win/loss/draw)
  const terminal = checkTerminal(board, player, opponent);
  if (terminal.terminal) {
    steps.push({
      type: 'terminal',
      depth,
      score: terminal.score,
      isMaximizing,
      message: terminal.score === WIN_SCORE ? `🏆 ${player === PLAYER_X ? 'X' : 'O'} thắng!` :
               terminal.score === -WIN_SCORE ? `😔 ${opponent === PLAYER_X ? 'X' : 'O'} thắng!` :
               '🤝 Hòa!'
    });
    return { score: terminal.score, steps, nodesExplored: 1 };
  }
  
  // Kiểm tra depth
  if (depth === 0) {
    const score = evaluateBoard(board, player);
    steps.push({
      type: 'evaluate',
      depth,
      score,
      isMaximizing,
      nodesExplored: 1,
      message: `📊 Đánh giá leaf: ${score}`
    });
    return { score, steps, nodesExplored: 1 };
  }
  
  // Lấy candidates nếu chưa có
  if (!candidates) {
    candidates = getCandidates(board);
    steps.push({
      type: 'candidates',
      depth,
      message: `📋 Tìm thấy ${candidates.length} ứng viên`,
    });
  }
  
  // Giới hạn số nước đi xét (topN)
  const topN = getTopMovesCount(board.length);
  const topMoves = getTopMoves(board, candidates, topN);
  
  if (topMoves.length === 0) {
    const score = evaluateBoard(board, player);
    steps.push({
      type: 'terminal',
      depth,
      score,
      isMaximizing,
      message: `Không còn nước đi hợp lệ: ${score}`
    });
    return { score, steps, nodesExplored: 1 };
  }
  
  steps.push({
    type: 'top_moves',
    depth,
    message: `🎯 Xét ${topMoves.length} nước đi tốt nhất (trên ${candidates.length} ứng viên)`,
  });
  
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMove = topMoves[0];
  let totalNodes = 1;
  
  for (const move of topMoves) {
    const newBoard = makeMove(board, move.row, move.col, currentPlayer);
    
    steps.push({
      type: 'explore',
      depth,
      move,
      currentPlayer,
      isMaximizing,
      message: `🔍 Đang xét (${move.row},${move.col}) tại depth ${depth}`
    });
    
    // Đệ quy gọi minimax với depth giảm
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
      message: `↩️ Nước đi (${move.row},${move.col}) có điểm: ${score}`
    });
    
    // Cập nhật best
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
    message: `⭐ Chọn (${bestMove.row},${bestMove.col}) = ${bestScore}`
  });
  
  return {
    score: bestScore,
    move: bestMove,
    steps,
    nodesExplored: totalNodes
  };
}

// ============================
// ALPHA-BETA WITH CANDIDATE FILTERING & TOP MOVES
// ============================

export function alphaBeta(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  player: Player,
  maxDepth: number,
  steps: MinimaxStep[] = [],
  candidates?: Move[]
): MinimaxResult {
  const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
  const currentPlayer = isMaximizing ? player : opponent;
  
  // Kiểm tra terminal (win/loss/draw)
  const terminal = checkTerminal(board, player, opponent);
  if (terminal.terminal) {
    steps.push({
      type: 'terminal',
      depth,
      score: terminal.score,
      alpha,
      beta,
      isMaximizing,
      message: terminal.score === WIN_SCORE ? `🏆 ${player === PLAYER_X ? 'X' : 'O'} thắng!` :
               terminal.score === -WIN_SCORE ? `😔 ${opponent === PLAYER_X ? 'X' : 'O'} thắng!` :
               '🤝 Hòa!'
    });
    return { score: terminal.score, steps, nodesExplored: 1, prunedBranches: 0 };
  }
  
  // Kiểm tra depth
  if (depth === 0) {
    const score = evaluateBoard(board, player);
    steps.push({
      type: 'evaluate',
      depth,
      score,
      alpha,
      beta,
      isMaximizing,
      message: `📊 Đánh giá leaf: ${score}`
    });
    return { score, steps, nodesExplored: 1, prunedBranches: 0 };
  }
  
  // Lấy candidates nếu chưa có
  if (!candidates) {
    candidates = getCandidates(board);
    steps.push({
      type: 'candidates',
      depth,
      message: `📋 Tìm thấy ${candidates.length} ứng viên`,
    });
  }
  
  // Giới hạn số nước đi xét (topN)
  const topN = getTopMovesCount(board.length);
  const topMoves = getTopMoves(board, candidates, topN);
  
  if (topMoves.length === 0) {
    const score = evaluateBoard(board, player);
    steps.push({
      type: 'terminal',
      depth,
      score,
      message: `Không còn nước đi hợp lệ: ${score}`
    });
    return { score, steps, nodesExplored: 1, prunedBranches: 0 };
  }
  
  steps.push({
    type: 'top_moves',
    depth,
    message: `🎯 Xét ${topMoves.length} nước đi tốt nhất (trên ${candidates.length} ứng viên)`,
  });
  
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMove = topMoves[0];
  let totalNodes = 1;
  let totalPruned = 0;
  
  for (const move of topMoves) {
    const newBoard = makeMove(board, move.row, move.col, currentPlayer);
    
    steps.push({
      type: 'explore',
      depth,
      move,
      currentPlayer,
      isMaximizing,
      alpha,
      beta,
      message: `🔍 Đang xét (${move.row},${move.col}) tại depth ${depth}, α=${alpha}, β=${beta}`
    });
    
    // Đệ quy gọi alphaBeta với depth giảm
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
      message: `↩️ Nước đi (${move.row},${move.col}) có điểm: ${score}, α=${alpha}, β=${beta}`
    });
    
    // Cập nhật best và alpha/beta
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
    
    // Alpha-Beta Pruning
    if (alpha >= beta) {
      steps.push({
        type: 'prune',
        depth,
        move,
        alpha,
        beta,
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
    message: `⭐ Chọn (${bestMove.row},${bestMove.col}) = ${bestScore}`
  });
  
  return {
    score: bestScore,
    move: bestMove,
    steps,
    nodesExplored: totalNodes,
    prunedBranches: totalPruned
  };
}

// ============================
// QUICK WIN/BLOCK CHECKS (from bot2.cpp)
// ============================

/**
 * Kiểm tra nước đi thắng ngay cho player
 * Tương tự simple_heuristic trong bot2.cpp
 */
function findWinningMove(board: Board, player: Player): Move | null {
  const size = board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === EMPTY) {
        const tempBoard = makeMove(board, r, c, player);
        const winResult = checkWin(tempBoard, r, c, player);
        if (winResult.winner === player) {
          return { row: r, col: c };
        }
      }
    }
  }
  return null;
}

/**
 * Tìm nước đi để chặn đối thủ thắng
 * Tương tự simple_heuristic trong bot2.cpp
 */
function findBlockingMove(board: Board, player: Player): Move | null {
  const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
  return findWinningMove(board, opponent);
}

/**
 * Chọn ô gần trung tâm nhất
 * Tương tự center_pick trong bot2.cpp
 */
function findCenterMove(board: Board): Move | null {
  const size = board.length;
  const center = Math.floor(size / 2);
  let bestMove: Move | null = null;
  let bestDist = Infinity;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === EMPTY) {
        const dist = Math.max(Math.abs(r - center), Math.abs(c - center));
        if (dist < bestDist) {
          bestDist = dist;
          bestMove = { row: r, col: c };
        }
      }
    }
  }
  return bestMove;
}

// ============================
// MAIN AI FUNCTION
// ============================

export function generateAISteps(
  board: Board,
  algorithm: string = 'alphaBeta',
  depth: number = -1, // -1 = auto
  player: Player = PLAYER_O
): AIResult {
  const size = board.length;
  const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
  
  // Auto depth nếu không được chỉ định
  if (depth === -1) {
    depth = getDynamicDepth(size);
  }
  
  const steps: MinimaxStep[] = [];
  
  // BƯỚC 1: Kiểm tra nước đi thắng ngay (từ bot2.cpp)
  const winningMove = findWinningMove(board, player);
  if (winningMove) {
    steps.push({
      type: 'ai_decision',
      depth: 0,
      move: winningMove,
      score: WIN_SCORE,
      message: `🎯 AI tìm thấy nước đi thắng ngay tại (${winningMove.row},${winningMove.col})`
    });
    return {
      steps,
      move: winningMove,
      score: WIN_SCORE,
      nodesExplored: 1,
      prunedBranches: 0
    };
  }
  
  // BƯỚC 2: Kiểm tra chặn nước đi thắng của đối thủ (từ bot2.cpp)
  const blockingMove = findBlockingMove(board, player);
  if (blockingMove) {
    steps.push({
      type: 'ai_decision',
      depth: 0,
      move: blockingMove,
      score: 0,
      message: `🛡️ AI chặn nước đi thắng của đối thủ tại (${blockingMove.row},${blockingMove.col})`
    });
    return {
      steps,
      move: blockingMove,
      score: 0,
      nodesExplored: 1,
      prunedBranches: 0
    };
  }
  
  // BƯỚC 3: Lấy candidates (từ bot3.cpp)
  let candidates = getCandidates(board);
  
  // Nếu không có candidates, chọn trung tâm (từ bot2.cpp)
  if (candidates.length === 0) {
    const centerMove = findCenterMove(board);
    if (centerMove) {
      steps.push({
        type: 'ai_decision',
        depth: 0,
        move: centerMove,
        score: 0,
        message: `🎯 AI chọn trung tâm tại (${centerMove.row},${centerMove.col})`
      });
      return {
        steps,
        move: centerMove,
        score: 0,
        nodesExplored: 1,
        prunedBranches: 0
      };
    }
    throw new Error('Không tìm thấy nước đi hợp lệ');
  }
  
  // BƯỚC 4: Chạy minimax/alpha-beta trên candidates
  steps.push({
    type: 'candidates',
    depth,
    message: `📋 Tìm thấy ${candidates.length} ứng viên, depth=${depth}`
  });
  
  let result: MinimaxResult;
  if (algorithm === 'minimax') {
    result = minimax(board, depth, true, player, depth, steps, candidates);
  } else {
    result = alphaBeta(board, depth, -Infinity, Infinity, true, player, depth, steps, candidates);
  }
  
  if (!result.move) {
    throw new Error('Không tìm thấy nước đi hợp lệ');
  }
  
  steps.push({
    type: 'ai_decision',
    depth: depth,
    move: result.move,
    score: result.score,
    nodesExplored: result.nodesExplored,
    prunedBranches: result.prunedBranches ?? 0,
    message: `🎯 AI chọn (${result.move.row},${result.move.col}) với điểm ${result.score} (Nodes: ${result.nodesExplored})`
  });
  
  return {
    steps,
    move: result.move,
    score: result.score,
    nodesExplored: result.nodesExplored,
    prunedBranches: result.prunedBranches ?? 0
  };
}

// ============================
// COMPARE ALGORITHMS
// ============================

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
    comparison: {
      nodesSaved: miniResult.nodesExplored - (abResult.nodesExplored || 0),
      percentageSaved: ((miniResult.nodesExplored - (abResult.nodesExplored || 0)) / miniResult.nodesExplored * 100).toFixed(2),
      sameMove: miniResult.move!.row === abResult.move!.row && miniResult.move!.col === abResult.move!.col
    }
  };
}



// ============================
// GAME STATE CLASS
// ============================

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
    
    if (isBoardFull(this.board)) {
      this.gameOver = true;
      this.winner = null;
      return { success: true, gameOver: true, winner: null, message: '🤝 Hòa!' };
    }
    
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

// ============================
// EXPORTS
// ============================

export {
  EMPTY,
  PLAYER_X,
  PLAYER_O,
  WIN_SCORE,
  INFINITY
};
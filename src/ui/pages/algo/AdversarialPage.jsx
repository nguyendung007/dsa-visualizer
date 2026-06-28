import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GameState,
  generateAISteps,
  compareAlgorithms,
  PLAYER_X,
  PLAYER_O,
  EMPTY,
} from '../../../core/adversarialSearch/index.ts';
import Controls from '../../components/Controls.jsx';
import './AdversarialPage.css';

const BOARD_SIZE = 9;

const ALGOS = {
  minimax:   { name: 'Minimax',    icon: '🎯', color: '#58a6ff' },
  alphaBeta: { name: 'Alpha-Beta', icon: '⚡', color: '#10b981' },
  compare:   { name: 'So sánh',   icon: '📊', color: '#f59e0b' },
};

function cellKey(r, c) { return `${r},${c}`; }

export default function AdversarialPage() {
  const [algo, setAlgo]               = useState('alphaBeta');
  const [depth, setDepth]             = useState(3);
  const [gameState, setGameState]     = useState(() => new GameState(BOARD_SIZE));
  const [isThinking, setIsThinking]   = useState(false);
  const [treeSteps, setTreeSteps]     = useState([]);
  const [stepIdx, setStepIdx]         = useState(0);
  const [playing, setPlaying]         = useState(false);
  const [speed, setSpeed]             = useState(300);
  const [metrics, setMetrics]         = useState({ nodes: 0, pruned: 0, time: 0, score: 0 });
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameOver, setGameOver]       = useState(null);
  const [winCells, setWinCells]       = useState([]);
  const [lastMove, setLastMove]       = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [aiFinalMove, setAiFinalMove] = useState(null);

  const animRef = useRef(null);
  const gameRef = useRef(gameState);
  const logEndRef = useRef(null); // Ref để tự động cuộn log khi cây chạy

  const handleReset = useCallback(() => {
    clearInterval(animRef.current);
    animRef.current = null;
    const ng = new GameState(BOARD_SIZE);
    gameRef.current = ng;
    setGameState(ng);
    setMoveHistory([]);
    setGameOver(null);
    setWinCells([]);
    setLastMove(null);
    setTreeSteps([]);
    setStepIdx(0);
    setMetrics({ nodes: 0, pruned: 0, time: 0, score: 0 });
    setPlaying(false);
    setCompareResult(null);
    setIsThinking(false);
    setAiFinalMove(null);
  }, []);

  const triggerAI = useCallback((gs, hist) => {
    const currentGs = gs || gameRef.current;
    if (currentGs.currentPlayer !== PLAYER_O || currentGs.gameOver) return;

    setIsThinking(true);
    const t0 = performance.now();

    const result = generateAISteps(
      currentGs.board,
      algo === 'compare' ? 'alphaBeta' : algo,
      depth,
      PLAYER_O
    );

    const timeSpent = Math.round(performance.now() - t0);

    setTreeSteps(result.steps);
    setStepIdx(0);
    setAiFinalMove(result.move);
    setMetrics({
      nodes:  result.nodesExplored || 0,
      pruned: result.prunedBranches || 0,
      time:   timeSpent,
      score:  result.score || 0,
    });
    setIsThinking(false);
    setPlaying(true);
  }, [algo, depth]);

  useEffect(() => {
    if (playing) {
      clearInterval(animRef.current);
      animRef.current = setInterval(() => {
        setStepIdx((prev) => {
          if (prev >= treeSteps.length) {
            setPlaying(false);
            clearInterval(animRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      clearInterval(animRef.current);
    }
    return () => clearInterval(animRef.current);
  }, [playing, treeSteps, speed]);

  // Tự động cuộn xuống dưới cùng khi sinh log mới để người dùng dễ theo dõi
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stepIdx]);

  useEffect(() => {
    if (stepIdx > 0 && stepIdx === treeSteps.length && aiFinalMove) {
      const currentGs = gameRef.current;
      const mr = currentGs.makeMove(aiFinalMove.row, aiFinalMove.col);
      const next = GameState.copyFrom(currentGs);
      gameRef.current = next;
      setGameState(next);
      setMoveHistory([...moveHistory, { row: aiFinalMove.row, col: aiFinalMove.col, player: PLAYER_O }]);
      setLastMove({ row: aiFinalMove.row, col: aiFinalMove.col });
      if (mr.gameOver) {
        setGameOver(mr.winner ? 'lose' : 'draw');
        setWinCells(mr.winCells || []);
      }
      setAiFinalMove(null);
    }
  }, [stepIdx, treeSteps, aiFinalMove, moveHistory]);

  const handleCellClick = useCallback((r, c) => {
    if (isThinking || gameOver || treeSteps.length > stepIdx) return;
    if (gameState.currentPlayer !== PLAYER_X) return;
    if (gameState.board[r][c] !== EMPTY) return;

    const mr = gameState.makeMove(r, c);
    if (!mr.success) return;

    const next = GameState.copyFrom(gameState);
    gameRef.current = next;
    setGameState(next);
    const newHist = [...moveHistory, { row: r, col: c, player: PLAYER_X }];
    setMoveHistory(newHist);
    setLastMove({ row: r, col: c });

    if (mr.gameOver) {
      setGameOver(mr.winner ? 'win' : 'draw');
      setWinCells(mr.winCells || []);
      return;
    }

    triggerAI(next, newHist);
  }, [gameState, isThinking, gameOver, moveHistory, triggerAI, stepIdx, treeSteps.length]);

  const handlePlay  = () => { if (treeSteps.length > 0 && stepIdx < treeSteps.length) setPlaying(true); };
  const handlePause = () => setPlaying(false);
  const handleStepFwd  = () => setStepIdx(i => Math.min(i + 1, treeSteps.length));
  const handleStepBack = () => setStepIdx(i => Math.max(i - 1, 0));
  const handleResetSteps = () => { setStepIdx(0); setPlaying(false); };

  const statusText = () => {
    if (gameOver === 'win')  return '🎉 Bạn thắng!';
    if (gameOver === 'lose') return '😔 AI thắng!';
    if (gameOver === 'draw') return '🤝 Hòa!';
    if (isThinking)          return '🤔 AI đang dựng cây...';
    if (treeSteps.length > 0 && stepIdx < treeSteps.length) return `⚡ Đang duyệt cây (Bước ${stepIdx}/${treeSteps.length})`;
    if (gameState.currentPlayer === PLAYER_X) return '👤 Lượt của bạn (X)';
    return '🤖 Lượt của AI (O)';
  };

  const curStep = treeSteps[stepIdx - 1] || null;

  const renderBoard = () =>
    gameState.board.flatMap((row, r) =>
      row.map((cell, c) => {
        const isWin  = winCells.some(w => w.row === r && w.col === c);
        const isLast = lastMove?.row === r && lastMove?.col === c;
        
        let cellAlgoClass = '';
        let miniEvalScore = null;

        if (curStep) {
          if (curStep.move && curStep.move.row === r && curStep.move.col === c) {
            if (curStep.type === 'explore') cellAlgoClass = ' adv-cell-explore';
            if (curStep.type === 'result') cellAlgoClass = ' adv-cell-result';
            if (curStep.type === 'prune') cellAlgoClass = ' adv-cell-pruned';
          }
          if (curStep.type === 'evaluate' && curStep.move && curStep.move.row === r && curStep.move.col === c) {
            cellAlgoClass = ' adv-cell-evaluate';
            miniEvalScore = curStep.score;
          }
        }

        return (
          <div
            key={cellKey(r, c)}
            className={`adv-cell${cell !== EMPTY ? ' occupied' : ''}${isWin ? ' win-cell' : ''}${isLast ? ' last-move' : ''}${cellAlgoClass}`}
            onClick={() => handleCellClick(r, c)}
          >
            {cell === PLAYER_X && <span className="piece piece-x">X</span>}
            {cell === PLAYER_O && <span className="piece piece-o">O</span>}
            
            {miniEvalScore !== null && (
              <span className="adv-mini-score">
                {miniEvalScore > 50000 ? '∞' : miniEvalScore < -50000 ? '-∞' : miniEvalScore}
              </span>
            )}
          </div>
        );
      })
    );

  const renderTreeLog = () => {
    if (treeSteps.length === 0) return (
      <div className="adv-tree-empty-large">
        🌲 CÂY TÌM KIẾM ĐỆ QUY (LIVE TRACE)
        <span>Hãy thực hiện một nước đi để AI phân tích cấu trúc cây tại đây thông qua đồ thị văn bản lớn.</span>
      </div>
    );
    const visible = treeSteps.slice(0, stepIdx);
    return (
      <div className="adv-log-large">
        {visible.map((step, i) => {
          const indentLevel = Math.max(0, depth - (step.depth || 0));
          return (
            <div
              key={i}
              className={`adv-log-row-large adv-log-${step.type}${i === visible.length - 1 ? ' current' : ''}`}
              style={{ paddingLeft: `${indentLevel * 24}px` }} // Tăng khoảng cách thụt lề nhìn cho rõ
            >
              <span className="adv-log-icon-large">
                {step.type === 'explore' && '🔍 [Duyệt]'}
                {step.type === 'evaluate' && '📊 [Heuristic]'}
                {step.type === 'prune' && '✂️ [Cắt tỉa]'}
                {step.type === 'result' && '↩️ [Trả điểm]'}
                {step.type === 'best_move' && '⭐ [Tối ưu]'}
                {step.type === 'terminal' && '🏁 [Kết thúc]'}
                {step.type === 'ai_decision' && '🎯 [Chốt]'}
              </span>
              <span className="adv-log-text-large">{step.message}</span>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Adversarial Search Visualizer</h1>
        <p>Mô phỏng cơ chế tính toán cây quyết định đối kháng đệ quy</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button
            key={k}
            className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => { setAlgo(k); handleReset(); }}
          >
            {v.icon} {v.name}
          </button>
        ))}

        <div className="adv-depth-inline">
          <span>Độ sâu cây (Depth)</span>
          <input
            type="range" min="1" max="4" value={depth}
            onChange={e => { setDepth(+e.target.value); handleReset(); }}
          />
          <span className="adv-depth-val">{depth}</span>
        </div>
      </div>

      {/* Tái cấu trúc Layout chính */}
      <div className="graph-workspace adv-split-workspace">
        
        {/* KHỐI TRÁI LỚN: CHỨA BÀN CỜ VÀ LIVE TRACE ĐỨNG CẠNH NHAU */}
        <div className="graph-main adv-double-columns-panel">
          
          {/* Cột 1: Bàn cờ */}
          <div className="adv-column-board">
            <div className="step-desc">
              <span className="step-badge">{stepIdx}/{treeSteps.length}</span>
              <span className="step-text">{statusText()}</span>
            </div>

            <div className="adv-board-wrap-left">
              <div className="adv-board-grid" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}>
                {renderBoard()}
              </div>

              {isThinking && (
                <div className="adv-overlay">
                  <div className="adv-spinner" />
                  <div className="adv-overlay-text">AI đang dựng cây đệ quy...</div>
                </div>
              )}

              {gameOver && (
                <div className="adv-overlay adv-overlay-gameover">
                  <div className={`adv-result adv-result-${gameOver}`}>{statusText()}</div>
                  <div className="adv-result-sub">Nhấn nút Reset để chơi ván mới</div>
                </div>
              )}
            </div>

            {/* Bảng thông số kỹ thuật bên dưới bàn cờ */}
            <div className="graph-ds-panel" style={{ marginTop: '20px', width: '100%' }}>
              <div className="ds-box">
                <div className="ds-title">Thông số cây giải thuật</div>
                <div className="ds-queue-row">
                  <div className="ds-cell"><span className="ds-cell-sub">Nodes duyệt</span><span style={{ color: '#58a6ff' }}>{metrics.nodes.toLocaleString()}</span></div>
                  {algo !== 'minimax' && <div className="ds-cell"><span className="ds-cell-sub">Nhánh bị tỉa</span><span style={{ color: '#f85149' }}>{metrics.pruned.toLocaleString()}</span></div>}
                  <div className="ds-cell"><span className="ds-cell-sub">Thời gian</span><span style={{ color: '#10b981' }}>{metrics.time}ms</span></div>
                  <div className="ds-cell"><span className="ds-cell-sub">Điểm số</span><span style={{ color: metrics.score > 0 ? '#10b981' : metrics.score < 0 ? '#f85149' : '#f59e0b' }}>{metrics.score}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột 2: Cây tìm kiếm Live Trace phiên bản TO RỘNG */}
          <div className="adv-column-trace">
            {renderTreeLog()}
          </div>

        </div>

        {/* KHỐI PHẢI BÊN RÌA: CHỈ CHỨA ĐIỀU KHIỂN & CHÚ THÍCH */}
        <div className="graph-sidebar adv-narrow-sidebar">
          <div className="ctrl-section">
            <h3>Hành động</h3>
            <div className="mode-btns">
              <button
                className="mode-btn"
                onClick={() => triggerAI(null, null)}
                disabled={isThinking || !!gameOver || gameState.currentPlayer !== PLAYER_O || treeSteps.length > 0}
              >
                🤖 Chạy AI
              </button>
              <button className="mode-btn danger" onClick={handleReset}>↺ Reset</button>
            </div>
          </div>

          <div className="ctrl-section">
            <h3>Chú thích ký hiệu</h3>
            <div className="ds-queue-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', marginTop: '10px' }}>
              <div className="adv-legend-item"><span className="adv-legend-dot explore-dot" /><span>Đang khám phá nhánh</span></div>
              <div className="adv-legend-item"><span className="adv-legend-dot evaluate-dot" /><span>Đánh giá nút lá (Heuristic)</span></div>
              <div className="adv-legend-item"><span className="adv-legend-dot result-dot" /><span>Dội ngược kết quả lên cha</span></div>
              <div className="adv-legend-item"><span className="adv-legend-dot prune-dot" /><span>Bị cắt tỉa Alpha-Beta Pruning</span></div>
            </div>
          </div>
        </div>

      </div>

      <Controls
        playing={playing}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleResetSteps}
        onStep={handleStepFwd}
        onStepBack={handleStepBack}
        speed={speed}
        onSpeedChange={s => setSpeed(s)}
        step={stepIdx}
        total={treeSteps.length}
      />
    </div>
  );
}
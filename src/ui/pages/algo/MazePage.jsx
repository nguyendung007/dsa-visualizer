import { useState, useRef, useCallback, useEffect } from 'react';
import { mazeBFS, mazeDFS, mazeDijkstra, mazeAStar, mazeBeamSearch, mazeTabuSearch, generateMaze } from '../../../core/maze/index.ts';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import './MazePage.css';

const MAZE_ROWS = 21;
const MAZE_COLS = 48;

const ALGOS = {
  bfs:      { name: 'BFS',      color: '#10b981', desc: 'Breadth-First Search — tìm đường ngắn nhất (số bước)' },
  dfs:      { name: 'DFS',      color: '#f59e0b', desc: 'Depth-First Search — duyệt theo chiều sâu' },
  dijkstra: { name: 'Dijkstra', color: '#58a6ff', desc: 'Dijkstra — tìm đường ngắn nhất có trọng số' },
  aStar:    { name: 'A*',       color: '#f472b6', desc: 'A* — kết hợp Dijkstra + Heuristic' },
  beam:     { name: 'Beam',     color: '#fbbf24', desc: 'Beam Search — giới hạn K đường đi tốt nhất' },
  tabu:     { name: 'Tabu',     color: '#f87171', desc: 'Tabu Search — meta-heuristic với bộ nhớ' },
};

function key(r, c) { return `${r},${c}`; }

function getCellState(r, c, maze, curStep, algo, start, goal, pathSet, heuristicType) {
  if (maze[r][c] === 1) return 'wall';
  const k = key(r, c);
  if (r === start.r && c === start.c) return 'start';
  if (r === goal.r  && c === goal.c)  return 'goal';
  if (!curStep) return 'empty';

  if (pathSet?.has(k)) return 'path';

  if (algo === 'aStar') {
    if (curStep.closedSet?.has(k)) return 'visited';
    if (curStep.openSet?.has(k))   return 'frontier';
    if (curStep.node && key(curStep.node.r, curStep.node.c) === k) return 'current';
    return 'empty';
  }

  if (curStep.node && key(curStep.node.r, curStep.node.c) === k) return 'current';
  if (curStep.visited?.has(k))  return 'visited';
  if (curStep.frontier?.has(k)) return 'frontier';
  return 'empty';
}

const STATE_COLORS = {
  wall:     '#0d1117',
  empty:    '#161b22',
  start:    '#10b981',
  goal:     '#f43f5e',
  visited:  '#1e3a5f',
  frontier: '#854d0e',
  current:  '#f59e0b',
  path:     '#10b981',
};

const STATE_BRIGHT = {
  wall:     '#0d1117',
  empty:    '#161b22',
  start:    '#34d399',
  goal:     '#fb7185',
  visited:  '#1e40af',
  frontier: '#d97706',
  current:  '#fbbf24',
  path:     '#34d399',
};

function stepDesc(s, algo) {
  if (!s) return 'Nhấn ▶ để bắt đầu tìm đường';
  if (s.type === 'init')       return `Khởi tạo — bắt đầu từ ô (${s.node?.r},${s.node?.c})`;
  if (s.type === 'visit')      return `DFS: thăm ô (${s.node?.r},${s.node?.c})`;
  if (s.type === 'process')    return `Xử lý ô (${s.node?.r},${s.node?.c})`;
  if (s.type === 'discover')   return `BFS: phát hiện (${s.to?.r},${s.to?.c}) từ (${s.from?.r},${s.from?.c})`;
  if (s.type === 'push')       return `DFS: đẩy (${s.to?.r},${s.to?.c}) vào Stack`;
  if (s.type === 'relax') {
    if (algo === 'aStar') return `A*: xét (${s.to?.r},${s.to?.c}) — g=${s.tentativeG}`;
    return `Dijkstra: xét cạnh → (${s.to?.r},${s.to?.c}), ước: ${s.candidate}`;
  }
  if (s.type === 'update') {
    if (algo === 'aStar') return `Cập nhật (${s.node?.r},${s.node?.c}): g=${s.gScore}, f=${s.fScore}`;
    return `Cập nhật dist(${s.node?.r},${s.node?.c}) = ${s.newDist}`;
  }
  if (s.type === 'goal_found') return `✓ Tìm thấy đích! Đường đi dài ${(s.path?.length || 1) - 1} bước`;
  if (s.type === 'no_path')    return `✗ Không tìm thấy đường đi!`;
  if (s.type === 'done')       return s.path?.length > 0 ? `✓ Hoàn thành — đường đi dài ${s.path.length - 1} bước` : '✓ Hoàn thành';
  return '';
}

export default function MazePage() {
  const [algo, setAlgo]           = useState('bfs');
  const [maze, setMaze]           = useState(() => generateMaze(MAZE_ROWS, MAZE_COLS));
  const [start, setStart]         = useState({ r: 1, c: 1 });
  const [goal, setGoal]           = useState({ r: MAZE_ROWS - 2, c: MAZE_COLS - 2 });
  const [steps, setSteps]         = useState([]);
  const [stepIdx, setStepIdx]     = useState(0);
  const [curStep, setCurStep]     = useState(null);
  const [playing, setPlaying]     = useState(false);
  const [speed, setSpeed]         = useState(40);
  const [heuristicType, setHeuristicType] = useState('manhattan');
  const [clickMode, setClickMode] = useState(null); 
  const [pathSet, setPathSet]     = useState(null);
  const engineRef                 = useRef(null);
  const { saveProgress }          = useProgress();

  const rows = maze.length;
  const cols = maze[0].length;

  useEffect(() => {
    if (curStep?.path?.length > 0) {
      setPathSet(new Set(curStep.path.map(p => key(p.r, p.c))));
    } else {
      setPathSet(null);
    }
  }, [curStep]);

  function newMaze() {
    engineRef.current?.pause();
    const m = generateMaze(MAZE_ROWS, MAZE_COLS);
    setMaze(m);
    setStart({ r: 1, c: 1 });
    setGoal({ r: m.length - 2, c: m[0].length - 2 });
    setSteps([]); setStepIdx(0); setCurStep(null);
    setPlaying(false); setPathSet(null);
  }

  function runAlgo() {
    engineRef.current?.pause();
    let s;
    if      (algo === 'bfs')      s = mazeBFS(maze, rows, cols, start, goal);
    else if (algo === 'dfs')      s = mazeDFS(maze, rows, cols, start, goal);
    else if (algo === 'dijkstra') s = mazeDijkstra(maze, rows, cols, start, goal);
    else if (algo === 'aStar')    s = mazeAStar(maze, rows, cols, start, goal, heuristicType);
    else if (algo === 'beam')     s = mazeBeamSearch(maze, rows, cols, start, goal, 3, heuristicType);
    else if (algo === 'tabu')     s = mazeTabuSearch(maze, rows, cols, start, goal, 50, 10, heuristicType);

    setSteps(s); setStepIdx(0); setCurStep(null); setPathSet(null);

    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
    saveProgress('maze', ALGOS[algo].name);
  }

  function handleCellClick(r, c) {
    if (maze[r][c] === 1) return;
    if (clickMode === 'start') {
      setStart({ r, c });
      setClickMode(null);
    } else if (clickMode === 'goal') {
      setGoal({ r, c });
      setClickMode(null);
    }
  }

  const CELL = Math.min(Math.floor(900 / cols), Math.floor(340 / rows));
  const svgW = cols * CELL;
  const svgH = rows * CELL;

  const visitedCount = curStep?.visited?.size ?? curStep?.closedSet?.size ?? 0;
  const frontierCount = curStep?.frontier?.size ?? curStep?.openSet?.size ?? 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Maze Algorithms</h1>
        <p>BFS, DFS, Dijkstra, A* — tạo mê cung ngẫu nhiên và trực quan hoá từng bước tìm đường</p>
      </div>

      {/* Tabs thuật toán */}
      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button key={k}
            className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => {
              setAlgo(k);
              setCurStep(null); setSteps([]); setStepIdx(0);
              setPlaying(false); setPathSet(null);
              engineRef.current?.pause();
            }}>
            {v.name}
          </button>
        ))}
      </div>

      <div className="maze-workspace">
        {/* ─── Main: SVG mê cung ─────────────────────────────── */}
        <div className="maze-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep, algo)}</span>
          </div>

          <div className="maze-svg-wrap">
            <svg
              width={svgW} height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="maze-svg"
              style={{ cursor: clickMode ? 'crosshair' : 'default' }}
            >
              {maze.map((row, r) =>
                row.map((cell, c) => {
                  const state = getCellState(r, c, maze, curStep, algo, start, goal, pathSet, heuristicType);
                  const isPath = state === 'path';
                  return (
                    <rect
                      key={key(r, c)}
                      x={c * CELL} y={r * CELL}
                      width={CELL} height={CELL}
                      fill={STATE_COLORS[state]}
                      stroke={state === 'wall' ? '#0d1117' : '#0d1117'}
                      strokeWidth={0.5}
                      rx={state === 'wall' ? 0 : 1}
                      onClick={() => handleCellClick(r, c)}
                      style={{ transition: 'fill 0.08s ease' }}
                    />
                  );
                })
              )}

              {/* Start marker */}
              <text
                x={start.c * CELL + CELL / 2}
                y={start.r * CELL + CELL / 2 + 1}
                textAnchor="middle" dominantBaseline="central"
                fill="#ffffff" fontSize={CELL * 0.6} fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >S</text>

              {/* Goal marker */}
              <text
                x={goal.c * CELL + CELL / 2}
                y={goal.r * CELL + CELL / 2 + 1}
                textAnchor="middle" dominantBaseline="central"
                fill="#ffffff" fontSize={CELL * 0.6} fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >G</text>
            </svg>
          </div>

          {/* Legend */}
          <div className="maze-legend">
            {[
              { label: 'Chưa thăm', color: STATE_COLORS.empty },
              { label: 'Đang xét (frontier)', color: '#d97706' },
              { label: 'Đã thăm', color: '#1e40af' },
              { label: 'Đang xử lý', color: '#fbbf24' },
              { label: 'Đường đi', color: '#34d399' },
              { label: 'Tường', color: '#0d1117', border: '#374151' },
            ].map(({ label, color, border }) => (
              <div key={label} className="legend-item">
                <span className="legend-dot" style={{ background: color, border: border ? `1px solid ${border}` : 'none' }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* DS Panel: Queue / Stack / OpenSet */}
          {curStep && (
            <div className="graph-ds-panel">
              {(algo === 'bfs') && (
                <div className="ds-box">
                  <div className="ds-title">Queue (FIFO)</div>
                  <div className="ds-queue-row">
                    <span className="ds-ptr">FRONT</span>
                    {(curStep.queue || []).length === 0 && <span className="ds-empty">rỗng</span>}
                    {(curStep.queue || []).slice(0, 12).map((k, i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`} style={{ fontSize: 10 }}>{k}</div>
                    ))}
                    {(curStep.queue || []).length > 12 && <span className="ds-ptr">+{curStep.queue.length - 12}</span>}
                    {(curStep.queue || []).length > 0 && <span className="ds-ptr">REAR</span>}
                  </div>
                </div>
              )}
              {(algo === 'dfs') && (
                <div className="ds-box">
                  <div className="ds-title">Stack (LIFO)</div>
                  <div className="ds-queue-row">
                    <span className="ds-ptr">TOP</span>
                    {(curStep.stack || []).length === 0 && <span className="ds-empty">rỗng</span>}
                    {[...(curStep.stack || [])].reverse().slice(0, 12).map((k, i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`} style={{ fontSize: 10 }}>{k}</div>
                    ))}
                    {(curStep.stack || []).length > 12 && <span className="ds-ptr">+{(curStep.stack?.length || 0) - 12} more</span>}
                  </div>
                </div>
              )}
              {(algo === 'aStar') && curStep.gScore && (
                <div className="ds-box">
                  <div className="ds-title">A* — Open Set ({curStep.openSet?.size ?? 0} ô)</div>
                  <div className="ds-queue-row">
                    {curStep.openSet?.size === 0 && <span className="ds-empty">rỗng</span>}
                    {[...(curStep.openSet || [])].slice(0, 10).map((k, i) => (
                      <div key={i} className="ds-cell" style={{ fontSize: 9 }}>
                        <span>{k}</span>
                        <span className="ds-cell-sub">
                          g={curStep.gScore[k] === Infinity ? '∞' : curStep.gScore[k]}
                        </span>
                      </div>
                    ))}
                    {(curStep.openSet?.size ?? 0) > 10 && <span className="ds-ptr">+{curStep.openSet.size - 10}</span>}
                  </div>
                </div>
              )}
              {(algo === 'dijkstra') && (
                <div className="ds-box">
                  <div className="ds-title">Priority Queue — Dijkstra</div>
                  <div className="ds-queue-row">
                    {(curStep.pq || []).length === 0 && <span className="ds-empty">rỗng</span>}
                    {[...(curStep.pq || [])].sort((a,b) => a[0]-b[0]).slice(0, 10).map(([d, k], i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`} style={{ fontSize: 9 }}>
                        <span>{k}</span>
                        <span className="ds-cell-sub">d={d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Sidebar ───────────────────────────────────────── */}
        <div className="graph-sidebar">

          {/* Tạo mê cung */}
          <div className="ctrl-section">
            <h3>Mê cung</h3>
            <button className="btn-generate" style={{ width: '100%', marginBottom: 8 }} onClick={newMaze}>
              🎲 Sinh mê cung mới
            </button>
            <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.6 }}>
              Kích thước: {cols}×{rows}<br />
              Thuật toán sinh: Recursive Backtracker
            </div>
          </div>

          {/* Đặt điểm start/goal */}
          <div className="ctrl-section">
            <h3>Điểm bắt đầu / đích</h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button
                className={`mode-btn ${clickMode === 'start' ? 'active' : ''}`}
                style={{ flex: 1, background: clickMode === 'start' ? '#10b981' : '' }}
                onClick={() => setClickMode(m => m === 'start' ? null : 'start')}>
                📍 Đặt S
              </button>
              <button
                className={`mode-btn ${clickMode === 'goal' ? 'active' : ''}`}
                style={{ flex: 1, background: clickMode === 'goal' ? '#f43f5e' : '' }}
                onClick={() => setClickMode(m => m === 'goal' ? null : 'goal')}>
                🎯 Đặt G
              </button>
            </div>
            {clickMode && (
              <div style={{ fontSize: 11, color: '#f59e0b' }}>
                Click vào ô trống trong mê cung để đặt {clickMode === 'start' ? 'điểm bắt đầu (S)' : 'điểm đích (G)'}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#4a6b8a', marginTop: 6 }}>
              S: ({start.r}, {start.c}) &nbsp;|&nbsp; G: ({goal.r}, {goal.c})
            </div>
          </div>

          {/* Chạy thuật toán */}
          <div className="ctrl-section">
            <h3>Chạy thuật toán</h3>
            {algo === 'aStar' && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#4a6b8a' }}>Hàm Heuristic:</span>
                <select value={heuristicType} onChange={e => setHeuristicType(e.target.value)}
                  className="arr-input" style={{ width: '100%', marginTop: 4 }}>
                  <option value="manhattan">Manhattan</option>
                  <option value="euclidean">Euclidean</option>
                </select>
              </div>
            )}
            <button className="btn-generate" style={{ width: '100%', background: ALGOS[algo].color }}
              onClick={runAlgo}>
              ▶ Chạy {ALGOS[algo].name}
            </button>
          </div>

          {/* Mô tả thuật toán */}
          <div className="ctrl-section">
            <h3>{ALGOS[algo].name}</h3>
            <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
              {algo === 'bfs' && <>
                Duyệt theo chiều rộng, dùng <b style={{ color: '#10b981' }}>Queue (FIFO)</b>.<br />
                <b>Đảm bảo</b> tìm đường ngắn nhất (ít bước nhất) trong mê cung không trọng số.<br />
                Khám phá đều ra mọi hướng.
              </>}
              {algo === 'dfs' && <>
                Duyệt theo chiều sâu, dùng <b style={{ color: '#f59e0b' }}>Stack (LIFO)</b>.<br />
                Không đảm bảo đường ngắn nhất, nhưng tốn ít bộ nhớ hơn BFS.<br />
                Đi sâu vào một nhánh trước khi quay lui.
              </>}
              {algo === 'dijkstra' && <>
                Tìm đường ngắn nhất có <b style={{ color: '#58a6ff' }}>trọng số</b> dùng Priority Queue.<br />
                Trong mê cung này, ô thường có w=1, ô đặc biệt có w=3.<br />
                Luôn xử lý ô có khoảng cách nhỏ nhất trước.
              </>}
              {algo === 'aStar' && <>
                Kết hợp <b style={{ color: '#f472b6' }}>Dijkstra + Heuristic</b>.<br />
                <b style={{ color: '#f59e0b' }}>Manhattan</b>: |Δr| + |Δc| — tốt cho grid 4 chiều.<br />
                <b style={{ color: '#f59e0b' }}>Euclidean</b>: √(Δr²+Δc²) — ước lượng chính xác hơn.<br />
                Thường nhanh hơn Dijkstra vì ưu tiên hướng đến đích.
              </>}
              {algo === 'beam' && <>
  Biến thể của <b style={{ color: '#fbbf24' }}>Best-First Search</b> với giới hạn Beam.<br />
  Chỉ giữ lại <b style={{ color: '#fbbf24' }}>K=3</b> đường đi tốt nhất mỗi bước.<br />
  Cân bằng giữa <b style={{ color: '#fbbf24' }}>tìm kiếm rộng</b> và <b style={{ color: '#fbbf24' }}>độ sâu</b>.<br />
  Nhanh hơn BFS nhưng có thể bỏ lỡ đường đi tối ưu.
</>}
{algo === 'tabu' && <>
  Thuật toán <b style={{ color: '#f87171' }}>meta-heuristic</b> với bộ nhớ Tabu.<br />
  <b style={{ color: '#f87171' }}>K=50</b> iterations, <b style={{ color: '#f87171' }}>T=10</b> kích thước tabu.<br />
  Có khả năng <b style={{ color: '#f87171' }}>thoát khỏi local optimum</b>.<br />
  Không đảm bảo tối ưu nhưng thường tìm được đường đi tốt.
</>}
            </div>
          </div>

          {/* Thông tin */}
          <div className="ctrl-section">
            <h3>Thông tin</h3>
            <div style={{ fontSize: 12, color: '#8b9eb5', lineHeight: 1.8 }}>
              <div>Ô đã thăm: <b style={{ color: '#58a6ff' }}>{visitedCount}</b></div>
              <div>Frontier: <b style={{ color: '#d97706' }}>{frontierCount}</b></div>
              {curStep?.path?.length > 0 && (
                <div>Độ dài đường đi: <b style={{ color: '#10b981' }}>{curStep.path.length - 1}</b> bước</div>
              )}
              {algo === 'dijkstra' && curStep?.dist && (() => {
                const goalDist = curStep.dist[`${goal.r},${goal.c}`];
                return goalDist !== undefined && goalDist !== Infinity
                  ? <div>Chi phí đến đích: <b style={{ color: '#10b981' }}>{goalDist}</b></div>
                  : null;
              })()}
              {algo === 'aStar' && curStep?.gScore && (() => {
                const gk = `${goal.r},${goal.c}`;
                const g = curStep.gScore[gk];
                return g !== undefined && g !== Infinity
                  ? <div>g(đích): <b style={{ color: '#10b981' }}>{g}</b></div>
                  : null;
              })()}
            </div>
          </div>
        </div>
      </div>

      <Controls
        playing={playing}
        onPlay={() => { setPlaying(true); engineRef.current?.play(); }}
        onPause={() => { setPlaying(false); engineRef.current?.pause(); }}
        onReset={() => {
          setPlaying(false); engineRef.current?.reset();
          setStepIdx(0); setCurStep(steps[0] ?? null);
        }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed} onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx} total={steps.length}
      />
    </div>
  );
}
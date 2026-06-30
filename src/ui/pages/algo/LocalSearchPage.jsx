import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  generateHeatmap,
  hillClimbing,
  simulatedAnnealing,
  geneticAlgorithm,
} from '../../../core/localSearch/index.ts';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import './LocalSearchPage.css';

const ROWS = 20;
const COLS = 45;

const ALGOS = {
  hillClimbing: {
    name: 'Hill Climbing',
    color: '#10b981',
    desc: 'Leo đồi tham lam — luôn chọn láng giềng tốt nhất',
  },
  sa: {
    name: 'Simulated Annealing',
    color: '#f59e0b',
    desc: 'Ủ nhiệt mô phỏng — chấp nhận nước đi xấu theo xác suất e^(ΔE/T)',
  },
  ga: {
    name: 'Genetic Algorithm',
    color: '#a78bfa',
    desc: 'Giải thuật di truyền — tiến hoá quần thể bằng selection/crossover/mutation',
  },
};

function key(r, c) { return `${r},${c}`; }


function heatColor(v) {
  const stops = [
    [0.00, [8,   15,  40]],
    [0.15, [20,  60,  120]],
    [0.30, [30,  120, 180]],
    [0.45, [30,  180, 170]],
    [0.60, [80,  200,  80]],
    [0.75, [220, 200,  40]],
    [0.88, [240, 120,  20]],
    [1.00, [220,  30,  30]],
  ];

  let i = 0;
  while (i < stops.length - 2 && v > stops[i + 1][0]) i++;
  const [t0, c0] = stops[i];
  const [t1, c1] = stops[i + 1];
  const t = (v - t0) / (t1 - t0);
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * t);
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * t);
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function stepDesc(s) {
  if (!s) return 'Nhấn ▶ để bắt đầu tìm kiếm cục bộ';
  return s.desc ?? s.type ?? '';
}

function FitnessChart({ history, color, width = 200, height = 50 }) {
  if (!history || history.length < 2) return null;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || 0.001;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="ls-chart-svg">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
      <line x1="0" y1={height-1} x2={width} y2={height-1} stroke="#1e2d3d" strokeWidth={1} />
    </svg>
  );
}

export default function LocalSearchPage() {
  const [algo, setAlgo]         = useState('hillClimbing');
  const [heatmap, setHeatmap]   = useState(() => generateHeatmap(ROWS, COLS));
  const [steps, setSteps]       = useState([]);
  const [stepIdx, setStepIdx]   = useState(0);
  const [curStep, setCurStep]   = useState(null);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(60);
  const [fitnessHist, setFitnessHist] = useState([]);

  // SA params
  const [saT0, setSaT0]         = useState(1.0);
  const [saAlpha, setSaAlpha]   = useState(0.95);
  const [saMaxIter, setSaMaxIter] = useState(400);

  // GA params
  const [gaPopSize, setGaPopSize]   = useState(20);
  const [gaGens, setGaGens]         = useState(40);
  const [gaMutRate, setGaMutRate]   = useState(0.15);

  // HC start position (click trên heatmap)
  const [startPos, setStartPos] = useState({ r: Math.floor(ROWS / 2), c: Math.floor(COLS / 2) });
  const [clickMode, setClickMode] = useState(false); // true = đang chờ click để set start

  const engineRef  = useRef(null);
  const { saveProgress } = useProgress();

  const rows = heatmap.length;
  const cols = heatmap[0].length;

  const CELL = Math.min(Math.floor(900 / cols), Math.floor(360 / rows));
  const svgW = cols * CELL;
  const svgH = rows * CELL;

  useEffect(() => {
    if (!curStep) { setFitnessHist([]); return; }
    const val = curStep.value ?? curStep.genBestVal ?? curStep.bestVal;
    if (val !== undefined) {
      setFitnessHist(prev => {
        if (stepIdx <= 1) return [val];
        return [...prev, val];
      });
    }
  }, [curStep, stepIdx]);

  function newHeatmap() {
    engineRef.current?.pause();
    const h = generateHeatmap(ROWS, COLS, Math.random());
    setHeatmap(h);
    setSteps([]); setStepIdx(0); setCurStep(null);
    setPlaying(false); setFitnessHist([]);
  }

  function runAlgo() {
    engineRef.current?.pause();
    setFitnessHist([]);

    let s;
    if (algo === 'hillClimbing') {
      s = hillClimbing(heatmap, rows, cols, startPos.r, startPos.c);
    } else if (algo === 'sa') {
      s = simulatedAnnealing(heatmap, rows, cols, startPos.r, startPos.c, {
        T0: saT0, alpha: saAlpha, minT: 0.001, maxIter: saMaxIter, seed: Math.random(),
      });
    } else if (algo === 'ga') {
      s = geneticAlgorithm(heatmap, rows, cols, {
        popSize: gaPopSize, generations: gaGens, mutationRate: gaMutRate, seed: Math.random(),
      });
    }

    setSteps(s); setStepIdx(0); setCurStep(null);

    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
    saveProgress('localSearch', ALGOS[algo].name);
  }

  function getCellOverlay(r, c) {
    if (!curStep) return null;
    const k = key(r, c);

    // GA: tô màu dân số
    if (algo === 'ga' && curStep.population) {
      const popKeys = new Set(curStep.population.map(ind => key(ind.r, ind.c)));
      const bestKey = curStep.bestEver ? key(curStep.bestEver.r, curStep.bestEver.c) : null;
      if (k === bestKey) return 'best';
      if (popKeys.has(k)) return 'population';
    }

    // SA: path trail + current + best
    if (algo === 'sa') {
      const pathSet = curStep.path ? new Set(curStep.path) : null;
      const bestKey = curStep.bestNode ? key(curStep.bestNode.r, curStep.bestNode.c) : null;
      if (k === bestKey) return 'best';
      if (curStep.node && key(curStep.node.r, curStep.node.c) === k) return 'current';
      if (curStep.candidate && key(curStep.candidate.r, curStep.candidate.c) === k) return 'candidate';
      if (pathSet?.has(k)) return 'trail';
    }

    // HC: visited path
    if (algo === 'hillClimbing') {
      const visited = curStep.visited;
      const bestKey = curStep.node ? key(curStep.node.r, curStep.node.c) : null;
      const nbSet = curStep.neighbors ? new Set(curStep.neighbors.map(n => key(n.node.r, n.node.c))) : null;
      if (k === bestKey) return 'current';
      if (nbSet?.has(k)) return 'neighbor';
      if (visited?.has(k)) return 'visited';
    }

    return null;
  }

  const globalBestVal = curStep?.bestEverVal ?? curStep?.bestVal ?? curStep?.value;
  const curVal = curStep?.value ?? curStep?.genBestVal;
  const saTemp = curStep?.T;
  const saMaxTemp = saT0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Local Search Algorithms</h1>
        <p>Hill Climbing, Simulated Annealing, Genetic Algorithm — tối ưu hoá trên bản đồ nhiệt 2D</p>
      </div>

      {/* ─── Algo Tabs ─────────────────────────────────────────── */}
      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button
            key={k}
            className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => {
              setAlgo(k);
              setCurStep(null); setSteps([]); setStepIdx(0);
              setPlaying(false); setFitnessHist([]);
              engineRef.current?.pause();
            }}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="ls-workspace">
        {/* ─── Main: Heatmap SVG ─────────────────────────────── */}
        <div className="ls-main">
          {/* Step bar */}
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep)}</span>
          </div>

          <div className="ls-svg-wrap">
            <svg
              width={svgW} height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="ls-svg"
              style={{ cursor: clickMode ? 'crosshair' : 'default' ,
                       width: svgW,  
                       height: svgH, 
                       maxWidth: '100%', 
                       maxHeight: '100%', 

              }}
              
              onClick={(e) => {
                if (!clickMode) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const c = Math.floor(x / (rect.width / cols));
                const r = Math.floor(y / (rect.height / rows));
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                  setStartPos({ r, c });
                  setClickMode(false);
                }
              }}
            >
              {/* Nền heatmap */}
              {heatmap.map((row, r) =>
                row.map((v, c) => (
                  <rect
                    key={key(r, c)}
                    x={c * CELL} y={r * CELL}
                    width={CELL} height={CELL}
                    fill={heatColor(v)}
                    stroke="none"
                  />
                ))
              )}

              {/* Overlay trạng thái thuật toán */}
              {heatmap.map((row, r) =>
                row.map((v, c) => {
                  const overlay = getCellOverlay(r, c);
                  if (!overlay) return null;

                  const overlayStyles = {
                    current:    { fill: '#fbbf24', opacity: 0.95, rx: 2 },
                    best:       { fill: '#f43f5e', opacity: 1.0,  rx: 2 },
                    candidate:  { fill: '#60a5fa', opacity: 0.8,  rx: 1 },
                    neighbor:   { fill: '#a78bfa', opacity: 0.5,  rx: 1 },
                    visited:    { fill: '#ffffff', opacity: 0.12, rx: 0 },
                    trail:      { fill: '#f59e0b', opacity: 0.3,  rx: 0 },
                    population: { fill: '#a78bfa', opacity: 0.7,  rx: 2 },
                  };

                  const s = overlayStyles[overlay];
                  return (
                    <rect
                      key={`ov-${key(r,c)}`}
                      x={c * CELL + 0.5} y={r * CELL + 0.5}
                      width={CELL - 1} height={CELL - 1}
                      fill={s.fill}
                      opacity={s.opacity}
                      rx={s.rx}
                    />
                  );
                })
              )}

              {/* Marker: Start (HC, SA) */}
              {algo !== 'ga' && (
                <>
                  <circle
                    cx={startPos.c * CELL + CELL / 2}
                    cy={startPos.r * CELL + CELL / 2}
                    r={CELL * 0.38}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth={1}
                    opacity={0.9}
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    x={startPos.c * CELL + CELL / 2}
                    y={startPos.r * CELL + CELL / 2 + 1}
                    textAnchor="middle" dominantBaseline="central"
                    fill="#fff" fontSize={CELL * 0.5} fontWeight="bold"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >S</text>
                </>
              )}

              {/* Marker: Current best (HC current, SA bestNode, GA bestEver) */}
              {curStep && (() => {
                const best = algo === 'ga'
                  ? curStep.bestEver
                  : (algo === 'sa' ? curStep.bestNode : curStep.node);
                if (!best) return null;
                return (
                  <>
                    <rect
                      x={best.c * CELL} y={best.r * CELL}
                      width={CELL} height={CELL}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth={CELL > 14 ? 2 : 1.5}
                      rx={2}
                      style={{ pointerEvents: 'none' }}
                    />
                    <text
                      x={best.c * CELL + CELL / 2}
                      y={best.r * CELL + CELL / 2 + 0.5}
                      textAnchor="middle" dominantBaseline="central"
                      fill="#fff" fontSize={CELL * 0.45} fontWeight="bold"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >★</text>
                  </>
                );
              })()}

              {/* GA: dân số dots */}
              {algo === 'ga' && curStep?.population?.map((ind, i) => {
                const isBest = curStep.bestEver &&
                  ind.r === curStep.bestEver.r && ind.c === curStep.bestEver.c;
                return (
                  <circle
                    key={`ind-${i}`}
                    cx={ind.c * CELL + CELL / 2}
                    cy={ind.r * CELL + CELL / 2}
                    r={isBest ? CELL * 0.4 : CELL * 0.28}
                    fill={isBest ? '#f43f5e' : '#a78bfa'}
                    stroke={isBest ? '#ffffff' : 'none'}
                    strokeWidth={1}
                    opacity={isBest ? 1 : 0.75}
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })}

              {/* SA: candidate arrow */}
              {algo === 'sa' && curStep?.node && curStep?.candidate && (() => {
                const from = curStep.node;
                const to = curStep.candidate;
                const x1 = from.c * CELL + CELL / 2;
                const y1 = from.r * CELL + CELL / 2;
                const x2 = to.c * CELL + CELL / 2;
                const y2 = to.r * CELL + CELL / 2;
                const accepted = curStep.accepted;
                return (
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={accepted ? '#60a5fa' : '#ef4444'}
                    strokeWidth={1.5}
                    strokeDasharray={accepted ? 'none' : '3,2'}
                    opacity={0.8}
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })()}
            </svg>
          </div>

          {/* Legend */}
          <div className="ls-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: heatColor(0) }} />Thấp
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: heatColor(0.5) }} />Trung bình
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: heatColor(1) }} />Cao
            </div>
            {algo !== 'ga' && <>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#fbbf24' }} />
                {algo === 'hillClimbing' ? 'Vị trí hiện tại' : 'Đang xét'}
              </div>
              {algo === 'hillClimbing' && (
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#a78bfa' }} />Láng giềng xét
                </div>
              )}
            </>}
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#f43f5e' }} />★ Best
            </div>
            {algo === 'ga' && (
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#a78bfa', borderRadius: '50%' }} />Cá thể
              </div>
            )}
          </div>

          {/* SA: Temperature bar */}
          {algo === 'sa' && curStep && (
            <div className="sa-temp-bar">
              <div className="ls-chart-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🌡 Nhiệt độ (Temperature)</span>
                <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>
                  T = {saTemp?.toFixed(4) ?? '—'}
                </span>
              </div>
              <div className="temp-track">
                <div
                  className="temp-fill"
                  style={{
                    width: `${Math.min(100, ((saTemp ?? 0) / saMaxTemp) * 100)}%`,
                    background: `hsl(${Math.round(((saTemp ?? 0) / saMaxTemp) * 60)}, 90%, 55%)`,
                  }}
                />
              </div>
              {curStep.accepted !== undefined && (
                <div style={{ marginTop: 6, fontSize: 11, color: curStep.accepted ? '#10b981' : '#f87171' }}>
                  {curStep.accepted
                    ? (curStep.deltaE > 0 ? '✓ Cải thiện được chấp nhận' : `⚡ Chấp nhận nước đi tệ — P=${curStep.prob?.toFixed(3)}`)
                    : `✗ Từ chối — ΔE=${curStep.deltaE?.toFixed(3)}`}
                </div>
              )}
            </div>
          )}

          {/* Fitness chart */}
          {fitnessHist.length > 2 && (
            <div className="ls-chart-panel">
              <div className="ls-chart-title">📈 Lịch sử Fitness (Best found)</div>
              <FitnessChart
                history={fitnessHist}
                color={ALGOS[algo].color}
                width={Math.min(svgW, 500)}
                height={48}
              />
            </div>
          )}

          {/* GA: Population grid */}
          {algo === 'ga' && curStep?.population && (
            <div className="pop-panel">
              <div className="pop-title">
                Quần thể — Thế hệ {curStep.generation}/{curStep.generations ?? gaGens}
                &nbsp;|&nbsp; Avg: {curStep.avgFitness?.toFixed(3)}
              </div>
              <div className="pop-grid">
                {curStep.population.map((ind, i) => {
                  const isBest = curStep.bestEver &&
                    ind.r === curStep.bestEver.r && ind.c === curStep.bestEver.c;
                  return (
                    <div
                      key={i}
                      className={`pop-ind ${isBest ? 'best' : ''}`}
                      title={`(${ind.r},${ind.c}) f=${ind.fitness.toFixed(3)}`}
                      style={{
                        background: heatColor(ind.fitness),
                        border: isBest ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {ind.fitness.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Sidebar ───────────────────────────────────────── */}
        <div className="ls-sidebar">

          {/* Heatmap */}
          <div className="ctrl-section">
            <h3>Bản đồ nhiệt</h3>
            <button
              className="mode-btn"
              style={{ background: '#1e3a5f', borderColor: '#1e4080' }}
              onClick={newHeatmap}
            >
              🎲 Sinh bản đồ mới
            </button>
            <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.6, marginTop: 6 }}>
              Kích thước: {cols}×{rows}<br />
              Sinh bằng Gaussian peaks + noise
            </div>
          </div>

          {/* Start position (HC, SA) */}
          {algo !== 'ga' && (
            <div className="ctrl-section">
              <h3>Điểm xuất phát</h3>
              <button
                className={`mode-btn ${clickMode ? 'active' : ''}`}
                style={{ '--btn-color': '#10b981' }}
                onClick={() => setClickMode(m => !m)}
              >
                📍 {clickMode ? 'Click vào bản đồ...' : `Đặt Start (${startPos.r},${startPos.c})`}
              </button>
              {clickMode && (
                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>
                  Click vào bản đồ để chọn vị trí xuất phát
                </div>
              )}
            </div>
          )}

          {/* SA Params */}
          {algo === 'sa' && (
            <div className="ctrl-section">
              <h3>Tham số SA</h3>
              <div className="param-row">
                <div className="param-label">
                  <span>T₀ (Nhiệt ban đầu)</span>
                  <span className="param-val">{saT0.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="5" step="0.1"
                  value={saT0} onChange={e => setSaT0(+e.target.value)}
                  className="param-slider" />
              </div>
              <div className="param-row">
                <div className="param-label">
                  <span>α (Cooling rate)</span>
                  <span className="param-val">{saAlpha.toFixed(2)}</span>
                </div>
                <input type="range" min="0.80" max="0.99" step="0.01"
                  value={saAlpha} onChange={e => setSaAlpha(+e.target.value)}
                  className="param-slider" />
              </div>
              <div className="param-row">
                <div className="param-label">
                  <span>Số vòng lặp tối đa</span>
                  <span className="param-val">{saMaxIter}</span>
                </div>
                <input type="range" min="100" max="1000" step="50"
                  value={saMaxIter} onChange={e => setSaMaxIter(+e.target.value)}
                  className="param-slider" />
              </div>
            </div>
          )}

          {/* GA Params */}
          {algo === 'ga' && (
            <div className="ctrl-section">
              <h3>Tham số GA</h3>
              <div className="param-row">
                <div className="param-label">
                  <span>Dân số</span>
                  <span className="param-val">{gaPopSize}</span>
                </div>
                <input type="range" min="5" max="50" step="5"
                  value={gaPopSize} onChange={e => setGaPopSize(+e.target.value)}
                  className="param-slider" />
              </div>
              <div className="param-row">
                <div className="param-label">
                  <span>Số thế hệ</span>
                  <span className="param-val">{gaGens}</span>
                </div>
                <input type="range" min="10" max="100" step="5"
                  value={gaGens} onChange={e => setGaGens(+e.target.value)}
                  className="param-slider" />
              </div>
              <div className="param-row">
                <div className="param-label">
                  <span>Tỉ lệ đột biến</span>
                  <span className="param-val">{(gaMutRate * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0.01" max="0.5" step="0.01"
                  value={gaMutRate} onChange={e => setGaMutRate(+e.target.value)}
                  className="param-slider" />
              </div>
            </div>
          )}

          {/* Run */}
          <div className="ctrl-section">
            <h3>Chạy thuật toán</h3>
            <button
              className="mode-btn"
              style={{ background: ALGOS[algo].color, borderColor: 'transparent', color: '#fff', fontWeight: 600 }}
              onClick={runAlgo}
            >
              ▶ Chạy {ALGOS[algo].name}
            </button>
          </div>

          {/* Thống kê */}
          <div className="ctrl-section">
            <h3>Thông tin</h3>
            <div className="stat-row">
              <span>Bước hiện tại</span>
              <span className="stat-val">{stepIdx}/{steps.length}</span>
            </div>
            {curVal !== undefined && (
              <div className="stat-row">
                <span>Fitness hiện tại</span>
                <span className="stat-val" style={{ color: ALGOS[algo].color }}>
                  {curVal.toFixed(4)}
                </span>
              </div>
            )}
            {globalBestVal !== undefined && (
              <div className="stat-row">
                <span>Best tìm được</span>
                <span className="stat-val" style={{ color: '#f43f5e' }}>
                  {globalBestVal.toFixed(4)}
                </span>
              </div>
            )}
            {algo === 'sa' && saTemp !== undefined && (
              <div className="stat-row">
                <span>Nhiệt độ T</span>
                <span className="stat-val" style={{ color: '#f59e0b' }}>
                  {saTemp.toFixed(4)}
                </span>
              </div>
            )}
            {algo === 'ga' && curStep?.generation !== undefined && (
              <div className="stat-row">
                <span>Thế hệ</span>
                <span className="stat-val" style={{ color: '#a78bfa' }}>
                  {curStep.generation}/{gaGens}
                </span>
              </div>
            )}
            {algo === 'ga' && curStep?.avgFitness !== undefined && (
              <div className="stat-row">
                <span>Avg fitness</span>
                <span className="stat-val">{curStep.avgFitness.toFixed(4)}</span>
              </div>
            )}
            {curStep?.visited?.size > 0 && (
              <div className="stat-row">
                <span>Ô đã thăm</span>
                <span className="stat-val">{curStep.visited.size}</span>
              </div>
            )}
          </div>

          {/* Mô tả thuật toán */}
          <div className="ctrl-section">
            <h3>{ALGOS[algo].name}</h3>
            <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
              {algo === 'hillClimbing' && <>
                <b style={{ color: '#10b981' }}>Steepest Ascent</b> — xét tất cả 8 láng giềng, di chuyển đến ô có độ cao cao nhất.<br />
                <b>Điểm mạnh:</b> đơn giản, nhanh.<br />
                <b>Điểm yếu:</b> dễ mắc kẹt ở <b>cực đại cục bộ</b> (local maximum), không tìm được global maximum nếu không có ngẫu nhiên hoá.
              </>}
              {algo === 'sa' && <>
                <b style={{ color: '#f59e0b' }}>Ủ nhiệt mô phỏng</b> — bắt chước quá trình làm lạnh vật lý.<br />
                Xác suất chấp nhận nước đi xấu: <b style={{ color: '#f59e0b' }}>P = e^(ΔE/T)</b><br />
                T cao → chấp nhận mạo hiểm, T thấp → chỉ leo đồi. Lịch làm lạnh: T ← αT mỗi 10 bước.
              </>}
              {algo === 'ga' && <>
                <b style={{ color: '#a78bfa' }}>Giải thuật di truyền</b> — mô phỏng tiến hoá.<br />
                <b>Selection:</b> Tournament (chọn cá thể tốt hơn).<br />
                <b>Crossover:</b> BLX — con cái ở giữa 2 cha mẹ.<br />
                <b>Mutation:</b> ngẫu nhiên nhảy sang láng giềng.<br />
                <b>Elitism:</b> cá thể tốt nhất luôn được giữ lại.
              </>}
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
          setStepIdx(0); setCurStep(steps[0] ?? null); setFitnessHist([]);
        }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed} onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx} total={steps.length}
      />
    </div>
  );
}
import { useState, useRef } from 'react';
import { createUF, qfFind, qfUnion, quUnion, wquUnion, pcUnion, pcFind } from '../../core/unionfind/index.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './UnionFindPage.css';

const ALGOS = {
  qf:  { name: 'Quick Find',         color: '#f59e0b', complexity: 'Find O(1) / Union O(n)' },
  qu:  { name: 'Quick Union',        color: '#10b981', complexity: 'Find O(n) / Union O(n)' },
  wqu: { name: 'Weighted QU',        color: '#58a6ff', complexity: 'Find O(log n) / Union O(log n)' },
  pc:  { name: 'Path Compression',   color: '#a78bfa', complexity: 'Find O(α(n)) / Union O(α(n))' },
};

export default function UnionFindPage() {
  const [algo, setAlgo] = useState('qf');
  const [n, setN] = useState(8);
  const [uf, setUf] = useState(() => createUF(8));
  const [p, setP] = useState('');
  const [q, setQ] = useState('');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [history, setHistory] = useState([]);
  const engineRef = useRef(null);

  function resetUF(newN) {
    const size = newN ?? n;
    const newUf = createUF(size);
    setUf(newUf);
    setHistory([]);
    setSteps([]);
    setCurStep(null);
    setStepIdx(0);
    engineRef.current?.pause();
  }

  function runUnion() {
    const pi = parseInt(p), qi = parseInt(q);
    if (isNaN(pi) || isNaN(qi) || pi < 0 || qi < 0 || pi >= n || qi >= n) return;
    const ufCopy = {
      id: [...uf.id], parent: [...uf.parent], rank: [...uf.rank],
      size: [...uf.size], count: uf.count,
    };
    const s = [];
    if (algo === 'qf') qfUnion(ufCopy, pi, qi, s);
    else if (algo === 'qu') quUnion(ufCopy, pi, qi, s);
    else if (algo === 'wqu') wquUnion(ufCopy, pi, qi, s);
    else pcUnion(ufCopy, pi, qi, s);

    setHistory(h => [`Union(${pi},${qi})`, ...h.slice(0, 11)]);
    setSteps(s); setStepIdx(0); setCurStep(s[0] || null);

    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => { setPlaying(false); setUf(ufCopy); },
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
    setP(''); setQ('');
  }

  // Use live step data or current UF
  const parent = curStep?.parent || uf.parent;
  const id = curStep?.id || uf.id;
  const size = curStep?.size || uf.size;

  // Build groups from current state for display
  function getGroups(parent, n) {
    const groups = {};
    for (let i = 0; i < n; i++) {
      let root = i;
      const visited = new Set();
      while (parent[root] !== root && !visited.has(root)) { visited.add(root); root = parent[root]; }
      if (!groups[root]) groups[root] = [];
      groups[root].push(i);
    }
    return groups;
  }

  function getGroupsQF(id, n) {
    const groups = {};
    for (let i = 0; i < n; i++) {
      const g = id[i];
      if (!groups[g]) groups[g] = [];
      groups[g].push(i);
    }
    return groups;
  }

  const groups = algo === 'qf' ? getGroupsQF(id, n) : getGroups(parent, n);
  const groupColors = ['#58a6ff','#10b981','#f59e0b','#ef4444','#a78bfa','#f97316','#06b6d4','#ec4899','#84cc16','#fb923c'];
  const groupMap = {};
  Object.keys(groups).forEach((root, i) => {
    groups[root].forEach(node => groupMap[node] = groupColors[i % groupColors.length]);
  });

  const highlightNodes = new Set([
    curStep?.p, curStep?.q, curStep?.rp, curStep?.rq, curStep?.node, curStep?.child, curStep?.root,
    ...(curStep?.path || [])
  ].filter(x => x !== undefined && x !== null));

  // Forest / tree layout for Quick Union variants
  function buildForest(parent, n) {
    const children = Array.from({ length: n }, () => []);
    const roots = [];
    for (let i = 0; i < n; i++) {
      if (parent[i] === i) roots.push(i);
      else children[parent[i]].push(i);
    }
    return { roots, children };
  }

  function renderForest(parent, n) {
    const { roots, children } = buildForest(parent, n);
    const W = Math.max(600, n * 70), H = 240;
    const nodes = [], edges = [];

    function placeNode(node, x, y, xMin, xMax) {
      nodes.push({ id: node, x, y });
      const ch = children[node];
      if (ch.length === 0) return;
      const step = (xMax - xMin) / ch.length;
      ch.forEach((c, i) => {
        const cx = xMin + step * i + step / 2;
        edges.push({ x1: x, y1: y, x2: cx, y2: y + 65 });
        placeNode(c, cx, y + 65, xMin + step * i, xMin + step * (i + 1));
      });
    }

    const rootStep = W / roots.length;
    roots.forEach((r, i) => placeNode(r, rootStep * i + rootStep / 2, 36, rootStep * i, rootStep * (i + 1)));
    return { nodes, edges, W, H };
  }

  const forest = (algo !== 'qf') ? renderForest(parent, n) : null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Union-Find (Disjoint Set)</h1>
        <p>Quick Find, Quick Union, Weighted QU, Path Compression</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button key={k} className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => { setAlgo(k); resetUF(); }}>
            {v.name}
            <span style={{ display: 'block', fontSize: 9, color: '#4a6b8a' }}>{v.complexity}</span>
          </button>
        ))}
      </div>

      <div className="uf-workspace">
        <div className="uf-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{curStep?.desc || 'Chọn 2 nút để Union'}</span>
          </div>

          {/* Node grid */}
          <div className="uf-nodes">
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className={`uf-node ${highlightNodes.has(i) ? 'highlighted' : ''}`}
                style={{ '--node-color': groupMap[i] || '#1e3a5f', borderColor: highlightNodes.has(i) ? '#f59e0b' : groupMap[i] }}>
                <span className="uf-node-id">{i}</span>
                <span className="uf-node-sub">
                  {algo === 'qf' ? `id=${id[i]}` : `p=${parent[i]}`}
                  {(algo === 'wqu' || algo === 'pc') ? ` s=${size[i]}` : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Groups display */}
          <div className="uf-groups">
            <div className="uf-groups-title">Nhóm hiện tại ({Object.keys(groups).length} nhóm):</div>
            {Object.entries(groups).map(([root, members]) => (
              <div key={root} className="uf-group">
                <span className="uf-group-dot" style={{ background: groupColors[Object.keys(groups).indexOf(root) % groupColors.length] }} />
                <span className="uf-group-members">{`{${members.join(', ')}}`}</span>
                <span className="uf-group-root">root={root}</span>
              </div>
            ))}
          </div>

          {/* Tree visualization for QU variants */}
          {algo !== 'qf' && forest && (
            <div className="uf-forest">
              <div className="uf-forest-title">Cây rừng (Forest):</div>
              <svg width="100%" viewBox={`0 0 ${forest.W} ${forest.H}`} style={{ background: '#0d1117', borderRadius: 8, border: '1px solid #1e2d3d' }}>
                {forest.edges.map((e, i) => (
                  <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#1e3a5f" strokeWidth="1.5" />
                ))}
                {forest.nodes.map((node, i) => {
                  const isHL = highlightNodes.has(node.id);
                  const isPath = curStep?.path?.includes(node.id);
                  const col = isPath ? '#f59e0b' : groupMap[node.id] || '#1e3a5f';
                  return (
                    <g key={i}>
                      <circle cx={node.x} cy={node.y} r={20}
                        fill={col} fillOpacity={0.85}
                        stroke={isHL ? '#f59e0b' : '#0a0e1a'} strokeWidth={isHL ? 3 : 2} />
                      <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                        fill="white" fontSize="13" fontWeight="700" fontFamily="monospace">{node.id}</text>
                      {(algo === 'wqu' || algo === 'pc') && parent[node.id] === node.id && (
                        <text x={node.x} y={node.y + 30} textAnchor="middle" fill="#4a6b8a" fontSize="9" fontFamily="monospace">
                          s={size[node.id]}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* QF: id array display */}
          {algo === 'qf' && (
            <div className="uf-id-array">
              <div className="uf-forest-title">id[] array:</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                {id.map((v, i) => (
                  <div key={i} className="uf-id-cell" style={{ borderColor: curStep?.type === 'update_id' && curStep.i === i ? '#f59e0b' : '#1e2d3d' }}>
                    <span className="uf-id-idx">[{i}]</span>
                    <span className="uf-id-val" style={{ color: groupColors[v % groupColors.length] }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="uf-sidebar">
          <div className="ctrl-section">
            <h3>Tạo nodes</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#4a6b8a' }}>Số nodes:</span>
              <input type="number" min={2} max={16} value={n}
                onChange={e => { const v = Math.min(16, Math.max(2, parseInt(e.target.value) || 8)); setN(v); resetUF(v); }}
                className="arr-input" style={{ width: 60 }} />
            </div>
            <button className="btn-danger" style={{ width: '100%' }} onClick={() => resetUF()}>Reset</button>
          </div>

          <div className="ctrl-section">
            <h3>Union(p, q)</h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input className="arr-input" placeholder="p" type="number" min={0} max={n - 1}
                value={p} onChange={e => setP(e.target.value)} style={{ flex: 1 }} />
              <input className="arr-input" placeholder="q" type="number" min={0} max={n - 1}
                value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1 }} />
            </div>
            <button className="btn-generate" style={{ width: '100%' }} onClick={runUnion}>Union</button>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: '#4a6b8a', marginBottom: 4 }}>Nhanh:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {[[0,1],[1,2],[3,4],[4,5],[0,5],[6,7]].filter(([a,b]) => a < n && b < n).map(([a, b]) => (
                  <button key={`${a}-${b}`} className="btn-random" style={{ fontSize: 10, padding: '3px 8px' }}
                    onClick={() => { setP(String(a)); setQ(String(b)); }}>
                    {a}-{b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ctrl-section">
            <h3>Lịch sử Union</h3>
            <div className="log-panel">
              {history.length === 0 && <div className="log-empty">Chưa có thao tác</div>}
              {history.map((h, i) => (
                <div key={i} className="log-entry" style={{ opacity: 1 - i * 0.08 }}>{h}</div>
              ))}
            </div>
          </div>

          <div className="ctrl-section">
            <h3>Mô tả thuật toán</h3>
            <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
              {algo === 'qf' && <><b style={{ color: '#f59e0b' }}>Quick Find</b>: Lưu component id. Find O(1), Union phải cập nhật tất cả phần tử cùng nhóm → O(n).</>}
              {algo === 'qu' && <><b style={{ color: '#10b981' }}>Quick Union</b>: Lưu parent. Union chỉ nối root. Cây có thể mất cân bằng → O(n) worst case.</>}
              {algo === 'wqu' && <><b style={{ color: '#58a6ff' }}>Weighted QU</b>: Nối cây nhỏ vào cây lớn. Chiều cao max O(log n).</>}
              {algo === 'pc' && <><b style={{ color: '#a78bfa' }}>Path Compression</b>: Sau Find, nén đường về root. Kết hợp WQU → gần O(1) amortized.</>}
            </div>
          </div>
        </div>
      </div>

      <Controls
        playing={playing}
        onPlay={() => { setPlaying(true); engineRef.current?.play(); }}
        onPause={() => { setPlaying(false); engineRef.current?.pause(); }}
        onReset={() => { setPlaying(false); engineRef.current?.reset(); setStepIdx(0); setCurStep(steps[0]); }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed} onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx} total={steps.length}
      />
    </div>
  );
}

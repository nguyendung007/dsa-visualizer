import { useState, useRef } from 'react';
import { bfs, dfs, dijkstra, kruskal, bellmanFord, prim, kosaraju, topoSortDFS, topoSortKahn } from '../../core/graph/index.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './GraphPage.css';

const ALGOS = {
  bfs:        { name: 'BFS',           fn: bfs,      needsStart: true,  color: '#10b981' },
  dfs:        { name: 'DFS',           fn: dfs,      needsStart: true,  color: '#f59e0b' },
  dijkstra:   { name: 'Dijkstra',      fn: dijkstra, needsStart: true,  color: '#58a6ff' },
  bellmanFord:{ name: 'Bellman-Ford',  fn: null,     needsStart: true,  color: '#a78bfa' },
  kruskal:    { name: 'Kruskal (MST)', fn: null,     needsStart: false, color: '#f97316' },
  prim:       { name: 'Prim (MST)',    fn: null,     needsStart: true,  color: '#10b981' },
  kosaraju:   { name: 'Kosaraju (SCC)', fn: null,     needsStart: false, color: '#f43f5e' },
  topoDFS:    { name: 'Topo Sort (DFS)',fn: null,     needsStart: false, color: '#8b5cf6' },
  topoKahn:   { name: 'Topo (Kahn)',    fn: null,     needsStart: false, color: '#06b6d4' },
};

function defaultGraph() {
  return {
    nodes: [
      { id: 'A', x: 120, y: 80 }, { id: 'B', x: 280, y: 60 },
      { id: 'C', x: 420, y: 80 }, { id: 'D', x: 160, y: 200 },
      { id: 'E', x: 320, y: 220 }, { id: 'F', x: 460, y: 200 },
    ],
    edges: [
      { from: 'A', to: 'B', weight: 4 }, { from: 'A', to: 'D', weight: 2 },
      { from: 'B', to: 'C', weight: 5 }, { from: 'B', to: 'E', weight: 10 },
      { from: 'C', to: 'F', weight: 3 }, { from: 'D', to: 'E', weight: 3 },
      { from: 'E', to: 'F', weight: 7 }, { from: 'B', to: 'D', weight: 1 },
    ]
  };
}

function buildAdjList(nodes, edges) {
  const g = {};
  nodes.forEach(n => g[n.id] = []);
  edges.forEach(e => {
    g[e.from].push({ to: e.to, weight: e.weight });
    g[e.to].push({ to: e.from, weight: e.weight });
  });
  return g;
}

export default function GraphPage() {
  const [algo, setAlgo] = useState('bfs');
  const [graph, setGraph] = useState(defaultGraph);
  const [start, setStart] = useState('A');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(400);
  const [addMode, setAddMode] = useState(null);
  const [pending, setPending] = useState(null);
  const [newEdgeWeight, setNewEdgeWeight] = useState(1);
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef(null);
  const engineRef = useRef(null);

  const svgW = 600, svgH = 320;

  function getSVGPos(e) {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * svgW,
      y: ((e.clientY - rect.top) / rect.height) * svgH,
    };
  }

  function handleSVGClick(e) {
    if (dragging) return;
    const pos = getSVGPos(e);
    const hit = graph.nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < 26);
    if (addMode === 'node' && !hit) {
      const id = String.fromCharCode(65 + graph.nodes.length);
      setGraph(g => ({ ...g, nodes: [...g.nodes, { id, x: pos.x, y: pos.y }] }));
      return;
    }
    if (addMode === 'edge') {
      if (hit) {
        if (!pending) {
          setPending(hit.id);
        } else if (pending !== hit.id) {
          setGraph(g => ({ ...g, edges: [...g.edges, { from: pending, to: hit.id, weight: newEdgeWeight }] }));
          setPending(null);
        }
      }
    }
  }

  function handleMouseDown(e, nodeId) {
    if (addMode === 'edge') return;
    e.stopPropagation();
    setDragging(nodeId);
  }

  function handleMouseMove(e) {
    if (!dragging) return;
    const pos = getSVGPos(e);
    setGraph(g => ({ ...g, nodes: g.nodes.map(n => n.id === dragging ? { ...n, x: pos.x, y: pos.y } : n) }));
  }

  function handleMouseUp() { setDragging(null); }

  function runAlgo() {
    engineRef.current?.pause();
    const adj = buildAdjList(graph.nodes, graph.edges);
    let s;
    if (algo === 'kruskal') {
      s = kruskal(graph.nodes.map(n => n.id), graph.edges);
    } else if (algo === 'bellmanFord') {
      s = bellmanFord(adj, graph.nodes.map(n => n.id), start);
    } else if (algo === 'prim') {
      s = prim(adj, graph.nodes.map(n => n.id), start);
    } else if (algo === 'kosaraju') {
      s = kosaraju(adj, graph.nodes.map(n => n.id));
    } else if (algo === 'topoDFS') {
      s = topoSortDFS(adj, graph.nodes.map(n => n.id));
    } else if (algo === 'topoKahn') {
      s = topoSortKahn(adj, graph.nodes.map(n => n.id));
    } else {
      s = ALGOS[algo].fn(adj, start);
    }
    setSteps(s);
    setStepIdx(0);
    setCurStep(null);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
    eng.play();
    setPlaying(true);
  }

  const SCC_COLORS = ['#f43f5e','#f97316','#a78bfa','#10b981','#58a6ff','#eab308','#06b6d4','#ec4899'];

  function nodeColor(id) {
    if (!curStep) return '#1d4ed8';
    // Kosaraju SCC coloring
    if (algo === 'kosaraju' && curStep.sccs) {
      for (let i = 0; i < curStep.sccs.length; i++) {
        if (curStep.sccs[i].includes(id)) return SCC_COLORS[i % SCC_COLORS.length];
      }
    }
    if (algo === 'kosaraju') {
      if (curStep.type === 'visit1' && curStep.node === id) return '#f59e0b';
      if (curStep.type === 'visit2' && curStep.node === id) return '#f43f5e';
      if (curStep.visited2?.has(id)) return '#f43f5e';
    }
    // Topo Sort
    if (showTopo) {
      if (curStep.order?.includes(id)) return '#10b981';
      if (curStep.node === id) return '#f59e0b';
    }
    if (curStep.type === 'negativeCycle' && (curStep.from === id || curStep.to === id)) return '#ef4444';
    if (curStep.node === id) return '#f59e0b';
    if (curStep.inMST?.has(id)) return '#10b981';
    if (curStep.visited?.has(id)) return '#10b981';
    if (curStep.from === id) return '#f59e0b';
    if (curStep.to === id) return '#ef4444';
    return '#1e3a5f';
  }

  function edgeColor(edge) {
    if (!curStep) return '#1e2d3d';

    // Kruskal & Prim: highlight MST edges
    if ((algo === 'kruskal' || algo === 'prim') && curStep.mst) {
      const inMst = curStep.mst.some(e =>
        (e.from === edge.from && e.to === edge.to) ||
        (e.from === edge.to && e.to === edge.from));
      if (inMst) return '#10b981';
      // Kruskal: highlight current considered edge
      if (algo === 'kruskal' && curStep.edge) {
        if ((curStep.edge.from === edge.from && curStep.edge.to === edge.to) ||
            (curStep.edge.from === edge.to && curStep.edge.to === edge.from)) {
          return curStep.type === 'skip' ? '#ef4444' : '#f59e0b';
        }
      }
      // Prim: highlight current considered edge
      if (algo === 'prim' && curStep.from && curStep.to) {
        if ((curStep.from === edge.from && curStep.to === edge.to) ||
            (curStep.from === edge.to && curStep.to === edge.from)) {
          return curStep.type === 'skip' ? '#ef4444' : '#f59e0b';
        }
      }
    }

    if (curStep.type === 'negativeCycle' &&
        ((curStep.from === edge.from && curStep.to === edge.to) ||
         (curStep.from === edge.to && curStep.to === edge.from))) return '#ef4444';

    if (curStep.from && curStep.to) {
      if ((curStep.from === edge.from && curStep.to === edge.to) ||
          (curStep.from === edge.to && curStep.to === edge.from)) return '#f59e0b';
    }

    return '#1e2d3d';
  }

  function stepDesc(s) {
    if (!s) return 'Nhấn ▶ để chạy thuật toán';
    if (s.type === 'visit')   return `Thăm nút ${s.node}`;
    if (s.type === 'process') return `Xử lý nút ${s.node}`;
    if (s.type === 'discover') return `Phát hiện ${s.to} từ ${s.from}`;
    if (s.type === 'push')    return `Đẩy ${s.to} vào Stack`;
    if (s.type === 'init')    return s.desc || `Khởi tạo: dist[${s.current}]=0, còn lại=∞`;
    if (s.type === 'relax')   return `Thư giãn cạnh ${s.from}→${s.to}: ${s.candidate} < ${s.current} ?`;
    if (s.type === 'update')  return `Cập nhật dist[${s.node}] = ${s.dist} ${s.iteration ? `(vòng ${s.iteration})` : ''}`;
    if (s.type === 'consider') return s.desc || `Xét cạnh ${s.from}→${s.to} (w=${s.cost ?? s.edge?.weight})`;
    if (s.type === 'add')     return s.desc || `✓ Thêm cạnh ${s.from ?? s.edge?.from}→${s.to ?? s.edge?.to} vào MST`;
    if (s.type === 'skip')    return s.desc || `✗ Bỏ qua (tạo chu trình)`;
    if (s.type === 'enqueue') return s.desc || `Thêm cạnh ${s.from}→${s.to} (w=${s.cost}) vào PQ`;
    if (s.type === 'negativeCycle') return `⚠ Phát hiện chu trình âm: ${s.from}→${s.to}`;
    if (s.type === 'done')    return s.desc || (s.hasNegCycle ? '⚠ Có chu trình âm!' : '✓ Hoàn thành!');
    if (s.type === 'phase')   return s.desc || `Pha ${s.phase}`;
    if (s.type === 'visit1')  return s.desc || `[Pha 1] Thăm ${s.node}`;
    if (s.type === 'visit2')  return s.desc || `[Pha 2] Thăm ${s.node}`;
    if (s.type === 'finish')  return s.desc || `Kết thúc ${s.node}`;
    if (s.type === 'scc_found') return s.desc || `✓ SCC: {${s.scc?.join(',')}}`;
    if (s.type === 'cycle')   return s.desc || `⚠ Phát hiện chu trình!`;
    if (s.type === 'indegree') return s.desc || `In-degree: ...`;
    if (s.type === 'init_queue') return s.desc || `Queue khởi đầu: [${s.queue?.join(',')}]`;
    if (s.type === 'process') return s.desc || `Lấy ${s.node} ra khỏi queue`;
    if (s.type === 'reduce')  return s.desc || `Giảm in-degree[${s.to}]`;
    if (s.type === 'enqueue') return s.desc || `Thêm ${s.node} vào queue`;
    return s.desc || '';
  }

  const showQueue = algo === 'bfs';
  const showStack = algo === 'dfs';
  const showPQ    = algo === 'dijkstra' || algo === 'prim';
  const showTopo  = algo === 'topoDFS' || algo === 'topoKahn';
  const showSCC   = algo === 'kosaraju';
  const showIter  = algo === 'bellmanFord';

  const queueItems = curStep?.queue || [];
  const stackItems = curStep?.stack || [];
  const pqItems    = curStep?.pq    || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Graph Algorithms</h1>
        <p>BFS, DFS, Dijkstra, Bellman-Ford, Kruskal, Prim — vẽ đồ thị và xem từng bước</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button key={k} className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => { setAlgo(k); setCurStep(null); setSteps([]); }}>
            {v.name}
          </button>
        ))}
      </div>

      <div className="graph-workspace">
        <div className="graph-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep)}</span>
          </div>

          <svg ref={svgRef} width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="graph-svg"
            onClick={handleSVGClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: addMode === 'node' ? 'crosshair' : 'default' }}>
            {graph.edges.map((e, i) => {
              const fn = graph.nodes.find(n => n.id === e.from);
              const tn = graph.nodes.find(n => n.id === e.to);
              if (!fn || !tn) return null;
              const mx = (fn.x + tn.x) / 2, my = (fn.y + tn.y) / 2;
              const col = edgeColor(e);
              return (
                <g key={i}>
                  <line x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y}
                    stroke={col} strokeWidth={col !== '#1e2d3d' ? 2.5 : 1.5} />
                  <text x={mx} y={my - 5} textAnchor="middle" fill="#4a6b8a" fontSize="10" fontFamily="monospace">
                    {e.weight}
                  </text>
                </g>
              );
            })}
            {graph.nodes.map((n, i) => (
              <g key={i} onMouseDown={e => handleMouseDown(e, n.id)}
                style={{ cursor: addMode === 'edge' ? 'pointer' : 'grab' }}>
                <circle cx={n.x} cy={n.y} r={20}
                  fill={nodeColor(n.id)}
                  stroke={pending === n.id ? '#f59e0b' : '#0a0e1a'}
                  strokeWidth={pending === n.id ? 3 : 2} />
                <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize="12" fontWeight="700" fontFamily="monospace">
                  {n.id}
                </text>
              </g>
            ))}
          </svg>

          {/* Data structure panel */}
          {(showQueue || showStack || showPQ || showIter) && (
            <div className="graph-ds-panel">
              {showQueue && (
                <div className="ds-box">
                  <div className="ds-title">Queue (FIFO)</div>
                  <div className="ds-queue-row">
                    <span className="ds-ptr">FRONT</span>
                    {queueItems.length === 0 && <span className="ds-empty">rỗng</span>}
                    {queueItems.map((v, i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`}>{v}</div>
                    ))}
                    {queueItems.length > 0 && <span className="ds-ptr">REAR</span>}
                  </div>
                </div>
              )}
              {showStack && (
                <div className="ds-box">
                  <div className="ds-title">Stack (LIFO)</div>
                  <div className="ds-queue-row">
                    <span className="ds-ptr">TOP</span>
                    {stackItems.length === 0 && <span className="ds-empty">rỗng</span>}
                    {[...stackItems].reverse().map((v, i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`}>{v}</div>
                    ))}
                  </div>
                </div>
              )}
              {showPQ && (
                <div className="ds-box">
                  <div className="ds-title">
                    {algo === 'prim' ? 'Priority Queue — Prim' : 'Priority Queue (Min-Heap)'}
                  </div>
                  <div className="ds-queue-row">
                    <span className="ds-ptr">MIN</span>
                    {pqItems.length === 0 && <span className="ds-empty">rỗng</span>}
                    {[...pqItems].sort((a, b) => a[0] - b[0]).map(([cost, from, to], i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`}>
                        {algo === 'prim'
                          ? <><span>{from}→{to}</span><span className="ds-cell-sub">w={cost}</span></>
                          : <><span>{from}</span><span className="ds-cell-sub">{cost === Infinity ? '∞' : cost}</span></>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {showIter && curStep?.iteration && (
                <div className="ds-box">
                  <div className="ds-title">Bellman-Ford — Vòng lặp {curStep.iteration}/{graph.nodes.length - 1}</div>
                  <div className="ds-dist-row">
                    {curStep.dist && Object.entries(curStep.dist).map(([k, v]) => (
                      <div key={k} className="ds-dist-cell">
                        <span className="ds-dist-node">{k}</span>
                        <span className="ds-dist-val">{v === Infinity ? '∞' : v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {showSCC && curStep?.sccs && curStep.sccs.length > 0 && (
            <div className="graph-ds-panel">
              <div className="ds-box">
                <div className="ds-title">Strongly Connected Components</div>
                <div className="ds-queue-row" style={{flexWrap:'wrap', gap:6}}>
                  {curStep.sccs.map((scc, i) => (
                    <div key={i} className="ds-cell" style={{borderColor: ['#f43f5e','#f97316','#a78bfa','#10b981','#58a6ff'][i%5], flexDirection:'row', gap:4}}>
                      <span style={{fontSize:9,color:'#4a6b8a'}}>SCC{i+1}:</span>
                      <span>{'{' + scc.join(',') + '}'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showTopo && curStep?.order && curStep.order.length > 0 && (
            <div className="graph-ds-panel">
              <div className="ds-box">
                <div className="ds-title">
                  Thứ tự topo {curStep.hasCycle ? <span style={{color:'#ef4444'}}>⚠ Có chu trình!</span> : ''}
                </div>
                <div className="ds-queue-row">
                  {curStep.order.map((v, i) => (
                    <div key={i} className="ds-cell" style={{borderColor: i === curStep.order.length-1 ? '#8b5cf6' : '#1e3a5f'}}>
                      {v}
                      {i < curStep.order.length-1 && <span style={{color:'#4a6b8a',fontSize:9}}>→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="dist-table">
            {(algo === 'dijkstra' || algo === 'bellmanFord') && curStep?.dist &&
              Object.entries(curStep.dist).map(([k, v]) => (
                <span key={k} className="dist-cell">
                  {k}: {v === Infinity ? '∞' : v}
                </span>
              ))
            }
            {(algo === 'kruskal' || algo === 'prim') && curStep?.mst && (
              <span className="dist-cell">
                MST: {curStep.mst.length} cạnh
                {curStep.mst.length > 0 && ` | tổng = ${curStep.mst.reduce((s, e) => s + e.weight, 0)}`}
              </span>
            )}
          </div>
        </div>

        <div className="graph-sidebar">
          <div className="ctrl-section">
            <h3>Vẽ đồ thị</h3>
            <div className="mode-btns">
              <button className={`mode-btn ${addMode === 'node' ? 'active' : ''}`}
                onClick={() => setAddMode(m => m === 'node' ? null : 'node')}>
                + Nút
              </button>
              <button className={`mode-btn ${addMode === 'edge' ? 'active' : ''}`}
                onClick={() => { setAddMode(m => m === 'edge' ? null : 'edge'); setPending(null); }}>
                ⟶ Cạnh
              </button>
              <button className="mode-btn danger"
                onClick={() => { setGraph(defaultGraph()); setCurStep(null); setSteps([]); setPending(null); setAddMode(null); }}>
                Reset
              </button>
            </div>
            {addMode === 'edge' && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#4a6b8a' }}>Trọng số:</span>
                <input type="number" value={newEdgeWeight} min="1"
                  onChange={e => setNewEdgeWeight(parseInt(e.target.value) || 1)}
                  className="arr-input" style={{ width: 60 }} />
              </div>
            )}
            {addMode === 'edge' && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>
                {pending ? `Chọn nút đến (đang từ ${pending})` : 'Click vào nút bắt đầu cạnh'}
              </div>
            )}
          </div>

          <div className="ctrl-section">
            <h3>Chạy thuật toán</h3>
            {ALGOS[algo].needsStart && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#4a6b8a' }}>Nút bắt đầu:</span>
                <select value={start} onChange={e => setStart(e.target.value)}
                  className="arr-input" style={{ width: '100%', marginTop: 4 }}>
                  {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                </select>
              </div>
            )}
            <button className="btn-generate" style={{ width: '100%' }} onClick={runAlgo}>
              ▶ Chạy {ALGOS[algo].name}
            </button>
          </div>

          {algo === 'bellmanFord' && (
            <div className="ctrl-section">
              <h3>Bellman-Ford</h3>
              <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
                Chạy <b style={{ color: '#a78bfa' }}>|V|-1</b> vòng lặp, thư giãn tất cả cạnh.<br />
                Phát hiện <b style={{ color: '#ef4444' }}>chu trình âm</b> ở vòng thứ |V|.<br />
                Hỗ trợ cạnh có trọng số âm (khác Dijkstra).
              </div>
            </div>
          )}

          {algo === 'prim' && (
            <div className="ctrl-section">
              <h3>Prim's Algorithm</h3>
              <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
                Bắt đầu từ 1 nút, tham lam chọn cạnh nhỏ nhất nối vào MST.<br />
                Dùng <b style={{ color: '#10b981' }}>Priority Queue</b>.<br />
                O(E log V) — tốt cho đồ thị dày.
              </div>
            </div>
          )}

          {algo === 'kosaraju' && (
            <div className="ctrl-section">
              <h3>Kosaraju-Sharir (SCC)</h3>
              <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
                <b style={{color:'#f43f5e'}}>Pha 1:</b> DFS đồ thị gốc, ghi thứ tự finish.<br/>
                <b style={{color:'#f43f5e'}}>Pha 2:</b> DFS đồ thị đảo ngược theo thứ tự finish giảm.<br/>
                Mỗi lần DFS pha 2 = 1 SCC. O(V+E).
              </div>
            </div>
          )}

          {(algo === 'topoDFS' || algo === 'topoKahn') && (
            <div className="ctrl-section">
              <h3>Topological Sort</h3>
              <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
                {algo === 'topoDFS'
                  ? <><b style={{color:'#8b5cf6'}}>DFS-based:</b> Đẩy vào stack khi kết thúc DFS, đọc ngược lại.</>
                  : <><b style={{color:'#06b6d4'}}>Kahn:</b> Dùng in-degree, bắt đầu từ nút bậc vào = 0.</>
                }<br/>
                Chỉ áp dụng cho DAG (đồ thị có hướng không có chu trình).
              </div>
            </div>
          )}

          <div className="ctrl-section">
            <h3>Thông tin</h3>
            <div style={{ fontSize: 12, color: '#8b9eb5', lineHeight: 1.8 }}>
              <div>Số nút: {graph.nodes.length}</div>
              <div>Số cạnh: {graph.edges.length}</div>
              {curStep?.visited && <div>Đã thăm: {curStep.visited.size} nút</div>}
              {curStep?.inMST  && <div>Trong MST: {curStep.inMST.size} nút</div>}
              {curStep?.mst    && <div>MST cạnh: {curStep.mst.length}</div>}
            </div>
          </div>
        </div>
      </div>

      <Controls
        playing={playing}
        onPlay={() => { setPlaying(true); engineRef.current?.play(); }}
        onPause={() => { setPlaying(false); engineRef.current?.pause(); }}
        onReset={() => { setPlaying(false); engineRef.current?.reset(); setStepIdx(0); setCurStep(null); }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed} onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx} total={steps.length}
      />
    </div>
  );
}
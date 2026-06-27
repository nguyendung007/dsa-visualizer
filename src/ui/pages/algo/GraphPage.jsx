import { useState, useRef } from 'react';
import { bfs, dfs, dijkstra, kruskal, bellmanFord, prim, kosaraju, topoSortDFS, topoSortKahn, aStar, bestFirstSearch, heuristicManhattan, heuristicEuclidean, beamSearch, tabuSearch } from '../../../core/graph/index.js';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import './GraphPage.css';

const ALGOS = {
  bfs:         { name: 'BFS',            fn: bfs,      needsStart: true,  color: '#10b981' },
  dfs:         { name: 'DFS',            fn: dfs,      needsStart: true,  color: '#f59e0b' },
  dijkstra:    { name: 'Dijkstra',       fn: dijkstra, needsStart: true,  color: '#58a6ff' },
  aStar:       { name: 'A*',             fn: aStar,    needsStart: true,  color: '#f472b6' },
  bestFirst:   { name: 'Best-First',     fn: bestFirstSearch, needsStart: true, color: '#34d399' },
  bellmanFord: { name: 'Bellman-Ford',   fn: bellmanFord, needsStart: true,  color: '#a78bfa' },
  kruskal:     { name: 'Kruskal (MST)',  fn: kruskal,  needsStart: false, color: '#f97316' },
  prim:        { name: 'Prim (MST)',     fn: prim,     needsStart: true,  color: '#10b981' },
  kosaraju:    { name: 'Kosaraju (SCC)', fn: kosaraju, needsStart: false, color: '#f43f5e' },
  topoDFS:     { name: 'Topo Sort (DFS)',fn: topoSortDFS, needsStart: false, color: '#8b5cf6' },
  topoKahn:    { name: 'Topo (Kahn)',    fn: topoSortKahn, needsStart: false, color: '#06b6d4' },
  beam:        { name: 'Beam Search',   fn: beamSearch, needsStart: true, color: '#fbbf24' },
  tabu:        { name: 'Tabu Search',   fn: tabuSearch, needsStart: true, color: '#f87171' },
};

function defaultGraph() { return { nodes: [], edges: [] }; }

function buildAdjList(nodes, edges) {
  const g = {};
  nodes.forEach(n => g[n.id] = []);
  edges.forEach(e => {
    g[e.from].push({ to: e.to, weight: e.weight });
    g[e.to].push({ to: e.from, weight: e.weight });
  });
  return g;
}

// Hàm heuristic cho A* (dựa trên tọa độ node)
function getHeuristicForAStar(goal, nodes, type) {
  const coordMap = {};
  nodes.forEach(n => {
    coordMap[n.id] = { x: n.x, y: n.y };
  });
  
  return function(node, goal) {
    if (!coordMap[node] || !coordMap[goal]) return 0;
    const dx = Math.abs(coordMap[node].x - coordMap[goal].x);
    const dy = Math.abs(coordMap[node].y - coordMap[goal].y);
    
    if (type === 'euclidean') {
      return Math.sqrt(dx*dx + dy*dy);
    } else { // manhattan
      return dx + dy;
    }
  };
}

export default function GraphPage() {
  const [algo, setAlgo]               = useState('bfs');
  const [graph, setGraph]             = useState(defaultGraph);
  const [start, setStart]             = useState('A');
  const [goal, setGoal]               = useState('B');
  const [steps, setSteps]             = useState([]);
  const [stepIdx, setStepIdx]         = useState(0);
  const [curStep, setCurStep]         = useState(null);
  const [playing, setPlaying]         = useState(false);
  const [speed, setSpeed]             = useState(400);
  const [addMode, setAddMode]         = useState(null);
  const [pending, setPending]         = useState(null);
  const [newEdgeWeight, setNewEdgeWeight] = useState(1);
  const [dragging, setDragging]       = useState(null);
  const svgRef                        = useRef(null);
  const engineRef                     = useRef(null);
  const { saveProgress }              = useProgress();
  const [heuristicType, setHeuristicType] = useState('manhattan');
  const svgW = 600, svgH = 320;

  function getSVGPos(e) {
  const svg = svgRef.current;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: svgP.x, y: svgP.y };
}

  function handleSVGClick(e) {
    const pos = getSVGPos(e);
    const hit = graph.nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < 26);
    if (addMode === 'node' && !hit) {
      const id = String.fromCharCode(65 + graph.nodes.length);
      setGraph(g => ({ ...g, nodes: [...g.nodes, { id, x: pos.x, y: pos.y }] }));
      return;
    }
  }

  function handleNodeClickForEdge(nodeId) {
  if (!pending) {
    setPending(nodeId);
  } else if (pending !== nodeId) {
    const isDuplicate = graph.edges.some(e =>
      (e.from === pending && e.to === nodeId) ||
      (e.from === nodeId  && e.to === pending)
    );
    if (!isDuplicate) {
      setGraph(g => ({ ...g, edges: [...g.edges, { from: pending, to: nodeId, weight: newEdgeWeight }] }));
    }
    setPending(null);
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

  function setMode(mode) {
    setAddMode(m => m === mode ? null : mode);
    setPending(null);
  }

  function runAlgo() {
    engineRef.current?.pause();
    const adj = buildAdjList(graph.nodes, graph.edges);
    let s;
    const nodeIds = graph.nodes.map(n => n.id);
    
    if (algo === 'kruskal') {
      s = kruskal(nodeIds, graph.edges);
    } else if (algo === 'bellmanFord') {
      s = bellmanFord(adj, nodeIds, start);
    } else if (algo === 'prim') {
      s = prim(adj, nodeIds, start);
    } else if (algo === 'kosaraju') {
      s = kosaraju(adj, nodeIds);
    } else if (algo === 'topoDFS') {
      s = topoSortDFS(adj, nodeIds);
    } else if (algo === 'topoKahn') {
      s = topoSortKahn(adj, nodeIds);
    } else if (algo === 'aStar') {
      // Tạo heuristic dựa trên tọa độ các node
      const heuristic = getHeuristicForAStar(goal, graph.nodes, heuristicType);
      s = aStar(adj, start, goal, heuristic);
    } else if (algo === 'bestFirst') {  // Thêm case này
    const heuristic = getHeuristicForAStar(goal, graph.nodes, heuristicType);
    s = bestFirstSearch(adj, start, goal, heuristic);
  }   else if (algo === 'beam') {
    const heuristic = getHeuristicForAStar(goal, graph.nodes, heuristicType);
    s = beamSearch(adj, start, goal, 3, heuristic); // beamWidth = 3
  } else if (algo === 'tabu') {
    const heuristic = getHeuristicForAStar(goal, graph.nodes, heuristicType);
    s = tabuSearch(adj, start, goal, 50, 10, heuristic); // maxIterations=50, tabuSize=10
  }
     else {
      s = ALGOS[algo].fn(adj, start);
    }

    setSteps(s); setStepIdx(0); setCurStep(null);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
    saveProgress('graph', ALGOS[algo].name);
  }

  const SCC_COLORS = ['#f43f5e','#f97316','#a78bfa','#10b981','#58a6ff','#eab308','#06b6d4','#ec4899'];

  function nodeColor(id) {
  if (!curStep) return '#1d4ed8';
  
  // Màu cho Best-First Search (tương tự A*)
  if (algo === 'bestFirst') {
    if (curStep.type === 'goal_found' && curStep.path?.includes(id)) return '#10b981';
    if (curStep.type === 'done' && curStep.path?.includes(id)) return '#10b981';
    if (curStep.closedSet?.includes?.(id)) return '#f43f5e';
    if (curStep.openSet?.includes?.(id)) return '#f59e0b';
    if (curStep.node === id) return '#34d399';
    return '#1e3a5f';
  }
    
    // Màu cho A*
    if (algo === 'aStar') {
      if (curStep.type === 'goal_found' && curStep.path?.includes(id)) return '#10b981';
      if (curStep.type === 'done' && curStep.path?.includes(id)) return '#10b981';
      if (curStep.closedSet?.includes?.(id)) return '#f43f5e';
      if (curStep.openSet?.includes?.(id)) return '#f59e0b';
      if (curStep.node === id) return '#f472b6';
      return '#1e3a5f';
    }
    
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
    if (showTopo) {
      if (curStep.order?.includes(id)) return '#10b981';
      if (curStep.node === id) return '#f59e0b';
    }
    if (curStep.type === 'negativeCycle' && (curStep.from === id || curStep.to === id)) return '#ef4444';
    if (curStep.node === id)      return '#f59e0b';
    if (curStep.inMST?.has(id))   return '#10b981';
    if (curStep.visited?.has(id)) return '#10b981';
    if (curStep.from === id)      return '#f59e0b';
    if (curStep.to === id)        return '#ef4444';
    return '#1e3a5f';
  }

  function edgeColor(edge) {
    if (!curStep) return '#f50b0b';

    if (algo === 'bestFirst') {
    if (curStep.type === 'goal_found' && curStep.path) {
      for (let i = 0; i < curStep.path.length - 1; i++) {
        if ((curStep.path[i] === edge.from && curStep.path[i+1] === edge.to) ||
            (curStep.path[i] === edge.to && curStep.path[i+1] === edge.from)) {
          return '#10b981';
        }
      }
    }
    if (curStep.type === 'done' && curStep.path) {
      for (let i = 0; i < curStep.path.length - 1; i++) {
        if ((curStep.path[i] === edge.from && curStep.path[i+1] === edge.to) ||
            (curStep.path[i] === edge.to && curStep.path[i+1] === edge.from)) {
          return '#10b981';
        }
      }
    }
    if (curStep.from === edge.from && curStep.to === edge.to) {
      return curStep.type === 'discover' ? '#f59e0b' : '#34d399';
    }
    return '#1e2d3d';
  }
    
    // Màu cho A*
    if (algo === 'aStar') {
      if (curStep.type === 'goal_found' && curStep.path) {
        for (let i = 0; i < curStep.path.length - 1; i++) {
          if ((curStep.path[i] === edge.from && curStep.path[i+1] === edge.to) ||
              (curStep.path[i] === edge.to && curStep.path[i+1] === edge.from)) {
            return '#10b981';
          }
        }
      }
      if (curStep.type === 'done' && curStep.path) {
        for (let i = 0; i < curStep.path.length - 1; i++) {
          if ((curStep.path[i] === edge.from && curStep.path[i+1] === edge.to) ||
              (curStep.path[i] === edge.to && curStep.path[i+1] === edge.from)) {
            return '#10b981';
          }
        }
      }
      if (curStep.from === edge.from && curStep.to === edge.to) {
        return curStep.type === 'relax' ? '#f59e0b' : '#f472b6';
      }
      if (curStep.from === edge.to && curStep.to === edge.from) {
        return curStep.type === 'relax' ? '#f59e0b' : '#f472b6';
      }
      return '#1e2d3d';
    }
    
    if ((algo === 'kruskal' || algo === 'prim') && curStep.mst) {
      const inMst = curStep.mst.some(e =>
        (e.from === edge.from && e.to === edge.to) ||
        (e.from === edge.to   && e.to === edge.from));
      if (inMst) return '#10b981';
      if (algo === 'kruskal' && curStep.edge) {
        if ((curStep.edge.from === edge.from && curStep.edge.to === edge.to) ||
            (curStep.edge.from === edge.to   && curStep.edge.to === edge.from))
          return curStep.type === 'skip' ? '#ef4444' : '#f59e0b';
      }
      if (algo === 'prim' && curStep.from && curStep.to) {
        if ((curStep.from === edge.from && curStep.to === edge.to) ||
            (curStep.from === edge.to   && curStep.to === edge.from))
          return curStep.type === 'skip' ? '#ef4444' : '#f59e0b';
      }
    }
    if (curStep.type === 'negativeCycle' &&
        ((curStep.from === edge.from && curStep.to === edge.to) ||
         (curStep.from === edge.to   && curStep.to === edge.from))) return '#ef4444';
    if (curStep.from && curStep.to) {
      if ((curStep.from === edge.from && curStep.to === edge.to) ||
          (curStep.from === edge.to   && curStep.to === edge.from)) return '#f59e0b';
    }
    return '#1e2d3d';
  }

  function stepDesc(s) {
    if (!s) return 'Nhấn ▶ để chạy thuật toán';

    if (algo === 'bestFirst') {
    if (s.type === 'init') return `Khởi tạo: bắt đầu từ ${s.start} → ${s.goal}`;
    if (s.type === 'process') return `Xử lý nút ${s.node} (heuristic=${s.fScore?.[s.node]})`;
    if (s.type === 'discover') return `Khám phá ${s.node} từ ${s.from} (h=${s.fScore})`;
    if (s.type === 'goal_found') return `✓ Tìm thấy đường đi đến ${s.goal}!`;
    if (s.type === 'no_path') return `Không tìm thấy đường đi từ ${s.start} đến ${s.goal}`;
    if (s.type === 'done') return `Hoàn thành!`;
    return s.desc || '';
  }
    
    // Mô tả cho A*
    if (algo === 'aStar') {
      if (s.type === 'init') return `Khởi tạo: bắt đầu từ ${s.start} → ${s.goal}`;
      if (s.type === 'process') return `Xử lý nút ${s.node} (g=${s.gScore?.[s.node]}, f=${s.fScore?.[s.node]})`;
      if (s.type === 'relax') return `Xét cạnh ${s.from}→${s.to} (w=${s.weight}): g=${s.tentativeG}`;
      if (s.type === 'update') return `Cập nhật ${s.node}: g=${s.gScore}, f=${s.fScore} (từ ${s.from})`;
      if (s.type === 'goal_found') return `✓ Tìm thấy đường đi đến ${s.goal}! Độ dài: ${(s.path?.length || 0) - 1} bước`;
      if (s.type === 'no_path') return `Không tìm thấy đường đi từ ${s.start} đến ${s.goal}`;
      if (s.type === 'done') return s.desc || `Hoàn thành!`;
      return s.desc || '';
    }
    
    if (s.type === 'visit')         return `Thăm nút ${s.node}`;
    if (s.type === 'process')       return `Xử lý nút ${s.node}`;
    if (s.type === 'discover')      return `Phát hiện ${s.to} từ ${s.from}`;
    if (s.type === 'push')          return `Đẩy ${s.to} vào Stack`;
    if (s.type === 'init')          return s.desc || `Khởi tạo: dist[${s.current}]=0, còn lại=∞`;
    if (s.type === 'relax')         return `Thư giãn cạnh ${s.from}→${s.to}: ${s.candidate} < ${s.current} ?`;
    if (s.type === 'update')        return `Cập nhật dist[${s.node}] = ${s.dist} ${s.iteration ? `(vòng ${s.iteration})` : ''}`;
    if (s.type === 'consider')      return s.desc || `Xét cạnh ${s.from}→${s.to} (w=${s.cost ?? s.edge?.weight})`;
    if (s.type === 'add')           return s.desc || `✓ Thêm cạnh ${s.from ?? s.edge?.from}→${s.to ?? s.edge?.to} vào MST`;
    if (s.type === 'skip')          return s.desc || `✗ Bỏ qua (tạo chu trình)`;
    if (s.type === 'enqueue')       return s.desc || `Thêm cạnh ${s.from}→${s.to} (w=${s.cost}) vào PQ`;
    if (s.type === 'negativeCycle') return `⚠ Phát hiện chu trình âm: ${s.from}→${s.to}`;
    if (s.type === 'done')          return s.desc || (s.hasNegCycle ? '⚠ Có chu trình âm!' : '✓ Hoàn thành!');
    if (s.type === 'phase')         return s.desc || `Pha ${s.phase}`;
    if (s.type === 'visit1')        return s.desc || `[Pha 1] Thăm ${s.node}`;
    if (s.type === 'visit2')        return s.desc || `[Pha 2] Thăm ${s.node}`;
    if (s.type === 'finish')        return s.desc || `Kết thúc ${s.node}`;
    if (s.type === 'scc_found')     return s.desc || `✓ SCC: {${s.scc?.join(',')}}`;
    if (s.type === 'cycle')         return s.desc || `⚠ Phát hiện chu trình!`;
    if (s.type === 'indegree')      return s.desc || `In-degree: ...`;
    if (s.type === 'init_queue')    return s.desc || `Queue khởi đầu: [${s.queue?.join(',')}]`;
    if (s.type === 'reduce')        return s.desc || `Giảm in-degree[${s.to}]`;
    return s.desc || '';
  }

  const showQueue = algo === 'bfs';
  const showStack = algo === 'dfs';
  const showPQ    = algo === 'dijkstra' || algo === 'prim';
  const showTopo  = algo === 'topoDFS'  || algo === 'topoKahn';
  const showSCC   = algo === 'kosaraju';
  const showIter  = algo === 'bellmanFord';
  const showAStar  = algo === 'aStar';
  const showBestFirst = algo === 'bestFirst';

  return (
    <div className="page">
      <div className="page-header">
        <h1>Graph Algorithms</h1>
        <p>BFS, DFS, Dijkstra, A*, Bellman-Ford, Kruskal, Prim — vẽ đồ thị và xem từng bước</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button key={k} className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => {
              setAlgo(k);
              setCurStep(null); setSteps([]); setStepIdx(0); setPlaying(false);
              engineRef.current?.pause();
            }}>
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
            onClick={handleSVGClick} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
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
                    stroke={col} strokeWidth={col !== '#0a0a0a' ? 4.5 : 2.5} />
                  <text x={mx} y={my - 15} textAnchor="middle" fill="#4a6b8a" fontSize="20" fontFamily="monospace">
                    {e.weight}
                  </text>
                </g>
              );
            })}
            {graph.nodes.map((n, i) => (
              <g key={i} onMouseDown={e => {
    if (addMode === 'edge') {
      e.stopPropagation();
      handleNodeClickForEdge(n.id);
      return;
    }
    handleMouseDown(e, n.id);
  }}
  style={{ cursor: addMode === 'edge' ? 'pointer' : 'grab' }}>
                <circle cx={n.x} cy={n.y} r={20} fill={nodeColor(n.id)} stroke="#ffffff"
                  strokeWidth={pending === n.id ? 3 : 2} />
                <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize="12" fontWeight="700" fontFamily="monospace">{n.id}</text>
              </g>
            ))}
          </svg>

          {(showQueue || showStack || showPQ || showIter || showAStar || showBestFirst) && (
            <div className="graph-ds-panel">
              {showQueue && (
                <div className="ds-box">
                  <div className="ds-title">Queue (FIFO)</div>
                  <div className="ds-queue-row">
                    <span className="ds-ptr">FRONT</span>
                    {(curStep?.queue || []).length === 0 && <span className="ds-empty">rỗng</span>}
                    {(curStep?.queue || []).map((v, i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`}>{v}</div>
                    ))}
                    {(curStep?.queue || []).length > 0 && <span className="ds-ptr">REAR</span>}
                  </div>
                </div>
              )}
              {showStack && (
                <div className="ds-box">
                  <div className="ds-title">Stack (LIFO)</div>
                  <div className="ds-queue-row">
                    <span className="ds-ptr">TOP</span>
                    {(curStep?.stack || []).length === 0 && <span className="ds-empty">rỗng</span>}
                    {[...(curStep?.stack || [])].reverse().map((v, i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`}>{v}</div>
                    ))}
                  </div>
                </div>
              )}
              {showPQ && (
                <div className="ds-box">
                  <div className="ds-title">{algo === 'prim' ? 'Priority Queue — Prim' : 'Priority Queue (Min-Heap)'}</div>
                  <div className="ds-queue-row">
                    <span className="ds-ptr">MIN</span>
                    {(curStep?.pq || []).length === 0 && <span className="ds-empty">rỗng</span>}
                    {[...(curStep?.pq || [])].sort((a, b) => a[0] - b[0]).map(([cost, from, to], i) => (
                      <div key={i} className={`ds-cell ${i === 0 ? 'ds-front' : ''}`}>
                        {algo === 'prim'
                          ? <><span>{from}→{to}</span><span className="ds-cell-sub">w={cost}</span></>
                          : <><span>{from}</span><span className="ds-cell-sub">{cost === Infinity ? '∞' : cost}</span></>}
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
              {showAStar && (
                <div className="ds-box">
                  <div className="ds-title">A* — g-score &amp; f-score</div>
                  <div className="ds-dist-row">
                    {curStep?.gScore && Object.entries(curStep.gScore).map(([k, v]) => (
                      <div key={k} className="ds-dist-cell" style={{
                        borderColor: curStep.closedSet?.includes?.(k) ? '#f43f5e' : 
                                     curStep.openSet?.includes?.(k) ? '#f59e0b' : '#1e3a5f'
                      }}>
                        <span className="ds-dist-node">{k}</span>
                        <span className="ds-dist-val" style={{ fontSize: 10 }}>
                          g={v === Infinity ? '∞' : v}
                          {curStep.fScore && <>, f={curStep.fScore[k] === Infinity ? '∞' : curStep.fScore[k]}</>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {showBestFirst && (
      <div className="ds-box">
        <div className="ds-title">Best-First — Heuristic (h-score)</div>
        <div className="ds-dist-row">
          {curStep?.fScore && Object.entries(curStep.fScore).map(([k, v]) => (
            <div key={k} className="ds-dist-cell" style={{
              borderColor: curStep.closedSet?.includes?.(k) ? '#f43f5e' : 
                           curStep.openSet?.includes?.(k) ? '#f59e0b' : '#1e3a5f'
            }}>
              <span className="ds-dist-node">{k}</span>
              <span className="ds-dist-val">
                h={v === Infinity ? '∞' : v}
              </span>
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
                <div className="ds-queue-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {curStep.sccs.map((scc, i) => (
                    <div key={i} className="ds-cell"
                      style={{ borderColor: ['#f43f5e','#f97316','#a78bfa','#10b981','#58a6ff'][i%5], flexDirection: 'row', gap: 4 }}>
                      <span style={{ fontSize: 9, color: '#4a6b8a' }}>SCC{i+1}:</span>
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
                  Thứ tự topo {curStep.hasCycle ? <span style={{ color: '#ef4444' }}>⚠ Có chu trình!</span> : ''}
                </div>
                <div className="ds-queue-row">
                  {curStep.order.map((v, i) => (
                    <div key={i} className="ds-cell"
                      style={{ borderColor: i === curStep.order.length - 1 ? '#8b5cf6' : '#1e3a5f' }}>
                      {v}{i < curStep.order.length - 1 && <span style={{ color: '#4a6b8a', fontSize: 9 }}>→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="dist-table">
            {(algo === 'dijkstra' || algo === 'bellmanFord') && curStep?.dist &&
              Object.entries(curStep.dist).map(([k, v]) => (
                <span key={k} className="dist-cell">{k}: {v === Infinity ? '∞' : v}</span>
              ))
            }
            {algo === 'aStar' && curStep?.gScore && (
              Object.entries(curStep.gScore).map(([k, v]) => (
                <span key={k} className="dist-cell" style={{
                  color: curStep.closedSet?.includes?.(k) ? '#f43f5e' : 
                         curStep.openSet?.includes?.(k) ? '#f59e0b' : '#8b9eb5'
                }}>
                  {k}: g={v === Infinity ? '∞' : v}
                  {curStep.fScore && <>, f={curStep.fScore[k] === Infinity ? '∞' : curStep.fScore[k]}</>}
                </span>
              ))
            )}
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
                onClick={() => setMode('node')}>+ Nút</button>
              <button className={`mode-btn ${addMode === 'edge' ? 'active' : ''}`}
                onClick={() => setMode('edge')}>⟶ Cạnh</button>
              <button className="mode-btn danger"
                onClick={() => {
                  setGraph(defaultGraph());
                  setCurStep(null); setSteps([]); setStepIdx(0);
                  setPlaying(false); setPending(null); setAddMode(null);
                  engineRef.current?.pause();
                }}>Reset</button>
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
            {algo === 'aStar' && (
  <>
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: '#4a6b8a' }}>Nút đích:</span>
      <select value={goal} onChange={e => setGoal(e.target.value)}
        className="arr-input" style={{ width: '100%', marginTop: 4 }}>
        {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
      </select>
    </div>
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: '#4a6b8a' }}>Hàm Heuristic:</span>
      <select value={heuristicType} onChange={e => setHeuristicType(e.target.value)}
        className="arr-input" style={{ width: '100%', marginTop: 4 }}>
        <option value="euclidean">Euclidean </option>
        <option value="manhattan">Manhattan </option>
      </select>
    </div>
  </>
)}
            
            <button className="btn-generate" style={{ width: '100%' }} onClick={runAlgo}>
              ▶ Chạy {ALGOS[algo].name}
            </button>
          </div>

          {algo === 'aStar' && (
            <div className="ctrl-section">
              <h3>A* (A-star)</h3>
              <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
                Kết hợp <b style={{ color: '#f472b6' }}>Dijkstra</b> và <b style={{ color: '#f472b6' }}>Heuristic</b>.<br />
                Dùng hàm ước lượng để ưu tiên đường đi đến đích.<br />
                <b style={{ color: '#10b981' }}>Đường màu xanh</b> là đường đi tối ưu.<br />
                <b style={{ color: '#f59e0b' }}>Vàng</b> = trong Open Set, <b style={{ color: '#f43f5e' }}>Đỏ</b> = đã xử lý.
              </div>
            </div>
          )}

          {algo === 'bestFirst' && (
  <div className="ctrl-section">
    <h3>Best-First Search</h3>
    <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
      Thuật toán <b style={{ color: '#34d399' }}>tham lam</b> chỉ dùng heuristic.<br />
      Ưu tiên mở rộng nút có <b style={{ color: '#34d399' }}>h-score</b> nhỏ nhất.<br />
      Không đảm bảo tối ưu nhưng <b style={{ color: '#34d399' }}>nhanh hơn</b> A*.<br />
      <b style={{ color: '#10b981' }}>Xanh lá</b> = đường đi tìm được.<br />
      <b style={{ color: '#f59e0b' }}>Vàng</b> = trong Open Set, <b style={{ color: '#f43f5e' }}>Đỏ</b> = đã xử lý.
    </div>
  </div>
)}
{algo === 'beam' && (
  <div className="ctrl-section">
    <h3>Beam Search</h3>
    <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
      Biến thể của <b style={{ color: '#fbbf24' }}>Best-First Search</b> với giới hạn Beam.<br />
      Chỉ giữ lại <b style={{ color: '#fbbf24' }}>K</b> node tốt nhất mỗi bước.<br />
      <b style={{ color: '#fbbf24' }}>Beam Width = 3</b> (mặc định).<br />
      Cân bằng giữa <b style={{ color: '#fbbf24' }}>tìm kiếm rộng</b> và <b style={{ color: '#fbbf24' }}>độ sâu</b>.
    </div>
  </div>
)}

{algo === 'tabu' && (
  <div className="ctrl-section">
    <h3>Tabu Search</h3>
    <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
      Thuật toán <b style={{ color: '#f87171' }}>meta-heuristic</b> tối ưu.<br />
      Dùng <b style={{ color: '#f87171' }}>danh sách Tabu</b> để tránh lặp lại.<br />
      <b style={{ color: '#f87171' }}>K=50</b> iterations, <b style={{ color: '#f87171' }}>T=10</b> kích thước tabu.<br />
      Có khả năng <b style={{ color: '#f87171' }}>thoát khỏi local optimum</b>.
    </div>
  </div>
)}

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
                Dùng <b style={{ color: '#10b981' }}>Priority Queue</b>. O(E log V).
              </div>
            </div>
          )}
          {algo === 'kosaraju' && (
            <div className="ctrl-section">
              <h3>Kosaraju-Sharir (SCC)</h3>
              <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
                <b style={{ color: '#f43f5e' }}>Pha 1:</b> DFS đồ thị gốc, ghi thứ tự finish.<br />
                <b style={{ color: '#f43f5e' }}>Pha 2:</b> DFS đồ thị đảo ngược theo thứ tự finish giảm.<br />
                Mỗi lần DFS pha 2 = 1 SCC. O(V+E).
              </div>
            </div>
          )}
          {(algo === 'topoDFS' || algo === 'topoKahn') && (
            <div className="ctrl-section">
              <h3>Topological Sort</h3>
              <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
                {algo === 'topoDFS'
                  ? <><b style={{ color: '#8b5cf6' }}>DFS-based:</b> Đẩy vào stack khi kết thúc DFS, đọc ngược lại.</>
                  : <><b style={{ color: '#06b6d4' }}>Kahn:</b> Dùng in-degree, bắt đầu từ nút bậc vào = 0.</>}
                <br />Chỉ áp dụng cho DAG.
              </div>
            </div>
          )}

          <div className="ctrl-section">
            <h3>Thông tin</h3>
            <div style={{ fontSize: 12, color: '#8b9eb5', lineHeight: 1.8 }}>
              <div>Số nút: {graph.nodes.length}</div>
              <div>Số cạnh: {graph.edges.length}</div>
              {curStep?.visited && <div>Đã thăm: {curStep.visited.size} nút</div>}
              {curStep?.inMST   && <div>Trong MST: {curStep.inMST.size} nút</div>}
              {curStep?.mst     && <div>MST cạnh: {curStep.mst.length}</div>}
              {(algo === 'aStar' || algo === 'bestFirst') && curStep?.closedSet && <div>Đã xử lý: {curStep.closedSet.size} nút</div>}
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
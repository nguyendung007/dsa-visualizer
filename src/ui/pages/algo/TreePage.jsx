import { useState, useRef, useEffect } from 'react';
import { BSTNode, bstInsert, bstDelete, avlInsert, bstFloor, bstCeil, treeToLayout } from '../../../core/trees/index.ts';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import './TreePage.css';   

const W = 680, H = 380; 

function TreeSVG({ layout, highlight, rotatingNodes, rotationPhase, nodeSize, edgeWidth, fontSize }) {
  const radius = nodeSize || 22;
  const strokeW = edgeWidth || 2;
  const textSize = fontSize || 12;
  
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="tree-svg">
      {layout.edges.map((e, i) => (
        <line key={i} x1={e.from.x} y1={e.from.y + radius} x2={e.to.x} y2={e.to.y - radius}
          stroke="#1e3a5f" strokeWidth={strokeW} />
      ))}
      {layout.nodes.map((n, i) => {
        const isRotating = rotatingNodes?.includes(n.val);
        const col = (() => {
          if (highlight[n.val] === 'comparing')   return '#f59e0b';
          if (highlight[n.val] === 'placed')      return '#10b981';
          if (highlight[n.val] === 'deleting')    return '#ef4444';
          if (highlight[n.val] === 'searching')   return '#8b5cf6';
          if (highlight[n.val] === 'path')        return '#06b6d4';
          if (highlight[n.val] === 'rotating')    return '#f97316';
          if (highlight[n.val] === 'balance_ok')  return '#10b981';
          if (highlight[n.val] === 'balance_bad') return '#ef4444';
          return '#1d4ed8';
        })();
        return (
          <g key={i} style={isRotating ? {
            animation: `${rotationPhase === 'pre' ? 'rotPre' : 'rotPost'} 0.4s ease`,
            transformOrigin: `${n.x}px ${n.y}px`, transformBox: 'fill-box'
          } : {}}>
            <circle cx={n.x} cy={n.y} r={radius} fill={col} stroke="#ffffff" strokeWidth="2.5"
              style={{ transition: 'fill 0.3s, cx 0.4s, cy 0.4s' }} />
            <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
              fill="white" fontSize={textSize} fontWeight="700" fontFamily="monospace">{n.val}</text>
            {n.h !== undefined && (
              <text x={n.x + radius + 2} y={n.y - radius + 2} textAnchor="start" fill="#4a6b8a" fontSize={Math.max(8, textSize - 3)} fontFamily="monospace">
                h={n.h}
              </text>
            )}
          </g>
        );
      })}
      {layout.nodes.length === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#1e3a5f" fontSize="14" fontFamily="monospace">
          Cây rỗng — nhập phần tử để bắt đầu
        </text>
      )}
    </svg>
  );
}

const ALGOS = {
  bst: { name: 'BST', color: '#58a6ff', desc: 'Binary Search Tree' },
  avl: { name: 'AVL Tree', color: '#f97316', desc: 'Self-balancing BST' },
};

export default function TreePage() {
  const [algo, setAlgo]                   = useState('bst');
  const [root, setRoot]                   = useState(null);
  const [insertVal, setInsertVal]         = useState('');
  const [deleteVal, setDeleteVal]         = useState('');
  const [floorVal, setFloorVal]           = useState('');
  const [ceilVal, setCeilVal]             = useState('');
  const [floorResult, setFloorResult]     = useState(null);
  const [ceilResult, setCeilResult]       = useState(null);
  const [steps, setSteps]                 = useState([]);
  const [stepIdx, setStepIdx]             = useState(0);
  const [curStep, setCurStep]             = useState(null);
  const [playing, setPlaying]             = useState(false);
  const [speed, setSpeed]                 = useState(400);
  const [log, setLog]                     = useState([]);
  const [rotatingNodes, setRotatingNodes] = useState([]);
  const [rotationPhase, setRotationPhase] = useState('');
  const [liveRoot, setLiveRoot]           = useState(null);
  
  const [nodeSize, setNodeSize]           = useState(22);
  const [edgeWidth, setEdgeWidth]         = useState(2);
  const [fontSize, setFontSize]           = useState(12);

  const engineRef = useRef(null);
  const { saveProgress } = useProgress();

  function cloneTree(node) {
    if (!node) return null;
    const n = new BSTNode(node.val);
    n.h = node.h ?? 1;
    n.left  = cloneTree(node.left);
    n.right = cloneTree(node.right);
    return n;
  }

  function getHighlight(step) {
    if (!step) return {};
    const h = {};
    if (step.comparing !== undefined) h[step.comparing] = 'comparing';
    if (step.val !== undefined && step.type === 'placed')    h[step.val] = 'placed';
    if (step.val !== undefined && step.type === 'found')     h[step.val] = 'deleting';
    if (step.val !== undefined && step.type === 'searching') h[step.val] = 'searching';
    if (step.path) step.path.forEach(v => { if (!h[v]) h[v] = 'path'; });
    if (step.type === 'pre_rotate' || step.type === 'rotate') {
      h[step.node] = 'rotating'; h[step.pivot] = 'rotating';
    }
    if (step.type === 'balance_check') {
      h[step.node] = Math.abs(step.bf) > 1 ? 'balance_bad' : 'balance_ok';
    }
    return h;
  }

  function getStepDesc(s) {
    if (!s) return 'Thêm phần tử để xem cây';
    if (s.type === 'compare')       return `So sánh ${s.val} với nút ${s.comparing}: ${s.val < s.comparing ? 'đi trái ←' : 'đi phải →'}`;
    if (s.type === 'placed')        return `✓ Đặt ${s.val} ở bên ${s.side} của nút ${s.parent}`;
    if (s.type === 'searching')     return `Tìm ${s.target} tại nút ${s.val}`;
    if (s.type === 'found')         return `✓ Tìm thấy ${s.val} — đang xóa`;
    if (s.type === 'successor')     return `→ Successor (nhỏ nhất bên phải): ${s.successor}`;
    if (s.type === 'pre_rotate')    return `⟳ Chuẩn bị xoay ${s.direction === 'right' ? 'phải' : 'trái'} — pivot: ${s.pivot}, node: ${s.node}`;
    if (s.type === 'rotate')        return `↻ Hoàn tất xoay ${s.direction === 'right' ? 'phải' : 'trái'}: ${s.pivot} lên trên ${s.node}`;
    if (s.type === 'balance_check') return `Cân bằng tại ${s.node}: BF=${s.bf} ${Math.abs(s.bf) > 1 ? '⚠ MẤT CÂN BẰNG!' : '✓'}`;
    if (s.type === 'done')          return '✓ Hoàn thành';
    if (s.type === 'update') {
      if (s.floor !== undefined) return `Floor candidate = ${s.floor}`;
      if (s.ceil  !== undefined) return `Ceil candidate = ${s.ceil}`;
    }
    if (s.type === 'exact') return s.desc || `Tìm thấy chính xác: ${s.node}`;
    return s.desc || '';
  }

  function animate(newSteps, newRoot, actionName = '') {
    engineRef.current?.pause();
    setSteps(newSteps);
    setStepIdx(0);
    setLiveRoot(cloneTree(root));  

    const eng = new AnimationEngine({
      steps: newSteps,
      speed,
      onStep: (s, idx) => {
        setCurStep(s);
        setStepIdx(idx + 1);
        if (s.tree) setLiveRoot(s.tree);
        if (s.type === 'pre_rotate') {
          setRotatingNodes([s.node, s.pivot]);
          setRotationPhase('pre');
          setTimeout(() => setRotationPhase('post'), 200);
        } else if (s.type !== 'rotate') {
          setRotatingNodes([]);
          setRotationPhase('');
        }
      },
      onDone: () => {
        setPlaying(false);
        setRoot(newRoot);
        setLiveRoot(null);
        setRotatingNodes([]);
        if (actionName) {
          saveProgress('trees', `${ALGOS[algo].name} — ${actionName}`);
        }
      },
    });
    engineRef.current = eng;
    eng.play();
    setPlaying(true);
  }

  function resetAll() {
    engineRef.current?.pause();
    setRoot(null);
    setLiveRoot(null);
    setSteps([]);
    setStepIdx(0);
    setCurStep(null);
    setPlaying(false);
    setLog([]);
    setFloorResult(null);
    setCeilResult(null);
    setRotatingNodes([]);
    setRotationPhase('');
  }

  function handleInsert() {
    const v = parseInt(insertVal);
    if (isNaN(v)) return;
    setInsertVal('');
    const s = [];
    const res = algo === 'avl'
      ? avlInsert(cloneTree(root), v, s)  
      : bstInsert(cloneTree(root), v, s);
    setLog(prev => [`Chèn ${v} vào ${ALGOS[algo].name}`, ...prev.slice(0, 9)]);
    animate(s, res.root, `Insert ${v}`);
  }

  function handleDelete() {
    const v = parseInt(deleteVal);
    if (isNaN(v) || !root) return;
    setDeleteVal('');
    const s = [];
    const res = bstDelete(cloneTree(root), v, s);
    setLog(prev => [`Xóa ${v} khỏi BST`, ...prev.slice(0, 9)]);
    animate(s, res.root, `Delete ${v}`);
  }

  function handleFloor() {
    const v = parseInt(floorVal);
    if (isNaN(v) || !root) return;
    const s = [];
    const res = bstFloor(cloneTree(root), v, s); 
    setFloorResult(res.floor);
    setLog(prev => [`Floor(${v}) = ${res.floor ?? 'không tồn tại'}`, ...prev.slice(0, 9)]);
    animate(s, root, `Floor ${v}`);
  }

  function handleCeil() {
    const v = parseInt(ceilVal);
    if (isNaN(v) || !root) return;
    const s = [];
    const res = bstCeil(cloneTree(root), v, s);   
    setCeilResult(res.ceil);
    setLog(prev => [`Ceil(${v}) = ${res.ceil ?? 'không tồn tại'}`, ...prev.slice(0, 9)]);
    animate(s, root, `Ceil ${v}`);
  }

  function handleBulkInsert() {
    const vals = [50, 30, 70, 20, 40, 60, 80].slice(0, 7);
    let r = null;
    let allSteps = [];
    for (const v of vals) {
      const s = [];
      const res = algo === 'avl'
        ? avlInsert(cloneTree(r), v, s)
        : bstInsert(cloneTree(r), v, s);
      r = res.root;
      allSteps = allSteps.concat(s);
    }
    setLog([`Chèn mảng: ${vals.join(', ')}`]);
    animate(allSteps, r, 'Bulk Insert');
  }

  const layout = treeToLayout(liveRoot ?? root, W);
  const hl = getHighlight(curStep);

  return (
    <div className="page">
      {/* CSS cho rotation animations */}
      <style>{`
        @keyframes rotPre {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(15deg) scale(1.15); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes rotPost {
          0%   { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div className="page-header">
        <h1>🌳 Tree Structures</h1>
        <p>BST và AVL Tree — Chèn, Xóa, Floor, Ceil với từng bước trực quan</p>
      </div>

      {/* Algo tabs */}
      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button
            key={k}
            className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => { setAlgo(k); resetAll(); }}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="tree-workspace">
        {/* Main panel — FIX 7: đổi tree-panel → tree-main để khớp CSS TreePage.css gốc */}
        <div className="tree-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{getStepDesc(curStep)}</span>
          </div>

          {/* FIX 8: bọc SVG trong tree-container + tree-svg-wrap như các page khác */}
          <div className="tree-container">
            <div className="tree-title">🌲 Cây hiện tại</div>
            <div className="tree-svg-wrap">
              <TreeSVG
                layout={layout}
                highlight={hl}
                rotatingNodes={rotatingNodes}
                rotationPhase={rotationPhase}
                nodeSize={nodeSize}
                edgeWidth={edgeWidth}
                fontSize={fontSize}
              />
            </div>
          </div>

          <div className="tree-legend">
            <span style={{ color: '#f59e0b' }}>■ So sánh</span>
            <span style={{ color: '#06b6d4' }}>■ Đường đi</span>
            <span style={{ color: '#10b981' }}>■ Chèn / Cân bằng OK</span>
            <span style={{ color: '#ef4444' }}>■ Xóa / Mất cân bằng</span>
            <span style={{ color: '#f97316' }}>■ Xoay (AVL)</span>
            <span style={{ color: '#8b5cf6' }}>■ Tìm kiếm</span>
          </div>

          {algo === 'avl' && curStep?.type === 'balance_check' && (
            <div className="avl-info-box">
              <span>Nút <b style={{ color: '#58a6ff' }}>{curStep.node}</b></span>
              <span>Balance Factor: <b style={{ color: Math.abs(curStep.bf) > 1 ? '#ef4444' : '#10b981' }}>{curStep.bf}</b></span>
              <span style={{ fontSize: 10, color: '#4a6b8a' }}>|BF| ≤ 1: cân bằng</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="tree-sidebar">
          <div className="ctrl-section">
            <h3>📥 Chèn phần tử</h3>
            <div className="input-pair">
              <input
                className="arr-input"
                placeholder="Giá trị..."
                value={insertVal}
                onChange={e => setInsertVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInsert()}
                type="number"
              />
              <button className="btn-generate" onClick={handleInsert}>Chèn</button>
            </div>
            <button
              className="btn-random"
              style={{ width: '100%', marginTop: 8 }}
              onClick={handleBulkInsert}
            >
              ⚄ Tự động chèn mảng mẫu
            </button>
          </div>

          {/* ─── Visual Controls ─────────────────────────────────── */}
          <div className="ctrl-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
            <h3>🎨 Hiển thị cây</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12, color: '#4a6b8a', minWidth: 70 }}>Kích cỡ node</label>
                <input
                  type="range"
                  min="12"
                  max="35"
                  value={nodeSize}
                  onChange={e => setNodeSize(parseInt(e.target.value))}
                  style={{ flex: 1, margin: '0 10px' }}
                />
                <span style={{ fontSize: 12, fontWeight: 'bold', minWidth: 30, textAlign: 'right' }}>{nodeSize}px</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12, color: '#4a6b8a', minWidth: 70 }}>Độ dày edge</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={edgeWidth}
                  onChange={e => setEdgeWidth(parseInt(e.target.value))}
                  style={{ flex: 1, margin: '0 10px' }}
                />
                <span style={{ fontSize: 12, fontWeight: 'bold', minWidth: 30, textAlign: 'right' }}>{edgeWidth}px</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12, color: '#4a6b8a', minWidth: 70 }}>Cỡ chữ</label>
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={fontSize}
                  onChange={e => setFontSize(parseInt(e.target.value))}
                  style={{ flex: 1, margin: '0 10px' }}
                />
                <span style={{ fontSize: 12, fontWeight: 'bold', minWidth: 30, textAlign: 'right' }}>{fontSize}px</span>
              </div>
            </div>
          </div>

          <div className="ctrl-section">
            <h3>🗑 Xóa phần tử (BST)</h3>
            <div className="input-pair">
              <input
                className="arr-input"
                placeholder="Giá trị cần xóa..."
                value={deleteVal}
                onChange={e => setDeleteVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDelete()}
                type="number"
              />
              <button className="btn-danger" onClick={handleDelete}>Xóa</button>
            </div>
          </div>

          <div className="ctrl-section">
            <button className="btn-danger" style={{ width: '100%' }} onClick={resetAll}>
              🗑 Xóa toàn bộ cây
            </button>
          </div>

          {algo === 'avl' && (
            <div className="ctrl-section">
              <h3>🔄 Loại xoay AVL</h3>
              <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.8 }}>
                <div><b style={{ color: '#f97316' }}>LL</b>: Xoay phải đơn</div>
                <div><b style={{ color: '#f97316' }}>RR</b>: Xoay trái đơn</div>
                <div><b style={{ color: '#f97316' }}>LR</b>: Xoay trái-phải kép</div>
                <div><b style={{ color: '#f97316' }}>RL</b>: Xoay phải-trái kép</div>
              </div>
            </div>
          )}

          <div className="ctrl-section">
            <h3>📐 Floor / Ceil (BST)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="input-pair">
                <input
                  className="arr-input"
                  placeholder="Tìm Floor..."
                  value={floorVal}
                  onChange={e => setFloorVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFloor()}
                  type="number"
                />
                <button className="btn-random" onClick={handleFloor}>Floor</button>
              </div>
              {floorResult !== null && (
                <div className="floor-ceil-result floor-result">
                  Floor({floorVal}) = <b>{floorResult}</b>
                </div>
              )}
              <div className="input-pair">
                <input
                  className="arr-input"
                  placeholder="Tìm Ceil..."
                  value={ceilVal}
                  onChange={e => setCeilVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCeil()}
                  type="number"
                />
                <button className="btn-random" onClick={handleCeil}>Ceil</button>
              </div>
              {ceilResult !== null && (
                <div className="floor-ceil-result ceil-result">
                  Ceil({ceilVal}) = <b>{ceilResult}</b>
                </div>
              )}
              <div style={{ fontSize: 10, color: '#4a6b8a', lineHeight: 1.6 }}>
                Floor(x): node lớn nhất ≤ x<br />Ceil(x): node nhỏ nhất ≥ x
              </div>
            </div>
          </div>

          <div className="ctrl-section">
            <h3>📋 Nhật ký thao tác</h3>
            <div className="log-panel">
              {log.length === 0 && <div className="log-empty">Chưa có thao tác nào</div>}
              {log.map((entry, i) => (
                <div key={i} className="log-entry" style={{ opacity: 1 - i * 0.1 }}>{entry}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Controls
        playing={playing}
        onPlay={() => { setPlaying(true); engineRef.current?.play(); }}
        onPause={() => { setPlaying(false); engineRef.current?.pause(); }}
        onReset={() => {
          setPlaying(false);
          engineRef.current?.reset();
          setStepIdx(0);
          setCurStep(steps[0] ?? null);
        }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed}
        onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx}
        total={steps.length}
      />
    </div>
  );
}

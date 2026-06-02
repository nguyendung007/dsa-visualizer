import { useState, useRef, useEffect } from 'react';
import { bstInsert, bstDelete, treeToLayout, avlInsert, BSTNode, bstFloor, bstCeil } from '../../core/trees/index.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './TreePage.css';

const W = 640, H = 340;

function TreeSVG({ layout, highlight, rotatingNodes, rotationPhase }) {
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="tree-svg">
      {layout.edges.map((e, i) => (
        <line key={i} x1={e.from.x} y1={e.from.y + 20} x2={e.to.x} y2={e.to.y - 20}
          stroke="#1e3a5f" strokeWidth="1.5" />
      ))}
      {layout.nodes.map((n, i) => {
        const isRotating = rotatingNodes?.includes(n.val);
        const col = (() => {
          if (highlight[n.val] === 'comparing') return '#f59e0b';
          if (highlight[n.val] === 'placed') return '#10b981';
          if (highlight[n.val] === 'deleting') return '#ef4444';
          if (highlight[n.val] === 'searching') return '#8b5cf6';
          if (highlight[n.val] === 'path') return '#06b6d4';
          if (highlight[n.val] === 'rotating') return '#f97316';
          if (highlight[n.val] === 'balance_ok') return '#10b981';
          if (highlight[n.val] === 'balance_bad') return '#ef4444';
          return '#1d4ed8';
        })();
        return (
          <g key={i} style={isRotating ? {
            animation: `${rotationPhase === 'pre' ? 'rotPre' : 'rotPost'} 0.4s ease`,
            transformOrigin: `${n.x}px ${n.y}px`,
            transformBox: 'fill-box'
          } : {}}>
            <circle cx={n.x} cy={n.y} r={20} fill={col} stroke="#0a0e1a" strokeWidth="2"
              style={{ transition: 'fill 0.3s, cx 0.4s, cy 0.4s' }} />
            <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
              fill="white" fontSize="12" fontWeight="700" fontFamily="monospace">
              {n.val}
            </text>
            {n.h !== undefined && (
              <text x={n.x + 22} y={n.y - 14} textAnchor="start" fill="#4a6b8a" fontSize="9" fontFamily="monospace">
                h={n.h}
              </text>
            )}
          </g>
        );
      })}
      {layout.nodes.length === 0 && (
        <text x={W/2} y={H/2} textAnchor="middle" fill="#1e3a5f" fontSize="14" fontFamily="monospace">
          Cây rỗng — nhập phần tử để bắt đầu
        </text>
      )}
    </svg>
  );
}

export default function TreePage() {
  const [algo, setAlgo] = useState('bst');
  const [root, setRoot] = useState(null);
  const [insertVal, setInsertVal] = useState('');
  const [deleteVal, setDeleteVal] = useState('');
  const [floorVal, setFloorVal] = useState('');
  const [ceilVal, setCeilVal] = useState('');
  const [floorResult, setFloorResult] = useState(null);
  const [ceilResult, setCeilResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(400);
  const [log, setLog] = useState([]);
  const [rotatingNodes, setRotatingNodes] = useState([]);
  const [rotationPhase, setRotationPhase] = useState('');
  const engineRef = useRef(null);

  function highlight(step) {
    if (!step) return {};
    const h = {};
    if (step.comparing !== undefined) h[step.comparing] = 'comparing';
    if (step.val !== undefined && step.type === 'placed') h[step.val] = 'placed';
    if (step.val !== undefined && step.type === 'found') h[step.val] = 'deleting';
    if (step.val !== undefined && step.type === 'searching') h[step.val] = 'searching';
    if (step.path) step.path.forEach(v => { if (!h[v]) h[v] = 'path'; });
    if (step.type === 'pre_rotate' || step.type === 'rotate') {
      h[step.node] = 'rotating';
      h[step.pivot] = 'rotating';
    }
    if (step.type === 'balance_check') {
      h[step.node] = Math.abs(step.bf) > 1 ? 'balance_bad' : 'balance_ok';
    }
    return h;
  }

  function animate(newSteps, newRoot) {
    engineRef.current?.pause();
    setSteps(newSteps);
    setStepIdx(0);
    const eng = new AnimationEngine({
      steps: newSteps, speed,
      onStep: (s, idx) => {
        setCurStep(s);
        setStepIdx(idx + 1);
        // Trigger rotation animation
        if (s.type === 'pre_rotate') {
          setRotatingNodes([s.node, s.pivot]);
          setRotationPhase('pre');
          setTimeout(() => setRotationPhase('post'), 200);
        } else if (s.type !== 'rotate') {
          setRotatingNodes([]);
          setRotationPhase('');
        }
      },
      onDone: () => { setPlaying(false); setRoot(newRoot); setRotatingNodes([]); },
    });
    engineRef.current = eng;
    eng.play();
    setPlaying(true);
  }

  function handleInsert() {
    const v = parseInt(insertVal);
    if (isNaN(v)) return;
    setInsertVal('');
    const s = [];
    const res = algo === 'avl'
      ? avlInsert(root ? JSON.parse(JSON.stringify(root)) : null, v, s)
      : bstInsert(root ? JSON.parse(JSON.stringify(root)) : null, v, s);
    setLog(prev => [`Chèn ${v} vào ${algo.toUpperCase()}`, ...prev.slice(0, 9)]);
    animate(s, res.root);
  }

  function handleDelete() {
    const v = parseInt(deleteVal);
    if (isNaN(v) || !root) return;
    setDeleteVal('');
    const s = [];
    const res = bstDelete(JSON.parse(JSON.stringify(root)), v, s);
    setLog(prev => [`Xóa ${v} khỏi BST`, ...prev.slice(0, 9)]);
    animate(s, res.root);
  }

  function handleFloor() {
    const v = parseInt(floorVal);
    if (isNaN(v) || !root) return;
    const s = [];
    const res = bstFloor(JSON.parse(JSON.stringify(root)), v, s);
    setFloorResult(res.floor);
    setLog(prev => [`Floor(${v}) = ${res.floor ?? 'không tồn tại'}`, ...prev.slice(0, 9)]);
    animate(s, root);
  }

  function handleCeil() {
    const v = parseInt(ceilVal);
    if (isNaN(v) || !root) return;
    const s = [];
    const res = bstCeil(JSON.parse(JSON.stringify(root)), v, s);
    setCeilResult(res.ceil);
    setLog(prev => [`Ceil(${v}) = ${res.ceil ?? 'không tồn tại'}`, ...prev.slice(0, 9)]);
    animate(s, root);
  }

  function handleBulkInsert() {
    const vals = [50, 30, 70, 20, 40, 60, 80, 10, 90].slice(0, 7);
    let r = null, allSteps = [];
    for (const v of vals) {
      const s = [];
      const res = algo === 'avl' ? avlInsert(r, v, s) : bstInsert(r, v, s);
      r = res.root;
      allSteps = allSteps.concat(s);
    }
    setLog([`Chèn mảng: ${vals.join(', ')}`]);
    animate(allSteps, r);
  }

  // Layout uses live root during animation (not final root)
  const [liveRoot, setLiveRoot] = useState(null);
  const layout = treeToLayout(liveRoot ?? root);
  const hl = highlight(curStep);

  // Update live root when animation completes
  useEffect(() => {
    if (curStep?.type === 'done') setLiveRoot(null);
  }, [curStep]);

  function stepDesc(s) {
    if (!s) return 'Thêm phần tử để xem cây';
    if (s.type === 'compare') return `So sánh ${s.val} với nút ${s.comparing}: ${s.val < s.comparing ? 'đi trái ←' : 'đi phải →'}`;
    if (s.type === 'placed') return `✓ Đặt ${s.val} ở bên ${s.side} của nút ${s.parent}`;
    if (s.type === 'searching') return `Tìm ${s.target} tại nút ${s.val}`;
    if (s.type === 'found') return `✓ Tìm thấy ${s.val} — đang xóa`;
    if (s.type === 'successor') return `→ Successor (nhỏ nhất bên phải): ${s.successor}`;
    if (s.type === 'pre_rotate') return `⟳ Chuẩn bị xoay ${s.direction === 'right' ? 'phải' : 'trái'} — pivot: ${s.pivot}, node: ${s.node}`;
    if (s.type === 'rotate') return `↻ Hoàn tất xoay ${s.direction === 'right' ? 'phải' : 'trái'}: ${s.pivot} lên trên ${s.node}`;
    if (s.type === 'balance_check') return `Cân bằng tại ${s.node}: BF=${s.bf} ${Math.abs(s.bf) > 1 ? '⚠ MẤT CÂN BẰNG!' : '✓'}`;
    if (s.type === 'done') return '✓ Hoàn thành';
    if (s.type === 'update' && (s.floor !== undefined || s.ceil !== undefined)) {
      if (s.floor !== undefined) return `Floor candidate = ${s.floor}`;
      if (s.ceil !== undefined) return `Ceil candidate = ${s.ceil}`;
    }
    if (s.type === 'exact') return s.desc || `Tìm thấy chính xác: ${s.node}`;
    return '';
  }

  return (
    <div className="page">
      <style>{`
        @keyframes rotPre {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(${rotationPhase === 'pre' ? '15deg' : '-15deg'}) scale(1.15); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes rotPost {
          0% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
      <div className="page-header">
        <h1>Tree Structures</h1>
        <p>BST và AVL Tree — xem xoay cây AVL với hiệu ứng chuyển động</p>
      </div>

      <div className="algo-tabs">
        {[{ k: 'bst', n: 'BST' }, { k: 'avl', n: 'AVL Tree' }].map(({ k, n }) => (
          <button key={k} className={`algo-tab ${algo === k ? 'active' : ''}`}
            onClick={() => { setAlgo(k); setRoot(null); setSteps([]); setCurStep(null); setLiveRoot(null); }}>
            {n}
          </button>
        ))}
      </div>

      <div className="tree-workspace">
        <div className="tree-panel">
          <div className="step-desc" style={{padding: '8px 0', minHeight: 32}}>
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep)}</span>
          </div>

          <TreeSVG layout={layout} highlight={hl} rotatingNodes={rotatingNodes} rotationPhase={rotationPhase} />

          <div className="tree-legend">
            <span style={{color:'#f59e0b'}}>■ So sánh</span>
            <span style={{color:'#06b6d4'}}>■ Đường đi</span>
            <span style={{color:'#10b981'}}>■ Chèn / Cân bằng OK</span>
            <span style={{color:'#ef4444'}}>■ Xóa / Mất cân bằng</span>
            <span style={{color:'#f97316'}}>■ Xoay (AVL)</span>
            <span style={{color:'#8b5cf6'}}>■ Tìm kiếm</span>
          </div>

          {algo === 'avl' && curStep?.type === 'balance_check' && (
            <div className="avl-info-box">
              <span>Nút <b style={{color:'#58a6ff'}}>{curStep.node}</b></span>
              <span>Balance Factor: <b style={{color: Math.abs(curStep.bf) > 1 ? '#ef4444' : '#10b981'}}>{curStep.bf}</b></span>
              <span style={{fontSize:10, color:'#4a6b8a'}}>|BF| ≤ 1: cân bằng</span>
            </div>
          )}
        </div>

        <div className="tree-sidebar">
          <div className="ctrl-section">
            <h3>Chèn phần tử</h3>
            <div className="input-pair">
              <input className="arr-input" placeholder="Giá trị..."
                value={insertVal} onChange={e => setInsertVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInsert()}
                type="number" />
              <button className="btn-generate" onClick={handleInsert}>Chèn</button>
            </div>
            <button className="btn-random" style={{width:'100%', marginTop: 8}}
              onClick={handleBulkInsert}>⚄ Tự động chèn mảng mẫu</button>
          </div>

          <div className="ctrl-section">
            <h3>Xóa phần tử (BST)</h3>
            <div className="input-pair">
              <input className="arr-input" placeholder="Giá trị cần xóa..."
                value={deleteVal} onChange={e => setDeleteVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDelete()}
                type="number" />
              <button className="btn-danger" onClick={handleDelete}>Xóa</button>
            </div>
          </div>

          {algo === 'avl' && (
            <div className="ctrl-section">
              <h3>Loại xoay AVL</h3>
              <div style={{fontSize: 11, color: '#4a6b8a', lineHeight: 1.8}}>
                <div><b style={{color:'#f97316'}}>LL</b>: Xoay phải đơn</div>
                <div><b style={{color:'#f97316'}}>RR</b>: Xoay trái đơn</div>
                <div><b style={{color:'#f97316'}}>LR</b>: Xoay trái-phải kép</div>
                <div><b style={{color:'#f97316'}}>RL</b>: Xoay phải-trái kép</div>
              </div>
            </div>
          )}

          <div className="ctrl-section">
            <h3>Floor / Ceil (BST)</h3>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              <div className="input-pair">
                <input className="arr-input" placeholder="Tìm Floor..."
                  value={floorVal} onChange={e => setFloorVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFloor()}
                  type="number" />
                <button className="btn-random" onClick={handleFloor}>Floor</button>
              </div>
              {floorResult !== null && (
                <div style={{fontSize:12, color:'#10b981', padding:'4px 8px', background:'rgba(16,185,129,0.1)', borderRadius:4}}>
                  Floor({floorVal}) = <b>{floorResult}</b>
                </div>
              )}
              <div className="input-pair">
                <input className="arr-input" placeholder="Tìm Ceil..."
                  value={ceilVal} onChange={e => setCeilVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCeil()}
                  type="number" />
                <button className="btn-random" onClick={handleCeil}>Ceil</button>
              </div>
              {ceilResult !== null && (
                <div style={{fontSize:12, color:'#58a6ff', padding:'4px 8px', background:'rgba(88,166,255,0.1)', borderRadius:4}}>
                  Ceil({ceilVal}) = <b>{ceilResult}</b>
                </div>
              )}
              <div style={{fontSize:10, color:'#4a6b8a', lineHeight:1.6}}>
                Floor(x): node lớn nhất ≤ x<br/>
                Ceil(x): node nhỏ nhất ≥ x
              </div>
            </div>
          </div>

          <div className="ctrl-section">
            <h3>Nhật ký thao tác</h3>
            <div className="log-panel">
              {log.length === 0 && <div className="log-empty">Chưa có thao tác nào</div>}
              {log.map((entry, i) => (
                <div key={i} className="log-entry" style={{opacity: 1 - i * 0.1}}>{entry}</div>
              ))}
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

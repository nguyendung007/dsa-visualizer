import { useState, useRef } from 'react';
import { llBuild, llInsertHead, llInsertTail, llInsertAt, llDelete, llSearch, llReverse } from '../../../core/linkedlist/index.js';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import './LinkedListPage.css';
import { useProgress } from '../../../context/ProgressContext.jsx';

const TYPES = {
  singly:   { name: 'Singly',   color: '#58a6ff', desc: 'Node → Node → null' },
  doubly:   { name: 'Doubly',   color: '#10b981', desc: '← Node ↔ Node → null' },
  circular: { name: 'Circular', color: '#f59e0b', desc: 'Node → Node → head' },
};

export default function LinkedListPage() {
  const [type, setType]       = useState('singly');
  const [nodes, setNodes]     = useState(() => llBuild([10, 20, 30, 40], 'singly').nodes);
  const [steps, setSteps]     = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]     = useState(600);

  // FIX: mỗi section có input riêng, không dùng chung 1 val/pos
  const [insertVal, setInsertVal]   = useState('');
  const [insertPos, setInsertPos]   = useState('');
  const [deleteVal, setDeleteVal]   = useState('');
  const [deletePos, setDeletePos]   = useState('');
  const [searchVal, setSearchVal]   = useState('');
  const [searchPos, setSearchPos]   = useState('');

  const engineRef = useRef(null);
  const { saveProgress } = useProgress();

  function runSteps(s, finalNodes, actionName) {
    engineRef.current?.pause();
    setSteps(s); setStepIdx(0); setCurStep(s[0] || null);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => {
        setPlaying(false);
        if (finalNodes) setNodes(finalNodes);
        saveProgress('linked-list', `${TYPES[type].name} - ${actionName}`);
      },
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
  }

  function handleInsertHead() {
    const v = parseInt(insertVal);
    if (isNaN(v)) return;
    const res = llInsertHead(nodes, v, type);
    setInsertVal('');
    runSteps(res.steps, res.nodes, `Chèn đầu ${v}`);
  }

  function handleInsertTail() {
    const v = parseInt(insertVal);
    if (isNaN(v)) return;
    const res = llInsertTail(nodes, v, type);
    setInsertVal('');
    runSteps(res.steps, res.nodes, `Chèn cuối ${v}`);
  }

  function handleInsertAt() {
    const v = parseInt(insertVal), p = parseInt(insertPos);
    if (isNaN(v) || isNaN(p)) return;
    const res = llInsertAt(nodes, v, p, type);
    setInsertVal(''); setInsertPos('');
    runSteps(res.steps, res.nodes, `Chèn vào vị trí ${p}`);
  }

  function handleDeleteByValue() {
    const v = parseInt(deleteVal);
    if (isNaN(v)) return;
    const res = llDelete(nodes, v, type);
    setDeleteVal('');
    runSteps(res.steps, res.nodes, `Xóa giá trị ${v}`);
  }

  function handleDeleteByPos() {
    const p = parseInt(deletePos);
    if (isNaN(p)) return;
    const res = llDelete(nodes, null, type, p);
    setDeletePos('');
    runSteps(res.steps, res.nodes, `Xóa vị trí ${p}`);
  }

  function handleSearchByValue() {
    const v = parseInt(searchVal);
    if (isNaN(v)) return;
    const s = llSearch(nodes, v, type);
    setSearchVal('');
    runSteps(s, null, `Tìm giá trị ${v}`);
  }

  function handleSearchByPos() {
    const p = parseInt(searchPos);
    if (isNaN(p)) return;
    const s = llSearch(nodes, 0, type, p);
    setSearchPos('');
    runSteps(s, null, `Tìm từ vị trí ${p}`);
  }

  function handleReverse() {
    const res = llReverse(nodes, type);
    runSteps(res.steps, res.nodes, 'Đảo ngược');
  }

  const displayNodes = curStep?.nodes || nodes;
  const highlight    = curStep?.highlight;
  const color        = TYPES[type]?.color;

  const NODE_W = 72, NODE_H = 42, GAP = 54, Y = 100;
  const svgMinW = Math.max(600, 40 + displayNodes.length * (NODE_W + GAP) + 60);

  function getNodeX(i) { return 40 + i * (NODE_W + GAP); }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Linked List</h1>
        <p>Singly · Doubly · Circular — chèn, xóa, tìm kiếm, đảo ngược</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(TYPES).map(([k, v]) => (
          <button key={k} className={`algo-tab ${type === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => {
              setType(k);
              const res = llBuild([10, 20, 30, 40], k);
              setNodes(res.nodes); setSteps([]); setCurStep(null);
            }}>
            {v.name}
            <span style={{ display: 'block', fontSize: 9, color: '#4a6b8a' }}>{v.desc}</span>
          </button>
        ))}
      </div>

      <div className="ll-workspace">
        <div className="ll-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{curStep?.desc || 'Chọn thao tác ở phải'}</span>
          </div>

          {/* FIX: thêm minWidth để SVG không tràn, overflow-x scroll trong wrap */}
          <div className="ll-svg-wrap">
            <svg
              viewBox={`0 0 ${svgMinW} 200`}
              style={{ minWidth: svgMinW, width: '100%', background: '#0d1117', borderRadius: 8, border: '1px solid #1e2d3d' }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={color} />
                </marker>
                <marker id="arrowBack" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto-start-reverse">
                  <path d="M0,0 L0,6 L8,3 z" fill="#4a6b8a" />
                </marker>
              </defs>

              {displayNodes.map((node, i) => {
                const x = getNodeX(i);
                const isHighlighted = highlight === node.id || highlight === i;
                const isFound = curStep?.op === 'found' && highlight === i;
                const nodeStroke = isFound ? '#10b981' : isHighlighted ? '#f59e0b' : color;
                const nodeFill   = isFound ? 'rgba(16,185,129,0.2)' : isHighlighted ? 'rgba(245,158,11,0.2)' : '#132135';
                const hasNext  = node.next !== null && node.next !== undefined;
                const nextIdx  = typeof node.next === 'number' ? node.next : null;

                return (
                  <g key={i}>
                    {/* Node box */}
                    <rect x={x} y={Y - NODE_H / 2} width={NODE_W} height={NODE_H}
                      rx={8} fill={nodeFill} stroke={nodeStroke} strokeWidth={isHighlighted || isFound ? 2.5 : 1.5} />
                    <text x={x + NODE_W / 2} y={Y} textAnchor="middle" dominantBaseline="central"
                      fill="white" fontSize="14" fontWeight="700" fontFamily="monospace">{node.val}</text>
                    <text x={x + NODE_W / 2} y={Y + 18} textAnchor="middle"
                      fill="#4a6b8a" fontSize="9" fontFamily="monospace">[{i}]</text>

                    {/* Forward arrow */}
                    {hasNext && nextIdx !== null && (
                      <line x1={x + NODE_W} y1={Y} x2={getNodeX(nextIdx) - 2} y2={Y}
                        stroke={color} strokeWidth="1.5" markerEnd="url(#arrow)" />
                    )}

                    {/* Null pointer */}
                    {!hasNext && type !== 'circular' && (
                      <text x={x + NODE_W + 8} y={Y + 4} fill="#2e4a6a" fontSize="11" fontFamily="monospace">null</text>
                    )}

                    {/* Circular: last → head arc */}
                    {type === 'circular' && i === displayNodes.length - 1 && displayNodes.length > 1 && (
                      <path
                        d={`M ${x + NODE_W} ${Y} C ${x + NODE_W + 30} ${Y - 80} ${getNodeX(0) - 30} ${Y - 80} ${getNodeX(0) + NODE_W / 2} ${Y - NODE_H / 2 - 10}`}
                        fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />
                    )}

                    {/* Doubly: back arrow */}
                    {type === 'doubly' && i > 0 && (
                      <line x1={x} y1={Y - 8} x2={getNodeX(i - 1) + NODE_W + 2} y2={Y - 8}
                        stroke="#4a6b8a" strokeWidth="1" markerEnd="url(#arrowBack)" />
                    )}

                    {/* HEAD label */}
                    {i === 0 && (
                      <g>
                        <text x={x + NODE_W / 2} y={Y - NODE_H / 2 - 12} textAnchor="middle"
                          fill={color} fontSize="10" fontWeight="700" fontFamily="monospace">HEAD</text>
                        <line x1={x + NODE_W / 2} y1={Y - NODE_H / 2 - 6} x2={x + NODE_W / 2} y2={Y - NODE_H / 2}
                          stroke={color} strokeWidth="1.5" markerEnd="url(#arrow)" />
                      </g>
                    )}

                    {/* TAIL label */}
                    {i === displayNodes.length - 1 && displayNodes.length > 1 && (
                      <text x={x + NODE_W / 2} y={Y + NODE_H / 2 + 18} textAnchor="middle"
                        fill="#4a6b8a" fontSize="9" fontFamily="monospace">TAIL</text>
                    )}
                  </g>
                );
              })}

              {displayNodes.length === 0 && (
                <text x="300" y="100" textAnchor="middle" fill="#2e4a6a" fontSize="14" fontFamily="monospace">
                  Danh sách rỗng
                </text>
              )}
            </svg>
          </div>

          {/* Info bar */}
          <div className="ll-info-bar">
            <span>Độ dài: <b style={{ color }}>{displayNodes.length}</b></span>
            <span>Head: <b style={{ color }}>{displayNodes[0]?.val ?? 'null'}</b></span>
            <span>Tail: <b style={{ color }}>{displayNodes[displayNodes.length - 1]?.val ?? 'null'}</b></span>
            {curStep?.op && <span className="ll-op-badge">{curStep.op}</span>}
          </div>

          {/* Complexity */}
          <div className="ll-complexity">
            <div className="lc-title">Độ phức tạp ({TYPES[type]?.name})</div>
            <div className="lc-rows">
              {[
                ['Insert đầu',  'O(1)',                              'O(1)'],
                ['Insert cuối', type === 'singly' ? 'O(n)' : 'O(1)', 'O(1)'],
                ['Insert giữa', 'O(n)',                              'O(1)'],
                ['Xóa',         'O(n)',                              'O(1)'],
                ['Tìm kiếm',    'O(n)',                              'O(1)'],
                ['Đảo ngược',   'O(n)',                              'O(1)'],
              ].map(([op, time, space]) => (
                <div key={op} className="lc-row">
                  <span className="lc-op">{op}</span>
                  <span className="lc-time">{time}</span>
                  <span className="lc-space">{space}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ll-sidebar">

          {/* Thêm node — input riêng trong section này */}
          <div className="ctrl-section">
            <h3>Thêm node</h3>
            <div className="ll-insert-actions">
              <input className="arr-input" placeholder="Giá trị..." value={insertVal}
                onChange={e => setInsertVal(e.target.value)} type="number"
                onKeyDown={e => e.key === 'Enter' && handleInsertHead()} />
              <button className="btn-generate" onClick={handleInsertHead}>+ Chèn đầu (Head)</button>
              <button className="btn-generate" onClick={handleInsertTail}>+ Chèn cuối (Tail)</button>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="arr-input" placeholder="Vị trí..." value={insertPos}
                  onChange={e => setInsertPos(e.target.value)} type="number" style={{ flex: 1 }} />
                <button className="btn-random" onClick={handleInsertAt}>Chèn [pos]</button>
              </div>
            </div>
          </div>

          {/* Xóa node — input riêng trong section này */}
          <div className="ctrl-section">
            <h3>Xóa node</h3>
            <div className="ll-insert-actions">
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="arr-input" placeholder="Giá trị cần xóa..." value={deleteVal}
                  onChange={e => setDeleteVal(e.target.value)} type="number" style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleDeleteByValue()} />
                <button className="btn-danger" onClick={handleDeleteByValue}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="arr-input" placeholder="Vị trí cần xóa..." value={deletePos}
                  onChange={e => setDeletePos(e.target.value)} type="number" style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleDeleteByPos()} />
                <button className="btn-danger" onClick={handleDeleteByPos}>[i]✕</button>
              </div>
              <div style={{ fontSize: 10, color: '#4a6b8a', lineHeight: 1.5 }}>
                ✕ = xóa theo giá trị &nbsp;|&nbsp; [i]✕ = xóa theo vị trí
              </div>
            </div>
          </div>

          {/* Tìm kiếm — input riêng trong section này */}
          <div className="ctrl-section">
            <h3>Tìm kiếm</h3>
            <div className="ll-insert-actions">
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="arr-input" placeholder="Giá trị cần tìm..." value={searchVal}
                  onChange={e => setSearchVal(e.target.value)} type="number" style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleSearchByValue()} />
                <button className="btn-random" onClick={handleSearchByValue}>🔍</button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="arr-input" placeholder="Tìm từ vị trí..." value={searchPos}
                  onChange={e => setSearchPos(e.target.value)} type="number" style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleSearchByPos()} />
                <button className="btn-random" onClick={handleSearchByPos}>[i]🔍</button>
              </div>
              <div style={{ fontSize: 10, color: '#4a6b8a', lineHeight: 1.5 }}>
                🔍 = tìm theo giá trị &nbsp;|&nbsp; [i]🔍 = tìm từ vị trí
              </div>
            </div>
          </div>

          {/* Đảo ngược */}
          <div className="ctrl-section">
            <button className="btn-random" style={{ width: '100%' }} onClick={handleReverse}>
              ⟳ Đảo ngược danh sách
            </button>
          </div>

          {/* Dữ liệu mẫu */}
          <div className="ctrl-section">
            <h3>Dữ liệu mẫu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[[10,20,30,40], [5,15,25,35,45], [1,2,3]].map(arr => (
                <button key={arr.join()} className="btn-random" style={{ fontSize: 10 }}
                  onClick={() => { const r = llBuild(arr, type); setNodes(r.nodes); setSteps([]); setCurStep(null); }}>
                  [{arr.join(', ')}]
                </button>
              ))}
            </div>
          </div>

          {/* Xóa tất cả */}
          <div className="ctrl-section">
            <button className="btn-danger" style={{ width: '100%' }}
              onClick={() => { const r = llBuild([], type); setNodes(r.nodes); setSteps([]); setCurStep(null); }}>
              ✕ Xóa tất cả
            </button>
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
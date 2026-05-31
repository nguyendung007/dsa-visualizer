import { useState, useRef } from 'react';
import { llBuild, llInsertHead, llInsertTail, llInsertAt, llDelete, llSearch, llReverse } from '../../core/linkedlist/index.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './LinkedListPage.css';

const TYPES = {
  singly:   { name: 'Singly',   color: '#58a6ff', desc: 'Node → Node → null' },
  doubly:   { name: 'Doubly',   color: '#10b981', desc: '← Node ↔ Node → null' },
  circular: { name: 'Circular', color: '#f59e0b', desc: 'Node → Node → head' },
};

//Đây là component trang Linked List, cho phép người dùng tương tác với 3 loại danh sách liên kết 
//(Singly/Doubly/Circular) thông qua mô phỏng hoạt ảnh từng bước. 

export default function LinkedListPage() {
  const [type, setType] = useState('singly');
  const [nodes, setNodes] = useState(() => llBuild([10, 20, 30, 40], 'singly').nodes);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [val, setVal] = useState('');
  const [pos, setPos] = useState('');
  const engineRef = useRef(null);  //chỉ động cơ cũ 

  // Chạy hoạt ảnh từng bước thao tác trên linked list
  function runSteps(s, finalNodes) {
    engineRef.current?.pause(); //dừng cái cũ nếu có 
    setSteps(s); setStepIdx(0); setCurStep(s[0] || null);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => { setPlaying(false); if (finalNodes) setNodes(finalNodes); },
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
  }

  function act(fn) {
    const v = parseInt(val);
    if (isNaN(v)) return;
    const res = fn(nodes, v, type);
    setVal('');
    runSteps(res.steps, res.nodes);
  }

  const displayNodes = curStep?.nodes || nodes;
  const highlight = curStep?.highlight;
  const color = TYPES[type]?.color;

  const SVG_W = 700, NODE_W = 72, NODE_H = 42, GAP = 54, Y = 100;

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

          {/* SVG visualization */}
          <div className="ll-svg-wrap">
            <svg width="100%" viewBox={`0 0 ${Math.max(SVG_W, 40 + displayNodes.length * (NODE_W + GAP) + 60)} 200`}
              style={{ background: '#0d1117', borderRadius: 8, border: '1px solid #1e2d3d' }}>
              {/* Arrows between nodes */}
              {displayNodes.map((node, i) => {
                const x = getNodeX(i), nx = getNodeX(i + 1);
                const isHighlighted = highlight === node.id || highlight === i;
                const nodeColor = isHighlighted ? '#f59e0b' : (curStep?.op === 'found' && highlight === i) ? '#10b981' : color;
                // forward arrow
                const hasNext = node.next !== null && node.next !== undefined;
                const nextIdx = typeof node.next === 'number' ? node.next : null;
                return (
                  <g key={i}>
                    {/* Node box */}
                    <rect x={x} y={Y - NODE_H / 2} width={NODE_W} height={NODE_H}
                      rx={8} fill={isHighlighted ? 'rgba(245,158,11,0.2)' : '#132135'}
                      stroke={isHighlighted ? '#f59e0b' : color} strokeWidth={isHighlighted ? 2.5 : 1.5} />
                    <text x={x + NODE_W / 2} y={Y} textAnchor="middle" dominantBaseline="central"
                      fill="white" fontSize="14" fontWeight="700" fontFamily="monospace">{node.val}</text>
                    <text x={x + NODE_W / 2} y={Y + 18} textAnchor="middle"
                      fill="#4a6b8a" fontSize="9" fontFamily="monospace">[{i}]</text>

                    {/* Forward arrow */}
                    {hasNext && nextIdx !== null && (
                      <g>
                        <line x1={x + NODE_W} y1={Y} x2={getNodeX(nextIdx) - 2} y2={Y}
                          stroke={color} strokeWidth="1.5" markerEnd="url(#arrow)" />
                      </g>
                    )}
                    {/* Null pointer */}
                    {!hasNext && type !== 'circular' && (
                      <text x={x + NODE_W + 8} y={Y + 4} fill="#2e4a6a" fontSize="11" fontFamily="monospace">null</text>
                    )}
                    {/* Circular: last → head arc */}
                    {type === 'circular' && i === displayNodes.length - 1 && displayNodes.length > 1 && (
                      <path d={`M ${x + NODE_W} ${Y} Q ${x + NODE_W + 30} ${Y + 70} ${getNodeX(0) + NODE_W / 2} ${Y + 70} Q ${getNodeX(0) - 10} ${Y + 70} ${getNodeX(0)} ${Y}`}
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
                <text x="350" y="100" textAnchor="middle" fill="#2e4a6a" fontSize="14" fontFamily="monospace">Danh sách rỗng</text>
              )}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={color} />
                </marker>
                <marker id="arrowBack" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto-start-reverse">
                  <path d="M0,0 L0,6 L8,3 z" fill="#4a6b8a" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Info bar */}
          <div className="ll-info-bar">
            <span>Độ dài: <b style={{ color }}>{displayNodes.length}</b></span>
            <span>Head: <b style={{ color }}>{displayNodes[0]?.val ?? 'null'}</b></span>
            <span>Tail: <b style={{ color }}>{displayNodes[displayNodes.length - 1]?.val ?? 'null'}</b></span>
            {curStep?.op && <span className="ll-op-badge">{curStep.op}</span>}
          </div>

          {/* Complexity reference */}
          <div className="ll-complexity">
            <div className="lc-title">Độ phức tạp ({TYPES[type]?.name})</div>
            <div className="lc-rows">
              {[
                ['Insert đầu', 'O(1)', 'O(1)'],
                ['Insert cuối', type === 'singly' ? 'O(n)' : 'O(1)', 'O(1)'],
                ['Insert giữa', 'O(n)', 'O(1)'],
                ['Xóa', 'O(n)', 'O(1)'],
                ['Tìm kiếm', 'O(n)', 'O(1)'],
                ['Đảo ngược', 'O(n)', 'O(1)'],
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
          <div className="ctrl-section">
            <h3>Giá trị</h3>
            <input className="arr-input" placeholder="Giá trị (số)..." value={val}
              onChange={e => setVal(e.target.value)} type="number" style={{ width: '100%' }} />
          </div>

          <div className="ctrl-section">
            <h3>Thêm node</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className="btn-generate" onClick={() => act((n, v, t) => llInsertHead(n, v, t))}>
                + Chèn đầu (Head)
              </button>
              <button className="btn-generate" onClick={() => act((n, v, t) => llInsertTail(n, v, t))}>
                + Chèn cuối (Tail)
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="arr-input" placeholder="Vị trí..." value={pos}
                  onChange={e => setPos(e.target.value)} type="number" style={{ flex: 1 }} />
                <button className="btn-random" onClick={() => {
                  const v = parseInt(val), p = parseInt(pos);
                  if (!isNaN(v) && !isNaN(p)) {
                    const res = llInsertAt(nodes, v, p, type);
                    setVal(''); setPos('');
                    runSteps(res.steps, res.nodes);
                  }
                }}>Chèn [pos]</button>
              </div>
            </div>
          </div>

          <div className="ctrl-section">
            <h3>Thao tác</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className="btn-random" onClick={() => act((n, v, t) => llDelete(n, v, t))}>
                ✕ Xóa node
              </button>
              <button className="btn-random" onClick={() => {
                const v = parseInt(val);
                if (!isNaN(v)) { const s = llSearch(nodes, v, type); runSteps(s, null); }
              }}>🔍 Tìm kiếm</button>
              <button className="btn-random" onClick={() => {
                const res = llReverse(nodes, type);
                runSteps(res.steps, res.nodes);
              }}>⟳ Đảo ngược</button>
            </div>
          </div>

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

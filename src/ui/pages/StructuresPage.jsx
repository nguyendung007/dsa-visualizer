import { useState, useRef } from 'react';
import { stackOps, queueOps, priorityQueueOps, hashTableOps } from '../../core/dataStructures/index.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './StructuresPage.css';

const TABLE_SIZE = 11;

export default function StructuresPage() {
  const [tab, setTab] = useState('stack');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [inputVal, setInputVal] = useState('');
  const [priorityVal, setPriorityVal] = useState('');
  const [keyVal, setKeyVal] = useState('');
  const [ops, setOps] = useState([]);
  const [hashFormula, setHashFormula] = useState('default');
  const [customFormula, setCustomFormula] = useState('for (const c of k) h = (h * 31 + c.charCodeAt(0)) % size;');
  const [probeMode, setProbeMode] = useState('chaining');
  const [tableSize, setTableSize] = useState(TABLE_SIZE);
  const engineRef = useRef(null);

  function runOps(opList) {
    engineRef.current?.pause();
    let s;
    if (tab === 'stack') s = stackOps(opList);
    else if (tab === 'queue') s = queueOps(opList);
    else if (tab === 'pq') s = priorityQueueOps(opList);
    else s = hashTableOps(opList, tableSize, hashFormula === 'custom' ? customFormula : hashFormula, probeMode);
    setSteps(s);
    setStepIdx(0);
    setCurStep(s[0] || null);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
  }

  function addOp(type) {
    let newOps;
    if (tab === 'hash') {
      if (!keyVal && !inputVal) return;
      newOps = [...ops, { type: 'insert', key: keyVal || inputVal, val: inputVal || keyVal }];
    } else if (tab === 'pq') {
      const val = inputVal;
      const priority = parseInt(priorityVal) || parseInt(inputVal) || 0;
      if (!val) return;
      newOps = [...ops, { type, val, priority }];
    } else {
      const val = parseInt(inputVal);
      if (isNaN(val) && (type === 'push' || type === 'enqueue')) return;
      newOps = [...ops, { type, val }];
    }
    setOps(newOps);
    runOps(newOps);
    setInputVal('');
    setKeyVal('');
    setPriorityVal('');
  }

  function searchHash() {
    if (!keyVal && !inputVal) return;
    const searchOps = [...ops, { type: 'search', key: keyVal || inputVal }];
    runOps(searchOps);
  }

  function deleteHash() {
    if (!keyVal && !inputVal) return;
    const delOps = [...ops.filter(o => !(o.type === 'insert' && o.key === (keyVal || inputVal))), { type: 'delete', key: keyVal || inputVal }];
    setOps(delOps);
    runOps(delOps);
  }

  function reset() {
    setOps([]);
    setSteps([]);
    setCurStep(null);
    setStepIdx(0);
    engineRef.current?.pause();
  }

  const stack = curStep?.stack || [];
  const queue = curStep?.queue || [];
  const heap = curStep?.heap || [];
  const hashTable = curStep?.table || (probeMode === 'chaining'
    ? Array(tableSize).fill(null).map(() => [])
    : Array(tableSize).fill(null));

  function stepDesc(s) {
    if (!s) {
      if (tab === 'hash') return 'Nhập key-value để thêm vào bảng băm';
      if (tab === 'pq') return 'Nhập giá trị và độ ưu tiên';
      return 'Thêm thao tác để xem';
    }
    if (s.error) return `⚠ ${s.error}`;
    if (s.op === 'push') return `PUSH ${s.val} → đỉnh stack`;
    if (s.op === 'pop') return `POP → lấy ${s.val} từ đỉnh stack`;
    if (s.op === 'pop_done') return `✓ Đã pop ${s.val}`;
    if (s.op === 'peek') return `PEEK → nhìn đỉnh: ${s.val ?? 'rỗng'}`;
    if (s.op === 'enqueue') return `ENQUEUE ${s.val} → vào cuối hàng`;
    if (s.op === 'dequeue') return `DEQUEUE → lấy ${s.val} từ đầu hàng`;
    if (s.op === 'dequeue_done') return `✓ Đã dequeue ${s.val}`;
    if (s.op === 'insert' && tab === 'pq') return `INSERT ${s.val} (priority=${s.priority}) vào heap`;
    if (s.op === 'heapify_up') return `Heapify Up: hoán đổi vị trí [${s.swap?.[0]}] ↔ [${s.swap?.[1]}]`;
    if (s.op === 'heapify_down') return `Heapify Down: hoán đổi vị trí [${s.swap?.[0]}] ↔ [${s.swap?.[1]}]`;
    if (s.op === 'insert_done') return `✓ Đã chèn ${s.val} vào PQ`;
    if (s.op === 'extractMin') return `EXTRACT MIN → lấy ${s.val} (priority=${s.priority})`;
    if (s.op === 'extract_done') return `✓ Đã trích xuất min: ${s.val}`;
    if (s.op === 'hash') return `hash("${s.key}") = ${s.idx} | ${s.formula || ''}`;
    if (s.op === 'insert') return `Chèn "${s.key}": ${s.val} vào bucket [${s.idx}]`;
    if (s.op === 'probe') return `Tìm trong bucket [${s.idx}], vị trí ${s.probing}`;
    if (s.op === 'probe_linear') return `Dò tuyến tính: slot [${s.idx}] bị chiếm (dò lần ${(s.probeCount||0)+1})`;
    if (s.op === 'found') return `✓ Tìm thấy "${s.key}" tại [${s.idx}]`;
    if (s.op === 'notfound') return `✗ Không tìm thấy "${s.key}"`;
    if (s.op === 'delete') return `Xóa "${s.key}" tại [${s.idx}]`;
    if (s.op === 'delete_done') return `✓ Đã xóa "${s.key}"`;
    if (s.op === 'table_full') return `⚠ Bảng đầy, không thể chèn "${s.key}"`;
    return '';
  }

  // Heap tree layout helper
  function heapLayout(heap) {
    if (!heap.length) return { nodes: [], edges: [] };
    const nodes = [], edges = [];
    const W = 400, rowH = 60;
    for (let i = 0; i < heap.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      const posInLevel = i - (Math.pow(2, level) - 1);
      const totalInLevel = Math.pow(2, level);
      const x = ((posInLevel + 0.5) / totalInLevel) * W;
      const y = 30 + level * rowH;
      nodes.push({ i, val: heap[i].val, priority: heap[i].priority, x, y });
      if (i > 0) {
        const pi = Math.floor((i - 1) / 2);
        const pl = Math.floor(Math.log2(pi + 1));
        const pp = pi - (Math.pow(2, pl) - 1);
        const pt = Math.pow(2, pl);
        const px = ((pp + 0.5) / pt) * W;
        const py = 30 + pl * rowH;
        edges.push({ x1: px, y1: py, x2: x, y2: y });
      }
    }
    return { nodes, edges };
  }

  const heapViz = heapLayout(heap);
  const swapIdxs = curStep?.swap || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Data Structures</h1>
        <p>Stack, Queue, Priority Queue và Hash Table — tùy chỉnh và trực quan hóa</p>
      </div>

      <div className="algo-tabs">
        {[['stack','Stack'],['queue','Queue'],['pq','Priority Queue'],['hash','Hash Table']].map(([k,n]) => (
          <button key={k} className={`algo-tab ${tab === k ? 'active' : ''}`}
            style={{ '--tab-color': '#58a6ff' }}
            onClick={() => { setTab(k); reset(); }}>
            {n}
          </button>
        ))}
      </div>

      <div className="struct-workspace">
        <div className="struct-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className={`step-text ${curStep?.error ? 'step-error' : ''}`}>{stepDesc(curStep)}</span>
          </div>

          {tab === 'stack' && (
            <div className="stack-viz">
              <div className="stack-label top-label">↑ TOP</div>
              <div className="stack-items">
                {stack.length === 0 && <div className="empty-msg">Stack rỗng</div>}
                {[...stack].reverse().map((v, i) => (
                  <div key={i} className={`stack-item ${
                    i === 0 && curStep?.highlight === stack.length - 1 ? (curStep.action === 'leaving' ? 'leaving' : 'highlight') : ''
                  }`} style={{animationDelay: `${i * 20}ms`}}>
                    <span className="item-idx">[{stack.length - 1 - i}]</span>
                    <span className="item-val">{v}</span>
                    {i === 0 && <span className="ptr">← top</span>}
                  </div>
                ))}
              </div>
              <div className="stack-label">↓ BOTTOM</div>
              <div className="stack-info">Kích thước: {stack.length}</div>
            </div>
          )}

          {tab === 'queue' && (
            <div className="queue-viz">
              <div className="queue-meta">
                <span className="ptr-label">FRONT →</span>
                <div className="queue-items">
                  {queue.length === 0 && <div className="empty-msg">Queue rỗng</div>}
                  {queue.map((v, i) => (
                    <div key={i} className={`queue-item ${
                      curStep?.action === 'entering' && i === queue.length - 1 ? 'highlight' : ''
                    } ${curStep?.action === 'leaving' && i === 0 ? 'removing' : ''}`}>
                      <span className="item-idx">[{i}]</span>
                      <span className="item-val">{v}</span>
                    </div>
                  ))}
                </div>
                <span className="ptr-label">← REAR</span>
              </div>
              <div className="stack-info">Kích thước: {queue.length}</div>
            </div>
          )}

          {tab === 'pq' && (
            <div className="pq-viz">
              <div className="pq-tree">
                {heap.length === 0 && <div className="empty-msg">Priority Queue rỗng</div>}
                <svg width="100%" viewBox="0 0 400 240" style={{display: heap.length ? 'block' : 'none'}}>
                  {heapViz.edges.map((e, i) => (
                    <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#1e3a5f" strokeWidth="1.5" />
                  ))}
                  {heapViz.nodes.map((n, i) => {
                    const isSwap = swapIdxs.includes(n.i);
                    const isMin = n.i === 0;
                    return (
                      <g key={i} style={isSwap ? {animation: 'nodeSwap 0.3s ease'} : {}}>
                        <circle cx={n.x} cy={n.y} r={18}
                          fill={isSwap ? '#f97316' : isMin ? '#10b981' : '#1d4ed8'}
                          stroke="#0a0e1a" strokeWidth="2" />
                        <text x={n.x} y={n.y - 2} textAnchor="middle" dominantBaseline="central"
                          fill="white" fontSize="11" fontWeight="700" fontFamily="monospace">{n.val}</text>
                        <text x={n.x} y={n.y + 10} textAnchor="middle"
                          fill={isMin ? '#86efac' : '#4a6b8a'} fontSize="9" fontFamily="monospace">p={n.priority}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="pq-array">
                <span style={{fontSize:10, color:'#4a6b8a'}}>Heap array:</span>
                {heap.map((item, i) => (
                  <div key={i} className={`pq-cell ${swapIdxs.includes(i) ? 'swap' : ''} ${i === 0 ? 'min' : ''}`}>
                    <span>[{i}]</span>
                    <span className="pq-val">{item.val}</span>
                    <span className="pq-pri">p={item.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'hash' && (
            <div className="hash-viz">
              {(probeMode === 'chaining' ? hashTable : hashTable).map((bucket, i) => {
                const isLinear = probeMode === 'linear';
                const cell = isLinear ? bucket : null;
                const items = isLinear ? (cell ? [cell] : []) : (bucket || []);
                return (
                  <div key={i} className={`hash-row ${curStep?.idx === i ? 'active' : ''}`}>
                    <div className="hash-idx">[{i}]</div>
                    <div className="hash-bucket">
                      {items.map((item, j) => (
                        <div key={j} className={`hash-item ${
                          curStep?.op === 'insert' && curStep.idx === i && (isLinear || j === items.length - 1) ? 'new' : ''
                        } ${curStep?.op === 'delete' && curStep.idx === i ? 'deleting' : ''}`}>
                          {item === undefined ? <span style={{color:'#4a6b8a',fontStyle:'italic'}}>tombstone</span>
                            : `"${item.key}": ${item.val}`}
                        </div>
                      ))}
                      {items.length === 0 && !cell && <div className="hash-empty">—</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="struct-sidebar">
          <div className="ctrl-section">
            <h3>Thao tác</h3>
            {tab === 'hash' ? (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <input className="arr-input" placeholder="Key..." value={keyVal} onChange={e=>setKeyVal(e.target.value)} />
                <input className="arr-input" placeholder="Value..." value={inputVal} onChange={e=>setInputVal(e.target.value)} />
                <button className="btn-generate" onClick={() => addOp('insert')}>Thêm (Insert)</button>
                <button className="btn-random" onClick={searchHash}>Tìm kiếm</button>
                <button className="btn-danger" onClick={deleteHash}>Xóa</button>
              </div>
            ) : tab === 'pq' ? (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <input className="arr-input" placeholder="Giá trị..." value={inputVal} onChange={e=>setInputVal(e.target.value)} />
                <input className="arr-input" placeholder="Độ ưu tiên (số nhỏ = ưu tiên cao)..." value={priorityVal}
                  onChange={e=>setPriorityVal(e.target.value)} type="number" />
                <button className="btn-generate" onClick={() => addOp('insert')}>INSERT</button>
                <button className="btn-random" onClick={() => addOp('extractMin')}>EXTRACT MIN</button>
                <button className="btn-random" onClick={() => addOp('peek')}>PEEK</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <input className="arr-input" placeholder="Giá trị..." value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addOp(tab === 'stack' ? 'push' : 'enqueue')}
                  type="number" />
                <button className="btn-generate" onClick={() => addOp(tab === 'stack' ? 'push' : 'enqueue')}>
                  {tab === 'stack' ? 'PUSH' : 'ENQUEUE'}
                </button>
                <button className="btn-random" onClick={() => addOp(tab === 'stack' ? 'pop' : 'dequeue')}>
                  {tab === 'stack' ? 'POP' : 'DEQUEUE'}
                </button>
                <button className="btn-random" onClick={() => addOp('peek')}>PEEK</button>
              </div>
            )}
          </div>

          {tab === 'hash' && (
            <div className="ctrl-section">
              <h3>Hàm băm</h3>
              <select className="arr-input" style={{width:'100%',marginBottom:6}} value={hashFormula} onChange={e=>setHashFormula(e.target.value)}>
                <option value="default">Polynomial (×31)</option>
                <option value="sum">Sum of charCodes</option>
                <option value="djb2">DJB2</option>
                <option value="custom">Tùy chỉnh...</option>
              </select>
              {hashFormula === 'custom' && (
                <textarea className="arr-input" style={{width:'100%',height:70,fontFamily:'monospace',fontSize:10,resize:'vertical'}}
                  value={customFormula} onChange={e=>setCustomFormula(e.target.value)}
                  placeholder="for (const c of k) h = (h * 31 + c.charCodeAt(0)) % size;" />
              )}
              <div style={{fontSize:10,color:'#4a6b8a',marginTop:4}}>
                Biến: <code style={{color:'#58a6ff'}}>k</code>=key, <code style={{color:'#58a6ff'}}>h</code>=hash(init=0), <code style={{color:'#58a6ff'}}>size</code>=bảng
              </div>
              <h3 style={{marginTop:10}}>Chế độ xử lý va chạm</h3>
              <div style={{display:'flex',gap:6}}>
                <button className={`mode-btn ${probeMode==='chaining'?'active':''}`} onClick={()=>{ setProbeMode('chaining'); reset(); }}>Chaining</button>
                <button className={`mode-btn ${probeMode==='linear'?'active':''}`} onClick={()=>{ setProbeMode('linear'); reset(); }}>Linear Probing</button>
              </div>
              <div style={{marginTop:8,display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:'#4a6b8a'}}>Kích thước bảng:</span>
                <input type="number" min={5} max={31} value={tableSize}
                  onChange={e=>{ setTableSize(parseInt(e.target.value)||11); reset(); }}
                  className="arr-input" style={{width:60}} />
              </div>
            </div>
          )}

          <div className="ctrl-section">
            <h3>Ví dụ nhanh</h3>
            <button className="btn-random" style={{width:'100%', fontSize:11}} onClick={() => {
              let demo;
              if (tab === 'stack') demo = [5,3,8,1,9].map(v=>({type:'push',val:v})).concat([{type:'pop'},{type:'peek'}]);
              else if (tab === 'queue') demo = [10,20,30].map(v=>({type:'enqueue',val:v})).concat([{type:'dequeue'},{type:'dequeue'}]);
              else if (tab === 'pq') demo = [
                {type:'insert',val:'A',priority:5},
                {type:'insert',val:'B',priority:2},
                {type:'insert',val:'C',priority:8},
                {type:'insert',val:'D',priority:1},
                {type:'extractMin'},
                {type:'extractMin'},
              ];
              else demo = [
                {type:'insert',key:'name',val:'Dũng'},
                {type:'insert',key:'age',val:'20'},
                {type:'insert',key:'uni',val:'UET'},
                {type:'search',key:'age'},
              ];
              setOps(demo); runOps(demo);
            }}>⚄ Chạy ví dụ mẫu</button>
          </div>

          <div className="ctrl-section">
            <button className="btn-danger" style={{width:'100%'}} onClick={reset}>✕ Reset</button>
          </div>

          <div className="ctrl-section">
            <h3>Ghi chú</h3>
            <div style={{fontSize: 11, color: '#4a6b8a', lineHeight: 1.7}}>
              {tab === 'stack' && <><b style={{color:'#8b9eb5'}}>Stack</b>: LIFO. Push/Pop O(1).</>}
              {tab === 'queue' && <><b style={{color:'#8b9eb5'}}>Queue</b>: FIFO. Enqueue/Dequeue O(1).</>}
              {tab === 'pq' && <><b style={{color:'#8b9eb5'}}>Min-Heap</b>: ExtractMin O(log n), Insert O(log n).</>}
              {tab === 'hash' && <><b style={{color:'#8b9eb5'}}>Hash Table</b>: Trung bình O(1). Va chạm xử lý bằng {probeMode === 'chaining' ? 'Chaining' : 'Linear Probing'}.</>}
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

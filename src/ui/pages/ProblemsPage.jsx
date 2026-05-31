import { useState, useRef } from 'react';
import { twoSumBruteForce, twoSumTwoPointer, twoSumHashMap } from '../../core/problems/index.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './ProblemsPage.css';

const METHODS = {
  brute: { name: 'Brute Force', color: '#ef4444', complexity: 'O(n²)', desc: 'Thử mọi cặp i,j' },
  twoptr: { name: 'Two Pointer', color: '#10b981', complexity: 'O(n log n)', desc: 'Sắp xếp + 2 con trỏ' },
  hashmap: { name: 'Hash Map', color: '#58a6ff', complexity: 'O(n)', desc: 'Lưu complement vào map' },
};

function parseArr(s) { return s.split(/[,\s]+/).map(Number).filter(n => !isNaN(n)); }

export default function ProblemsPage() {
  const [method, setMethod] = useState('brute');
  const [arrInput, setArrInput] = useState('2 7 11 15');
  const [targetInput, setTargetInput] = useState('9');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const engineRef = useRef(null);

  function run() {
    const arr = parseArr(arrInput);
    const target = parseInt(targetInput);
    if (arr.length < 2 || isNaN(target)) return;
    engineRef.current?.pause();
    let s;
    if (method === 'brute') s = twoSumBruteForce(arr, target);
    else if (method === 'twoptr') s = twoSumTwoPointer(arr, target);
    else s = twoSumHashMap(arr, target);
    setSteps(s); setStepIdx(0); setCurStep(s[0] || null);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
  }

  const arr = curStep?.array || parseArr(arrInput);
  const lo = curStep?.lo, hi = curStep?.hi;
  const ci = curStep?.i, cj = curStep?.j;
  const found = curStep?.type === 'found';
  const map = curStep?.map || {};

  function cellColor(idx) {
    if (found && (idx === ci || idx === cj || idx === lo || idx === hi)) return '#10b981';
    if (curStep?.type === 'compare') {
      if (method === 'brute' && (idx === ci || idx === cj)) return '#f59e0b';
      if (method === 'twoptr' && (idx === lo || idx === hi)) return '#f59e0b';
      if (method === 'hashmap' && idx === ci) return '#f59e0b';
    }
    if (method === 'twoptr' && idx === lo) return '#58a6ff';
    if (method === 'twoptr' && idx === hi) return '#a78bfa';
    if (method === 'hashmap' && curStep?.type === 'store' && idx === ci) return '#58a6ff';
    return '#1e3a5f';
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Algorithm Problems</h1>
        <p>Two Sum — Brute Force / Two Pointer / Hash Map</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(METHODS).map(([k, v]) => (
          <button key={k} className={`algo-tab ${method === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => { setMethod(k); setSteps([]); setCurStep(null); }}>
            {v.name}
            <span style={{ display: 'block', fontSize: 9, color: '#4a6b8a' }}>{v.complexity}</span>
          </button>
        ))}
      </div>

      <div className="prob-workspace">
        <div className="prob-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className={`step-text ${found ? 'found-text' : ''}`}>{curStep?.desc || 'Nhấn ▶ để chạy'}</span>
          </div>

          {/* Array visualization */}
          <div className="prob-array-wrap">
            <div className="prob-array">
              {arr.map((v, i) => (
                <div key={i} className="prob-cell-wrap">
                  <div className="prob-cell" style={{ background: cellColor(i), borderColor: cellColor(i) !== '#1e3a5f' ? cellColor(i) : '#1e2d3d', transition: 'all 0.2s' }}>
                    <span className="prob-idx">[{i}]</span>
                    <span className="prob-val">{v}</span>
                  </div>
                  {/* Pointer labels */}
                  <div className="prob-ptr-row">
                    {method === 'twoptr' && lo === i && <span className="prob-ptr ptr-lo">lo</span>}
                    {method === 'twoptr' && hi === i && <span className="prob-ptr ptr-hi">hi</span>}
                    {method === 'brute' && ci === i && <span className="prob-ptr ptr-lo">i</span>}
                    {method === 'brute' && cj === i && <span className="prob-ptr ptr-hi">j</span>}
                    {method === 'hashmap' && ci === i && <span className="prob-ptr ptr-lo">cur</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="prob-target-badge">Target = <b>{targetInput}</b></div>
          </div>

          {/* Method-specific visualization */}
          {method === 'twoptr' && curStep?.type === 'compare' && (
            <div className="twoptr-viz">
              <div className="eq-line">
                <span className="eq-part" style={{ color: '#58a6ff' }}>{arr[lo]}</span>
                <span className="eq-op">+</span>
                <span className="eq-part" style={{ color: '#a78bfa' }}>{arr[hi]}</span>
                <span className="eq-op">=</span>
                <span className="eq-result" style={{ color: curStep?.sum === parseInt(targetInput) ? '#10b981' : curStep?.sum < parseInt(targetInput) ? '#f59e0b' : '#ef4444' }}>
                  {curStep?.sum}
                </span>
                <span className="eq-op" style={{ color: '#4a6b8a' }}>
                  {curStep?.sum < parseInt(targetInput) ? '< target → lo++' : curStep?.sum > parseInt(targetInput) ? '> target → hi--' : '= target ✓'}
                </span>
              </div>
            </div>
          )}

          {method === 'hashmap' && Object.keys(map).length > 0 && (
            <div className="hashmap-viz">
              <div className="hashmap-title">HashMap (value → index):</div>
              <div className="hashmap-entries">
                {Object.entries(map).map(([k, v]) => (
                  <div key={k} className={`hm-entry ${curStep?.complement == k ? 'hm-searching' : ''}`}>
                    <span className="hm-key">{k}</span>
                    <span className="hm-arrow">→</span>
                    <span className="hm-val">index [{v}]</span>
                    {curStep?.complement == k && <span className="hm-hit">✓ found!</span>}
                  </div>
                ))}
                {curStep?.type === 'check' && (
                  <div className="hm-searching-for">
                    Đang tìm complement = {curStep.complement}
                  </div>
                )}
              </div>
            </div>
          )}

          {found && (
            <div className="found-banner">
              ✓ Tìm thấy! Chỉ số [{curStep.j ?? curStep.lo ?? '?'}, {curStep.i ?? curStep.hi ?? '?'}]
              → {arr[curStep.j ?? curStep.lo ?? 0]} + {arr[curStep.i ?? curStep.hi ?? 0]} = {targetInput}
            </div>
          )}
          {curStep?.type === 'not_found' && (
            <div className="found-banner notfound">✗ Không tìm thấy cặp nào có tổng = {targetInput}</div>
          )}
        </div>

        <div className="prob-sidebar">
          <div className="ctrl-section">
            <h3>Two Sum</h3>
            <label style={{ fontSize: 11, color: '#4a6b8a' }}>Mảng:</label>
            <input className="arr-input" value={arrInput} onChange={e => setArrInput(e.target.value)}
              style={{ width: '100%', marginTop: 4 }} placeholder="2 7 11 15" />
            <label style={{ fontSize: 11, color: '#4a6b8a', marginTop: 8, display: 'block' }}>Target:</label>
            <input className="arr-input" value={targetInput} onChange={e => setTargetInput(e.target.value)}
              type="number" style={{ width: '100%', marginTop: 4 }} />
            <button className="btn-generate" style={{ width: '100%', marginTop: 10 }} onClick={run}>▶ Chạy</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {[['2 7 11 15', '9'], ['3 2 4', '6'], ['1 4 8 7 3 15', '11']].map(([a, t]) => (
                <button key={a} className="btn-random" style={{ fontSize: 10 }}
                  onClick={() => { setArrInput(a); setTargetInput(t); }}>
                  [{a}] target={t}
                </button>
              ))}
            </div>
          </div>

          <div className="ctrl-section">
            <h3>So sánh độ phức tạp</h3>
            <div className="complexity-table">
              {Object.entries(METHODS).map(([k, v]) => (
                <div key={k} className={`cplx-row ${method === k ? 'active' : ''}`}>
                  <span className="cplx-name">{v.name}</span>
                  <span className="cplx-val" style={{ color: v.color }}>{v.complexity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ctrl-section">
            <h3>{METHODS[method].name}</h3>
            <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
              {method === 'brute' && 'Dùng 2 vòng lặp lồng nhau, thử tất cả cặp (i, j). Đơn giản nhưng O(n²).'}
              {method === 'twoptr' && 'Sắp xếp mảng, dùng lo và hi hội tụ vào nhau. O(n log n).'}
              {method === 'hashmap' && 'Với mỗi phần tử, tra cứu complement trong map. O(n) thời gian và không gian.'}
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

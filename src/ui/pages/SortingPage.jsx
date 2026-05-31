import { useState, useRef, useEffect, useCallback } from 'react';
import { selectionSort, insertionSort, mergeSort, quickSort, bubbleSort, heapSort, countingSort, radixSort, shellSort, bucketSort } from '../../core/sorting/index.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './SortingPage.css';

const ALGOS = {
  selection: { fn: selectionSort, name: 'Selection Sort', color: '#f59e0b' },
  insertion: { fn: insertionSort, name: 'Insertion Sort', color: '#10b981' },
  merge:     { fn: mergeSort,     name: 'Merge Sort',     color: '#8b5cf6' },
  quick:     { fn: quickSort,     name: 'Quick Sort',     color: '#ef4444' },
  bubble:    { fn: bubbleSort,    name: 'Bubble Sort',    color: '#06b6d4' },
  heap:      { fn: heapSort,      name: 'Heap Sort',      color: '#f97316' },
  counting:  { fn: countingSort,  name: 'Counting Sort',  color: '#a78bfa' },
  radix:    { fn: radixSort,   name: 'Radix Sort',   color: '#ec4899' },
  shell:    { fn: shellSort,   name: 'Shell Sort',   color: '#06b6d4' },
  bucket:   { fn: bucketSort,  name: 'Bucket Sort',  color: '#84cc16' },
};

function parseInput(str) { return str.split(/[,\s]+/).map(Number).filter(n => !isNaN(n) && n > 0); }
function randomArr(n = 16) { return Array.from({ length: n }, () => Math.floor(Math.random() * 80) + 5); }

export default function SortingPage() {
  const [algo, setAlgo] = useState('selection');
  const [inputVal, setInputVal] = useState('');
  const [step, setStep] = useState(null);
  const [steps, setSteps] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(300);
  const [stepIdx, setStepIdx] = useState(0);
  const engineRef = useRef(null);
  const [baseArray, setBaseArray] = useState(randomArr);

  const getColor = useCallback((step, idx) => {
    if (!step) return '#1e3a5f';
    if (step.done || step.sorted?.includes(idx)) return '#10b981';
    if (step.swapped?.includes(idx)) return '#ef4444';
    if (step.comparing?.includes(idx)) return '#f59e0b';
    if (step.pivot === idx) return '#8b5cf6';
    if (step.pivotPlaced === idx) return '#10b981';
    if (step.placing === idx) return '#a78bfa';
    if (step.placed === idx) return '#06b6d4';
    if (step.highlight?.includes(idx)) return '#f59e0b';
    if (step.merging && idx >= step.merging[0] && idx <= step.merging[1]) return '#1d4ed8';
    if (step.placing === idx) return '#a78bfa';
    return '#1e3a5f';
  }, []);

  function run(arr) {
    engineRef.current?.pause();
    const s = ALGOS[algo].fn(arr);
    setSteps(s); setStep(s[0]); setStepIdx(0); setPlaying(false);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setStep(step); setStepIdx(idx + 1); },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
  }

  function handleGenerate() {
    const arr = inputVal.trim() ? parseInput(inputVal) : randomArr();
    if (arr.length < 2) return;
    setBaseArray(arr); run(arr);
  }

  useEffect(() => { run(baseArray); }, [algo]);

  const arr = step?.array || baseArray;
  const maxVal = Math.max(...arr, 1);
  const isCounting = algo === 'counting';
  const count = step?.count || [];
  const min = step?.min ?? 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sorting Algorithms</h1>
        <p>Selection, Insertion, Merge, Quick, Bubble, Heap, Counting Sort</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button key={k} className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => setAlgo(k)}>
            {v.name}
          </button>
        ))}
      </div>

      <div className="input-row">
        <input className="arr-input" placeholder="Nhập mảng (vd: 5 3 8 1 9) hoặc để trống để random..."
          value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()} style={{ flex: 1 }} />
        <button className="btn-generate" onClick={handleGenerate}>▶ Chạy</button>
        <button className="btn-random" onClick={() => { setInputVal(''); setBaseArray(randomArr()); run(randomArr()); }}>⚄ Random</button>
      </div>

      <div className="step-desc" style={{ padding: '6px 24px' }}>
        <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
        <span className="step-text">{step?.desc || step?.type || 'Nhấn ▶ để chạy'}</span>
      </div>

      <div className="bars-container">
        {arr.map((v, i) => (
          <div key={i} className="bar-wrap">
            <div className="bar" style={{ height: `${(v / maxVal) * 100}%`, background: getColor(step, i), transition: 'height 0.1s, background 0.15s' }} />
            <span className="bar-label">{v}</span>
          </div>
        ))}
      </div>

      {/* Counting Sort extra viz */}
      {isCounting && count.length > 0 && (
        <div className="count-panel">
          <div className="count-title">
            Count Array
            {step?.phase === 'count' && <span className="count-badge">Đếm tần suất</span>}
            {step?.phase === 'prefix' && <span className="count-badge" style={{background:'rgba(88,166,255,0.2)',color:'#58a6ff'}}>Prefix Sum</span>}
            {step?.phase === 'output' && <span className="count-badge" style={{background:'rgba(167,139,250,0.2)',color:'#a78bfa'}}>Xây dựng output</span>}
          </div>
          <div className="count-cells">
            {count.map((v, i) => (
              <div key={i} className={`count-cell ${step?.countIdx === i ? 'active' : ''} ${step?.prefixIdx === i ? 'prefix' : ''}`}>
                <span className="count-idx">{i + min}</span>
                <span className="count-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {algo === 'radix' && step?.buckets && (
        <div className="count-panel">
          <div className="count-title">
            Buckets (hàng {step.exp})
            {step.phase === 'distribute' && <span className="count-badge">Phân phối</span>}
            {step.phase === 'collect' && <span className="count-badge" style={{background:'rgba(88,166,255,0.2)',color:'#58a6ff'}}>Gom lại</span>}
          </div>
          <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
            {step.buckets.map((bucket, i) => (
              <div key={i} className="count-cell"
                style={{borderColor: step.bucket === i ? '#ec4899' : '#1e2d3d', minWidth: 36}}>
                <span className="count-idx">[{i}]</span>
                <span className="count-val" style={{fontSize:10, color:'#8b9eb5'}}>
                  {bucket.length ? bucket.join(',') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {algo === 'bucket' && step?.buckets && (
        <div className="count-panel">
          <div className="count-title">
            Buckets
            {step.phase === 'distribute' && <span className="count-badge" style={{background:'rgba(132,204,22,0.15)',color:'#84cc16'}}>Phân phối</span>}
            {step.phase === 'sort_bucket' && <span className="count-badge" style={{background:'rgba(88,166,255,0.15)',color:'#58a6ff'}}>Sắp xếp bucket</span>}
            {step.phase === 'collect' && <span className="count-badge" style={{background:'rgba(167,139,250,0.15)',color:'#a78bfa'}}>Gom lại</span>}
          </div>
          <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
            {step.buckets.map((bucket, i) => (
              <div key={i} className="count-cell"
                style={{borderColor: step.bucket === i ? '#84cc16' : '#1e2d3d', minWidth: 48}}>
                <span className="count-idx">[{i}]</span>
                <span className="count-val" style={{fontSize:10, color:'#8b9eb5'}}>
                  {bucket.length ? bucket.join(',') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {algo === 'shell' && step?.gap && (
        <div className="count-panel">
          <div className="count-title">
            Shell Sort
            <span className="count-badge" style={{background:'rgba(6,182,212,0.15)',color:'#06b6d4'}}>Gap = {step.gap}</span>
            {step.phase === 'compare' && <span className="count-badge">So sánh</span>}
            {step.phase === 'place' && <span className="count-badge" style={{background:'rgba(16,185,129,0.15)',color:'#10b981'}}>Đặt vào</span>}
          </div>
          <div style={{fontSize:11, color:'#4a6b8a'}}>
            Knuth sequence: 1 → 4 → 13 → 40 → ... Đang dùng gap = <b style={{color:'#06b6d4'}}>{step.gap}</b>
          </div>
        </div>
      )}

      <Controls
        playing={playing}
        onPlay={() => { setPlaying(true); engineRef.current?.play(); }}
        onPause={() => { setPlaying(false); engineRef.current?.pause(); }}
        onReset={() => { setPlaying(false); engineRef.current?.reset(); setStepIdx(0); setStep(steps[0]); }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed} onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx} total={steps.length}
      />
    </div>
  );
}

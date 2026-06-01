import { useState, useRef } from 'react';
import {
  tstInsert, tstSearch, tstToLayout,
  lsdRadixSort, msdRadixSort,
  kmpSearch, buildKMPTable,
  boyerMoore, rabinKarp,
  radixQuick3Way, buildSuffixArray
} from '../../core/string/index.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './StringPage.css';

const ALGOS = {
  tst: { name: 'TST', desc: 'Ternary Search Tree' },
  lsd: { name: 'LSD Radix', desc: 'LSD Radix Sort' },
  msd: { name: 'MSD Radix', desc: 'MSD Radix Sort' },
  kmp: { name: 'KMP', desc: 'Knuth-Morris-Pratt' },
  bm: { name: 'Boyer-Moore', desc: 'Boyer-Moore Search' },
  rk:      { name: 'Rabin-Karp',   desc: 'Rabin-Karp Hash Search' },
  radix3:  { name: '3-Way Quick',  desc: '3-Way Radix Quicksort' },
  suffix:  { name: 'Suffix Array', desc: 'Suffix Array + LCP' },
};

export default function StringPage() {
  const [algo, setAlgo] = useState('kmp');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);

  // KMP / BM / RK
  const [textInput, setTextInput] = useState('AABAACAADAABAABA');
  const [patInput, setPatInput] = useState('AABA');

  // TST
  const [tstRoot, setTstRoot] = useState(null);
  const [tstWords, setTstWords] = useState([]);
  const [tstInput, setTstInput] = useState('');
  const [tstSearch_, setTstSearch_] = useState('');
  const [tstResult, setTstResult] = useState(null);

  // LSD / MSD
  const [radixInput, setRadixInput] = useState('she sells sea shells at the shore');

  const engineRef = useRef(null);

  function runSteps(s) {
    engineRef.current?.pause();
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

  function runSearch() {
    let s;
    if (algo === 'kmp') s = kmpSearch(textInput, patInput);
    else if (algo === 'bm') s = boyerMoore(textInput, patInput);
    else s = rabinKarp(textInput, patInput);
    runSteps(s);
    engineRef.current?.play();
    setPlaying(true);
  }

  function runRadix() {
    const words = radixInput.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const s = algo === 'lsd' ? lsdRadixSort(words) : msdRadixSort(words);
    runSteps(s);
    engineRef.current?.play();
    setPlaying(true);
  }

  function run3Way() {
    const words = radixInput.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const s = radixQuick3Way(words);
    runSteps(s);
    engineRef.current?.play();
    setPlaying(true);
  }

  const [suffixInput, setSuffixInput] = useState('mississippi');

  function runSuffix() {
    if (!suffixInput.trim()) return;
    const s = buildSuffixArray(suffixInput.trim());
    runSteps(s);
    engineRef.current?.play();
    setPlaying(true);
  }

  function handleTstInsert() {
    if (!tstInput.trim()) return;
    const word = tstInput.trim().toLowerCase();
    const s = [];
    const res = tstInsert(tstRoot ? JSON.parse(JSON.stringify(tstRoot)) : null, word, s);
    setTstRoot(res.root);
    setTstWords(prev => [...new Set([...prev, word])]);
    setTstInput('');
    runSteps(s);
    engineRef.current?.play();
    setPlaying(true);
  }

  function handleTstSearch() {
    if (!tstSearch_.trim() || !tstRoot) return;
    const word = tstSearch_.trim().toLowerCase();
    const s = [];
    const res = tstSearch(tstRoot, word, s);
    setTstResult(res.found);
    runSteps(s);
    engineRef.current?.play();
    setPlaying(true);
  }

  // Compute matches for highlighting
  const matches = curStep?.type === 'done' ? (curStep.matches || []) : [];
  const lps = steps.find(s => s?.type === 'lps')?.lps || [];

  function stepDesc(s) {
    if (!s) return 'Nhấn ▶ để chạy';
    if (s.type === 'lps') return `Bảng LPS: [${s.lps?.join(', ')}]`;
    if (s.type === 'compare') return `So sánh text[${s.ti}]='${s.char_t}' với pattern[${s.pi}]='${s.char_p}' ${s.match === false ? '✗ Không khớp' : s.match === true ? '✓ Khớp' : ''}`;
    if (s.type === 'match') return `✓ Tìm thấy khớp tại vị trí ${s.pos}!`;
    if (s.type === 'shift') return `Dịch pattern: ${s.from !== undefined ? `j từ ${s.from} → ${s.to}` : `${s.amount} ký tự (${s.reason})`}`;
    if (s.type === 'align') return `Căn pattern tại vị trí ${s.shift}`;
    if (s.type === 'bad_char_table') return `Bảng Bad Character: ${Object.entries(s.table).map(([k,v])=>`'${k}'→${v}`).join(', ')}`;
    if (s.type === 'pattern_hash') return `Hash pattern="${s.pattern}": ${s.hash} (base=${s.base})`;
    if (s.type === 'window') return `Cửa sổ tại pos=${s.pos}, hash=${s.hash} ${s.match ? '→ khớp hash!' : '→ không khớp'}`;
    if (s.type === 'hash_collision') return `⚠ Va chạm hash tại pos=${s.pos}, kiểm tra ký tự...`;
    if (s.type === 'done') return `✓ Xong! ${s.matches?.length ? `Tìm thấy ${s.matches.length} khớp: ${s.matches.join(', ')}` : 'Không tìm thấy'}`;
    if (s.type === 'init' && (algo === 'lsd' || algo === 'msd')) return `Khởi tạo: ${s.arr?.length} từ, độ dài tối đa W=${s.W}`;
    if (s.type === 'pass_start') return `${algo.toUpperCase()} Pass ${s.pass ?? ''}: xử lý ký tự tại vị trí [${s.digit}]`;
    if (s.type === 'bucket') return `"${s.word}" → bucket['${s.char}'] (code=${s.code})`;
    if (s.type === 'collected') return `Gom bucket về mảng sau pass [${s.digit}]`;
    if (s.type === 'create_node') return `Tạo nút '${s.char}' tại độ sâu ${s.depth}`;
    if (s.type === 'visit') return `Thăm nút '${s.nodeChar}', so sánh với '${s.char}'`;
    if (s.type === 'mark_end') return `✓ Đánh dấu kết thúc từ "${s.word}"`;
    if (s.type === 'found') return `✓ Tìm thấy từ "${s.word}" trong TST`;
    if (s.type === 'not_found') return `✗ Không tìm thấy "${s.word}"`;
    if (s.type === 'balance_check') return '';
    return JSON.stringify(s).slice(0, 80);
  }

  const isSearchAlgo = ['kmp','bm','rk'].includes(algo);
  const isRadixAlgo = ['lsd','msd'].includes(algo);
  const isTST = algo === 'tst';
  const is3Way = algo === 'radix3';
  const isSuffix = algo === 'suffix';

  // For pattern matching highlight
  const curTi = curStep?.ti;
  const curPi = curStep?.pi;
  const curPos = curStep?.pos;
  const curShift = curStep?.shift ?? (isSearchAlgo ? steps.slice(0, stepIdx).filter(s => s?.type === 'align').at(-1)?.shift ?? 0 : 0);

  // Current sorted array
  const curArr = curStep?.arr || (isRadixAlgo ? radixInput.trim().split(/\s+/).filter(Boolean) : []);
  const sortedArr = steps.find(s => s?.type === 'done')?.arr || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>String Algorithms</h1>
        <p>TST, LSD/MSD Radix Sort, KMP, Boyer-Moore, Rabin-Karp</p>
      </div>

      <div className="algo-tabs" style={{flexWrap:'wrap'}}>
        {Object.entries(ALGOS).map(([k, v]) => (
          <button key={k} className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': '#58a6ff' }}
            onClick={() => { setAlgo(k); setSteps([]); setCurStep(null); setTstResult(null); }}>
            {v.name}
            <span style={{fontSize:9,display:'block',color:'#4a6b8a',lineHeight:1.2}}>{v.desc}</span>
          </button>
        ))}
      </div>

      <div className="string-workspace">
        <div className="string-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep)}</span>
          </div>

          {/* KMP / Boyer-Moore / Rabin-Karp */}
          {isSearchAlgo && (
            <div className="match-viz">
              <div className="match-label">Text:</div>
              <div className="match-text-row">
                {textInput.split('').map((ch, i) => {
                  const isMatch = matches.some(m => i >= m && i < m + patInput.length);
                  const isCur = curTi === i;
                  const inWindow = curStep?.type === 'window' && i >= curStep.pos && i < curStep.pos + patInput.length;
                  const inAlign = curStep?.type === 'align' && i >= curStep.shift && i < curStep.shift + patInput.length;
                  return (
                    <div key={i} className={`match-char ${isMatch ? 'matched' : ''} ${isCur ? 'active' : ''} ${inWindow || inAlign ? 'window' : ''}`}>
                      <span className="mc-idx">{i}</span>
                      <span className="mc-ch">{ch}</span>
                    </div>
                  );
                })}
              </div>

              <div className="match-label">Pattern:</div>
              <div className="match-pat-row">
                {/* Shift the pattern display */}
                {Array(Math.max(0, curShift)).fill(null).map((_, i) => (
                  <div key={i} className="match-char ghost"><span className="mc-ch"> </span></div>
                ))}
                {patInput.split('').map((ch, i) => {
                  const isCur = curPi === i;
                  return (
                    <div key={i} className={`match-char pattern-char ${isCur ? 'active' : ''}`}>
                      <span className="mc-idx">{i}</span>
                      <span className="mc-ch">{ch}</span>
                    </div>
                  );
                })}
              </div>

              {/* KMP LPS table */}
              {algo === 'kmp' && lps.length > 0 && (
                <div className="lps-table">
                  <div className="match-label">LPS Table:</div>
                  <div className="match-text-row">
                    {patInput.split('').map((ch, i) => (
                      <div key={i} className="match-char">
                        <span className="mc-idx">{ch}</span>
                        <span className="mc-ch lps-val">{lps[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BM Bad character */}
              {algo === 'bm' && curStep?.type === 'bad_char_table' && (
                <div className="bad-char-table">
                  <div className="match-label">Bad Character Table:</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>
                    {Object.entries(curStep.table).map(([ch, pos]) => (
                      <div key={ch} className="bc-cell">
                        <span className="bc-ch">'{ch}'</span>
                        <span className="bc-pos">→{pos}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RK hash display */}
              {algo === 'rk' && curStep?.hash !== undefined && (
                <div className="hash-display">
                  Hash cửa sổ hiện tại: <b style={{color:'#58a6ff'}}>{curStep.hash}</b>
                  {curStep.match !== undefined && (
                    <span style={{marginLeft:8, color: curStep.match ? '#10b981' : '#ef4444'}}>
                      {curStep.match ? '= hash(pattern) ✓' : '≠ hash(pattern)'}
                    </span>
                  )}
                </div>
              )}

              {matches.length > 0 && (
                <div className="match-result">
                  ✓ Tìm thấy tại vị trí: {matches.map(m => (
                    <span key={m} className="match-pos">{m}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LSD / MSD */}
          {isRadixAlgo && (
            <div className="radix-viz">
              <div className="radix-arr-label">
                {curStep?.type === 'done' ? '✓ Đã sắp xếp:' : `Pass ${curStep?.pass ?? 0}: `}
                {curStep?.digit !== undefined && <span className="radix-digit-badge">Ký tự [{curStep.digit}]</span>}
              </div>
              <div className="radix-words">
                {curArr.map((w, i) => {
                  const highlighted = curStep?.word === w || curStep?.word === w.padStart(Math.max(...curArr.map(x=>x.length)),' ');
                  const d = curStep?.digit;
                  return (
                    <div key={i} className={`radix-word ${highlighted ? 'radix-active' : ''}`}>
                      {w.split('').map((ch, j) => (
                        <span key={j} className={`radix-ch ${j === d ? 'radix-focus' : ''}`}>{ch}</span>
                      ))}
                    </div>
                  );
                })}
              </div>
              {curStep?.type === 'done' && sortedArr.length > 0 && (
                <div className="radix-result">
                  Kết quả: {sortedArr.join(' → ')}
                </div>
              )}
            </div>
          )}

          {/* TST Visualization */}
          {isTST && (
            <div className="tst-viz">
              {tstWords.length > 0 && (
                <div style={{fontSize:11,color:'#4a6b8a',marginBottom:6}}>
                  Từ đã chèn: {tstWords.map(w => (
                    <span key={w} className="tst-word-tag">{w}</span>
                  ))}
                </div>
              )}
              <TSTViz root={tstRoot} curStep={curStep} />
              {tstResult !== null && (
                <div className={`tst-result ${tstResult ? 'found' : 'notfound'}`}>
                  {tstResult ? `✓ Tìm thấy "${tstSearch_}"` : `✗ Không tìm thấy "${tstSearch_}"`}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="string-sidebar">
          {isSearchAlgo && (
            <div className="ctrl-section">
              <h3>Tìm mẫu trong văn bản</h3>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={{fontSize:11,color:'#4a6b8a'}}>Text:</label>
                <input className="arr-input" value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Văn bản..." />
                <label style={{fontSize:11,color:'#4a6b8a'}}>Pattern:</label>
                <input className="arr-input" value={patInput} onChange={e=>setPatInput(e.target.value)} placeholder="Mẫu cần tìm..." />
                <button className="btn-generate" onClick={runSearch}>▶ Tìm kiếm</button>
              </div>
              <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:3,fontSize:11,color:'#4a6b8a'}}>
                <button className="btn-random" style={{fontSize:10}} onClick={()=>{
                  setTextInput('AABAACAADAABAABA'); setPatInput('AABA');
                }}>Ví dụ AABA</button>
                <button className="btn-random" style={{fontSize:10}} onClick={()=>{
                  setTextInput('the quick brown fox jumps over the lazy dog'); setPatInput('the');
                }}>Ví dụ "the"</button>
              </div>
            </div>
          )}

          {isRadixAlgo && (
            <div className="ctrl-section">
              <h3>{algo === 'lsd' ? 'LSD' : 'MSD'} Radix Sort</h3>
              <label style={{fontSize:11,color:'#4a6b8a'}}>Danh sách từ (cách nhau dấu cách):</label>
              <textarea className="arr-input" style={{width:'100%',height:80,resize:'vertical',marginTop:4}}
                value={radixInput} onChange={e=>setRadixInput(e.target.value)} />
              <button className="btn-generate" style={{marginTop:6,width:'100%'}} onClick={runRadix}>▶ Sắp xếp</button>
              <button className="btn-random" style={{marginTop:4,width:'100%',fontSize:10}} onClick={()=>{
                setRadixInput('she sells sea shells at the shore');
              }}>Ví dụ "she sells sea..."</button>
              <div style={{fontSize:11,color:'#4a6b8a',marginTop:6,lineHeight:1.6}}>
                {algo === 'lsd' ? 'LSD: Sắp xếp từ ký tự phải sang trái, dùng Counting Sort ổn định.' : 'MSD: Sắp xếp từ ký tự trái sang phải, đệ quy theo bucket.'}
              </div>
            </div>
          )}

          {isTST && (
            <div className="ctrl-section">
              <h3>Ternary Search Tree</h3>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <input className="arr-input" placeholder="Nhập từ để chèn..." value={tstInput}
                  onChange={e=>setTstInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleTstInsert()} />
                <button className="btn-generate" onClick={handleTstInsert}>Chèn từ</button>
                <hr style={{border:'none',borderTop:'1px solid #1e2d3d'}} />
                <input className="arr-input" placeholder="Tìm kiếm từ..." value={tstSearch_}
                  onChange={e=>setTstSearch_(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleTstSearch()} />
                <button className="btn-random" onClick={handleTstSearch}>Tìm kiếm</button>
              </div>
              <button className="btn-random" style={{marginTop:8,width:'100%',fontSize:10}} onClick={()=>{
                ['she','sells','sea','shells','by','the','shore'].forEach((w,i) => {
                  setTimeout(() => {
                    const s = [];
                    setTstRoot(prev => {
                      const res = tstInsert(prev ? JSON.parse(JSON.stringify(prev)) : null, w, s);
                      return res.root;
                    });
                    setTstWords(prev => [...new Set([...prev, w])]);
                  }, i * 50);
                });
              }}>⚄ Chèn từ mẫu</button>
            </div>
          )}

          {is3Way && (
            <div className="ctrl-section">
              <h3>3-Way Radix Quicksort</h3>
              <label style={{fontSize:11,color:'#4a6b8a'}}>Danh sách từ:</label>
              <textarea className="arr-input" style={{width:'100%',height:70,resize:'vertical',marginTop:4}}
                value={radixInput} onChange={e => setRadixInput(e.target.value)} />
              <button className="btn-generate" style={{marginTop:6,width:'100%'}} onClick={run3Way}>▶ Sắp xếp</button>
            </div>
          )}

          {isSuffix && (
            <div className="ctrl-section">
              <h3>Suffix Array</h3>
              <label style={{fontSize:11,color:'#4a6b8a'}}>Chuỗi:</label>
              <input className="arr-input" style={{width:'100%',marginTop:4}}
                value={suffixInput} onChange={e => setSuffixInput(e.target.value)}
                placeholder="mississippi" />
              <button className="btn-generate" style={{marginTop:6,width:'100%'}} onClick={runSuffix}>▶ Xây dựng SA</button>
              <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:6}}>
                {['mississippi','banana','abracadabra'].map(w => (
                  <button key={w} className="btn-random" style={{fontSize:10}} onClick={()=>setSuffixInput(w)}>{w}</button>
                ))}
              </div>
            </div>
          )}

          <div className="ctrl-section">
            <h3>Về thuật toán</h3>
            <div style={{fontSize:11,color:'#4a6b8a',lineHeight:1.7}}>
              {algo === 'kmp' && <><b style={{color:'#8b9eb5'}}>KMP</b>: Dùng bảng LPS để bỏ qua các so sánh thừa. O(n+m).</>}
              {algo === 'bm' && <><b style={{color:'#8b9eb5'}}>Boyer-Moore</b>: Dịch pattern dựa vào bad-character. Thực tế rất nhanh.</>}
              {algo === 'rk' && <><b style={{color:'#8b9eb5'}}>Rabin-Karp</b>: Dùng rolling hash. Hay dùng để tìm nhiều mẫu.</>}
              {algo === 'radix3' && <><b style={{color:'#8b9eb5'}}>3-Way Radix Quick</b>: Quicksort theo ký tự, partition 3 phần: nhỏ/bằng/lớn. O(W·N) worst, O(N log N) avg.</>}
              {algo === 'suffix' && <><b style={{color:'#8b9eb5'}}>Suffix Array</b>: Mảng chỉ số hậu tố sắp xếp từ điển. Kết hợp LCP array. O(N log N).</>}
              {algo === 'tst' && <><b style={{color:'#8b9eb5'}}>TST</b>: Cây tìm kiếm 3 nhánh. Tốt cho prefix search. O(L) mỗi từ.</>}
              {algo === 'lsd' && <><b style={{color:'#8b9eb5'}}>LSD Radix</b>: Sắp xếp từ ký tự cuối. Ổn định. O(W·N).</>}
              {algo === 'msd' && <><b style={{color:'#8b9eb5'}}>MSD Radix</b>: Sắp xếp từ ký tự đầu. Tốt cho xâu dài. O(W·N).</>}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Way Radix Quicksort */}
      {is3Way && (
        <div className="radix-viz">
          <div className="radix-arr-label">
            {curStep?.type === 'done' ? '✓ Đã sắp xếp:' : `Partition [${curStep?.lo ?? 0}..${curStep?.hi ?? '?'}] d=${curStep?.d ?? 0}`}
            {curStep?.pivotChar && <span className="radix-digit-badge">pivot='{curStep.pivotChar}'</span>}
            {curStep?.type === 'swap_lt' && <span className="radix-digit-badge" style={{color:'#10b981'}}>← lt</span>}
            {curStep?.type === 'swap_gt' && <span className="radix-digit-badge" style={{color:'#ef4444'}}>gt →</span>}
          </div>
          <div className="radix-words">
            {(curStep?.arr || radixInput.trim().split(/\s+/)).map((w, i) => {
              const isLt = curStep?.lt === i;
              const isGt = curStep?.gt === i;
              const d = curStep?.d ?? 0;
              return (
                <div key={i} className={`radix-word ${(isLt || isGt) ? 'radix-active' : ''}`}>
                  {w.split('').map((ch, j) => (
                    <span key={j} className={`radix-ch ${j === d ? 'radix-focus' : ''}`}>{ch}</span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suffix Array */}
      {isSuffix && (
        <div className="suffix-viz">
          {curStep?.type === 'suffix' && (
            <div className="suffix-item suffix-active">
              <span className="suffix-idx">[{curStep.idx}]</span>
              <span className="suffix-str">"{curStep.suffix}"</span>
            </div>
          )}
          {(curStep?.type === 'sorted' || curStep?.type === 'lcp' || curStep?.type === 'done') && curStep?.suffixes && (
            <div className="suffix-table">
              <div className="suffix-header">
                <span style={{width:36}}>SA[i]</span>
                <span style={{flex:1}}>Suffix</span>
                {curStep?.lcpArr && <span style={{width:50}}>LCP</span>}
              </div>
              {curStep.suffixes.map((s, i) => (
                <div key={i} className={`suffix-row ${curStep?.type === 'lcp' && curStep.i === i ? 'suffix-lcp-active' : ''}`}>
                  <span className="suffix-idx">[{s.idx}]</span>
                  <span className="suffix-str">"{s.suffix}"</span>
                  {curStep?.lcpArr && <span className="suffix-lcp">{curStep.lcpArr[i] ?? 0}</span>}
                </div>
              ))}
            </div>
          )}
          {curStep?.type === 'compare' && (
            <div style={{fontSize:11,color:'#f59e0b',padding:'6px 10px',background:'rgba(245,158,11,0.08)',borderRadius:6}}>
              So sánh: "{curStep.s1}" vs "{curStep.s2}"
            </div>
          )}
        </div>
      )}

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

// TST SVG Visualizer
function TSTViz({ root, curStep }) {
  if (!root) return <div className="empty-msg">TST rỗng — chèn từ để bắt đầu</div>;

  const nodes = [], edges = [];
  let nodeId = 0;

  function traverse(node, x, y, spread) {
    if (!node) return;
    const id = nodeId++;
    const isActive = curStep?.char === node.c || curStep?.nodeChar === node.c;
    nodes.push({ id, char: node.c, x, y, isEnd: node.isEnd, isActive });
    const ns = Math.max(30, spread * 0.55);
    if (node.left) {
      const lx = x - spread, ly = y + 55;
      edges.push({ x1: x, y1: y, x2: lx, y2: ly, label: '<' });
      traverse(node.left, lx, ly, ns);
    }
    if (node.mid) {
      const mx = x, my = y + 55;
      edges.push({ x1: x, y1: y, x2: mx, y2: my, label: '=' });
      traverse(node.mid, mx, my, ns);
    }
    if (node.right) {
      const rx = x + spread, ry = y + 55;
      edges.push({ x1: x, y1: y, x2: rx, y2: ry, label: '>' });
      traverse(node.right, rx, ry, ns);
    }
  }
  traverse(root, 300, 35, 130);

  return (
    <svg width="100%" viewBox="0 0 600 320" style={{background:'#0d1117',borderRadius:8,border:'1px solid #1e2d3d'}}>
      {edges.map((e, i) => (
        <g key={i}>
          <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#1e3a5f" strokeWidth="1.5" />
          <text x={(e.x1+e.x2)/2} y={(e.y1+e.y2)/2} textAnchor="middle" fill="#2e4a6a" fontSize="9" fontFamily="monospace">{e.label}</text>
        </g>
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={16}
            fill={n.isActive ? '#f59e0b' : n.isEnd ? '#10b981' : '#1d4ed8'}
            stroke="#0a0e1a" strokeWidth="2" />
          <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="12" fontWeight="700" fontFamily="monospace">{n.char}</text>
          {n.isEnd && (
            <circle cx={n.x + 12} cy={n.y - 12} r={4} fill="#10b981" stroke="#0a0e1a" strokeWidth="1" />
          )}
        </g>
      ))}
    </svg>
  );
}

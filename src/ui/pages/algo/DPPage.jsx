import { useState, useRef } from 'react';
import {
  DP_ALGOS,
  fibonacciMemo,
  fibonacciTab,
  coinChangeWays,
  coinChangeMinCoins,
  coinChangeTrace,
  knapsack01,
  longestCommonSubsequence,
  rodCutting
} from '../../../core/dp/index.ts';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import './DPPage.css';

const ALGOS = {
  fibonacci: {
    name: 'Fibonacci',
    color: '#58a6ff',
    desc: 'F(n) = F(n-1) + F(n-2)',
    complexity: 'O(n) time, O(n) space'
  },
  coinChange: {
    name: 'Coin Change',
    color: '#10b981',
    desc: 'Số cách hoặc số coin tối thiểu',
    complexity: 'O(amount × n) time, O(amount) space'
  },
  knapsack: {
    name: '0/1 Knapsack',
    color: '#f59e0b',
    desc: 'Tối đa giá trị với giới hạn trọng lượng',
    complexity: 'O(n × W) time, O(n × W) space'
  },
  lcs: {
    name: 'LCS',
    color: '#a78bfa',
    desc: 'Chuỗi con chung dài nhất',
    complexity: 'O(n × m) time, O(n × m) space'
  },
  rodCutting: {
    name: 'Rod Cutting',
    color: '#f97316',
    desc: 'Cắt thanh sắt tối đa doanh thu',
    complexity: 'O(n²) time, O(n) space'
  }
};


function parseArrayInput(str) {
  return str.split(/[,\s]+/).map(Number).filter(n => !isNaN(n) && n > 0);
}

function getDefaultParams(algo) {
  switch (algo) {
    case 'fibonacci':
      return { n: 10 };
    case 'coinChange':
      return { coins: [1, 2, 5], amount: 11 };
    case 'knapsack':
      return {
        items: [
          { id: 1, weight: 2, value: 3 },
          { id: 2, weight: 3, value: 4 },
          { id: 3, weight: 4, value: 5 },
          { id: 4, weight: 5, value: 6 }
        ],
        capacity: 5
      };
    case 'lcs':
      return { str1: 'ABCBDAB', str2: 'BDCAB' };
    case 'rodCutting':
      return { length: 8, prices: [1, 5, 8, 9, 10, 17, 17, 20] };
    default:
      return {};
  }
}

export default function DPPage() {
  const [algo, setAlgo] = useState('fibonacci');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [result, setResult] = useState(null);
  const [dpTable, setDpTable] = useState(null);
  const [trace, setTrace] = useState(null);

  // ── Fibonacci params ──
  const [fibN, setFibN] = useState(10);
  const [fibMethod, setFibMethod] = useState('tab');

  // ── Coin Change params ──
  const [coinCoins, setCoinCoins] = useState('1, 2, 5');
  const [coinAmount, setCoinAmount] = useState(11);

  // ── Knapsack params ──
  const [knapItems, setKnapItems] = useState(
    '2,3 | 3,4 | 4,5 | 5,6'
  );
  const [knapCapacity, setKnapCapacity] = useState(5);

  // ── LCS params ──
  const [lcsStr1, setLcsStr1] = useState('ABCBDAB');
  const [lcsStr2, setLcsStr2] = useState('BDCAB');

  // ── Rod Cutting params ──
  const [rodLength, setRodLength] = useState(8);
  const [rodPrices, setRodPrices] = useState('1, 5, 8, 9, 10, 17, 17, 20');

  const engineRef = useRef(null);
  const { saveProgress } = useProgress();

  function runAlgo() {
    engineRef.current?.pause();
    let s, resultData, dpData, traceData;

    switch (algo) {
      case 'fibonacci': {
        const n = fibN;
        const res = fibMethod === 'memo' ? fibonacciMemo(n) : fibonacciTab(n);
        s = res.steps;
        resultData = res.value;
        dpData = res.tabulation;
        traceData = res.memo;
        break;
      }

      case 'coinChange': {
        const coins = parseArrayInput(coinCoins);
        const amount = coinAmount;
        const res = coinChangeWays(coins, amount);
        const minCoins = coinChangeMinCoins(coins, amount);
        const traceCoins = coinChangeTrace(coins, amount);
        s = res.steps;
        resultData = {
          ways: res.ways,
          minCoins,
          coinsUsed: traceCoins
        };
        dpData = res.dp;
        traceData = traceCoins;
        break;
      }

      case 'knapsack': {
        const items = knapItems.split('|').map((item, idx) => {
          const [weight, value] = item.trim().split(/[,\s]+/).map(Number);
          return { id: idx + 1, weight: weight || 0, value: value || 0 };
        }).filter(item => item.weight > 0 && item.value > 0);
        const capacity = knapCapacity;
        const res = knapsack01(items, capacity);
        s = res.steps;
        resultData = {
          maxValue: res.maxValue,
          selectedItems: res.selectedItems,
          totalWeight: res.totalWeight
        };
        dpData = res.dp;
        traceData = res.selectedItems.map(i => i.id);
        break;
      }

      case 'lcs': {
        const str1 = lcsStr1 || 'ABCBDAB';
        const str2 = lcsStr2 || 'BDCAB';
        const res = longestCommonSubsequence(str1, str2);
        s = res.steps;
        resultData = {
          lcs: res.lcs,
          length: res.length
        };
        dpData = res.dp;
        traceData = res.lcs.split('');
        break;
      }

      case 'rodCutting': {
        const length = rodLength;
        const prices = parseArrayInput(rodPrices);
        const res = rodCutting(length, prices);
        s = res.steps;
        resultData = {
          maxRevenue: res.maxRevenue,
          cuts: res.cuts
        };
        dpData = res.dp;
        traceData = res.bestCut;
        break;
      }

      default:
        return;
    }

    setSteps(s);
    setStepIdx(0);
    setCurStep(s[0] || null);
    setResult(resultData);
    setDpTable(dpData);
    setTrace(traceData);

    const eng = new AnimationEngine({
      steps: s,
      speed,
      onStep: (step, idx) => {
        setCurStep(step);
        setStepIdx(idx + 1);

        if (step.dp) setDpTable(step.dp);
      },
      onDone: () => {
        setPlaying(false);
        saveProgress('dp', ALGOS[algo]?.name || algo);
      }
    });

    engineRef.current = eng;
    eng.play();
    setPlaying(true);
  }


  function renderDpTable() {
    if (!dpTable) return null;

    if (Array.isArray(dpTable) && Array.isArray(dpTable[0])) {
      return (
        <div className="dp-table-wrap">
          <div className="dp-table-title">📊 DP Table</div>
          <div className="dp-table-2d">
            {dpTable.map((row, i) => (
              <div key={i} className="dp-row">
                {row.map((cell, j) => {
                  const isHighlight = curStep?.dp?.[i]?.[j] !== undefined &&
                    curStep?.dp?.[i]?.[j] === cell;
                  const isMatch = curStep?.type === 'match' &&
                    curStep?.i === i && curStep?.j === j;
                  return (
                    <div
                      key={j}
                      className={`dp-cell ${isHighlight || isMatch ? 'highlight' : ''}`}
                    >
                      {cell}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (Array.isArray(dpTable)) {
      return (
        <div className="dp-table-wrap">
          <div className="dp-table-title">📊 DP Array</div>
          <div className="dp-table-1d">
            {dpTable.map((cell, i) => {
              const isHighlight = curStep?.dp?.[i] !== undefined &&
                curStep?.dp?.[i] === cell;
              const isCurrent = curStep?.index === i;
              return (
                <div
                  key={i}
                  className={`dp-cell ${isHighlight || isCurrent ? 'highlight' : ''}`}
                >
                  <span className="dp-cell-idx">[{i}]</span>
                  <span className="dp-cell-val">{cell}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }

  function renderResult() {
    if (!result) return null;

    switch (algo) {
      case 'fibonacci':
        return (
          <div className="dp-result">
            <span className="dp-result-label">F({fibN}) =</span>
            <span className="dp-result-value">{result}</span>
          </div>
        );

      case 'coinChange':
        return (
          <div className="dp-result">
            <div>
              <span className="dp-result-label">Số cách:</span>
              <span className="dp-result-value">{result.ways}</span>
            </div>
            <div>
              <span className="dp-result-label">Số coin tối thiểu:</span>
              <span className="dp-result-value">{result.minCoins}</span>
            </div>
            {result.coinsUsed.length > 0 && (
              <div>
                <span className="dp-result-label">Coin sử dụng:</span>
                <span className="dp-result-value coins">
                  {result.coinsUsed.join(' → ')}
                </span>
              </div>
            )}
          </div>
        );

      case 'knapsack':
        return (
          <div className="dp-result">
            <div>
              <span className="dp-result-label">Giá trị tối đa:</span>
              <span className="dp-result-value">{result.maxValue}</span>
            </div>
            <div>
              <span className="dp-result-label">Tổng trọng lượng:</span>
              <span className="dp-result-value">{result.totalWeight}</span>
            </div>
            <div>
              <span className="dp-result-label">Item chọn:</span>
              <span className="dp-result-value items">
                {result.selectedItems.map(item =>
                  `#${item.id}(w=${item.weight},v=${item.value})`
                ).join(' → ')}
              </span>
            </div>
          </div>
        );

      case 'lcs':
        return (
          <div className="dp-result">
            <div>
              <span className="dp-result-label">LCS:</span>
              <span className="dp-result-value lcs">"{result.lcs}"</span>
            </div>
            <div>
              <span className="dp-result-label">Độ dài:</span>
              <span className="dp-result-value">{result.length}</span>
            </div>
          </div>
        );

      case 'rodCutting':
        return (
          <div className="dp-result">
            <div>
              <span className="dp-result-label">Doanh thu tối đa:</span>
              <span className="dp-result-value">{result.maxRevenue}</span>
            </div>
            <div>
              <span className="dp-result-label">Cách cắt:</span>
              <span className="dp-result-value cuts">
                {result.cuts.join(' + ')} = {result.cuts.reduce((a, b) => a + b, 0)}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  }


  function renderParams() {
    switch (algo) {
      case 'fibonacci':
        return (
          <div className="dp-params">
            <label>n =</label>
            <input
              type="number"
              min="0"
              max="30"
              value={fibN}
              onChange={e => setFibN(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
              className="arr-input"
            />
            <div className="dp-param-group">
              <button
                className={`dp-method-btn ${fibMethod === 'memo' ? 'active' : ''}`}
                onClick={() => setFibMethod('memo')}
              >
                Memoization
              </button>
              <button
                className={`dp-method-btn ${fibMethod === 'tab' ? 'active' : ''}`}
                onClick={() => setFibMethod('tab')}
              >
                Tabulation
              </button>
            </div>
          </div>
        );

      case 'coinChange':
        return (
          <div className="dp-params">
            <label>Coins:</label>
            <input
              value={coinCoins}
              onChange={e => setCoinCoins(e.target.value)}
              className="arr-input"
              placeholder="1, 2, 5"
            />
            <label>Amount:</label>
            <input
              type="number"
              min="0"
              value={coinAmount}
              onChange={e => setCoinAmount(parseInt(e.target.value) || 0)}
              className="arr-input"
            />
          </div>
        );

      case 'knapsack':
        return (
          <div className="dp-params">
            <label>Items (weight,value):</label>
            <input
              value={knapItems}
              onChange={e => setKnapItems(e.target.value)}
              className="arr-input"
              placeholder="2,3 | 3,4 | 4,5"
            />
            <label>Capacity:</label>
            <input
              type="number"
              min="1"
              value={knapCapacity}
              onChange={e => setKnapCapacity(parseInt(e.target.value) || 1)}
              className="arr-input"
            />
          </div>
        );

      case 'lcs':
        return (
          <div className="dp-params">
            <label>Chuỗi 1:</label>
            <input
              value={lcsStr1}
              onChange={e => setLcsStr1(e.target.value)}
              className="arr-input"
              placeholder="ABCBDAB"
            />
            <label>Chuỗi 2:</label>
            <input
              value={lcsStr2}
              onChange={e => setLcsStr2(e.target.value)}
              className="arr-input"
              placeholder="BDCAB"
            />
          </div>
        );

      case 'rodCutting':
        return (
          <div className="dp-params">
            <label>Độ dài thanh:</label>
            <input
              type="number"
              min="1"
              value={rodLength}
              onChange={e => setRodLength(parseInt(e.target.value) || 1)}
              className="arr-input"
            />
            <label>Giá (prices):</label>
            <input
              value={rodPrices}
              onChange={e => setRodPrices(e.target.value)}
              className="arr-input"
              placeholder="1, 5, 8, 9"
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>🧠 Dynamic Programming</h1>
        <p>Fibonacci · Coin Change · 0/1 Knapsack · LCS · Rod Cutting</p>
      </div>

      {/* Algo Tabs */}
      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button
            key={k}
            className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => {
              setAlgo(k);
              setSteps([]);
              setCurStep(null);
              setStepIdx(0);
              setResult(null);
              setDpTable(null);
              setTrace(null);
              engineRef.current?.pause();
              setPlaying(false);

              const defaults = getDefaultParams(k);
              if (k === 'fibonacci') setFibN(defaults.n || 10);
              else if (k === 'coinChange') {
                setCoinCoins((defaults.coins || [1, 2, 5]).join(', '));
                setCoinAmount(defaults.amount || 11);
              } else if (k === 'knapsack') {
                setKnapItems((defaults.items || []).map(i => `${i.weight},${i.value}`).join(' | '));
                setKnapCapacity(defaults.capacity || 5);
              } else if (k === 'lcs') {
                setLcsStr1(defaults.str1 || 'ABCBDAB');
                setLcsStr2(defaults.str2 || 'BDCAB');
              } else if (k === 'rodCutting') {
                setRodLength(defaults.length || 8);
                setRodPrices((defaults.prices || [1, 5, 8, 9, 10, 17, 17, 20]).join(', '));
              }
            }}
          >
            {v.name}
            <span style={{ display: 'block', fontSize: 9, color: '#4a6b8a' }}>
              {v.complexity}
            </span>
          </button>
        ))}
      </div>

      <div className="dp-workspace">
        <div className="dp-main">
          {/* Step Description */}
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{curStep?.message || 'Nhấn ▶ để chạy'}</span>
          </div>

          {/* DP Table */}
          {renderDpTable()}

          {/* Result */}
          {renderResult()}

          {/* LCS Visualization */}
          {algo === 'lcs' && dpTable && (
            <div className="lcs-viz">
              <div className="lcs-strings">
                <div className="lcs-str">
                  <span className="lcs-label">S1:</span>
                  {lcsStr1.split('').map((ch, i) => (
                    <span
                      key={i}
                      className={`lcs-char ${curStep?.type === 'match' && curStep?.i === i + 1 ? 'active' : ''}`}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
                <div className="lcs-str">
                  <span className="lcs-label">S2:</span>
                  {lcsStr2.split('').map((ch, i) => (
                    <span
                      key={i}
                      className={`lcs-char ${curStep?.type === 'match' && curStep?.j === i + 1 ? 'active' : ''}`}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              {result?.lcs && (
                <div className="lcs-result">
                  <span className="lcs-label">LCS:</span>
                  <span className="lcs-value">"{result.lcs}"</span>
                </div>
              )}
            </div>
          )}

          {/* Knapsack Items */}
          {algo === 'knapsack' && result?.selectedItems && (
            <div className="knap-items">
              <div className="knap-label">Items:</div>
              <div className="knap-item-list">
                {result.selectedItems.map(item => (
                  <div key={item.id} className="knap-item selected">
                    #{item.id}: w={item.weight}, v={item.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="dp-sidebar">
          {/* Params */}
          <div className="ctrl-section">
            <h3>📥 Tham số</h3>
            {renderParams()}
            <button
              className="btn-generate"
              style={{ width: '100%', marginTop: 8, background: ALGOS[algo]?.color }}
              onClick={runAlgo}
            >
              ▶ Chạy {ALGOS[algo]?.name}
            </button>
          </div>

          {/* Examples */}
          <div className="ctrl-section">
            <h3>📋 Ví dụ mẫu</h3>
            <div className="dp-examples">
              {algo === 'fibonacci' && (
                <>
                  <button className="btn-random" onClick={() => { setFibN(5); }}>F(5)</button>
                  <button className="btn-random" onClick={() => { setFibN(10); }}>F(10)</button>
                  <button className="btn-random" onClick={() => { setFibN(15); }}>F(15)</button>
                </>
              )}
              {algo === 'coinChange' && (
                <>
                  <button className="btn-random" onClick={() => { setCoinCoins('1,2,5'); setCoinAmount(11); }}>1,2,5 → 11</button>
                  <button className="btn-random" onClick={() => { setCoinCoins('1,3,4'); setCoinAmount(6); }}>1,3,4 → 6</button>
                  <button className="btn-random" onClick={() => { setCoinCoins('2,3,7'); setCoinAmount(12); }}>2,3,7 → 12</button>
                </>
              )}
              {algo === 'knapsack' && (
                <>
                  <button className="btn-random" onClick={() => { setKnapItems('2,3 | 3,4 | 4,5'); setKnapCapacity(5); }}>3 items, W=5</button>
                  <button className="btn-random" onClick={() => { setKnapItems('1,1 | 2,6 | 3,5 | 4,10'); setKnapCapacity(6); }}>4 items, W=6</button>
                </>
              )}
              {algo === 'lcs' && (
                <>
                  <button className="btn-random" onClick={() => { setLcsStr1('ABCBDAB'); setLcsStr2('BDCAB'); }}>ABCBDAB & BDCAB</button>
                  <button className="btn-random" onClick={() => { setLcsStr1('AGGTAB'); setLcsStr2('GXTXAYB'); }}>AGGTAB & GXTXAYB</button>
                </>
              )}
              {algo === 'rodCutting' && (
                <>
                  <button className="btn-random" onClick={() => { setRodLength(8); setRodPrices('1,5,8,9,10,17,17,20'); }}>Length=8</button>
                  <button className="btn-random" onClick={() => { setRodLength(4); setRodPrices('1,5,8,9'); }}>Length=4</button>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="ctrl-section">
            <h3>📖 {ALGOS[algo]?.name}</h3>
            <div className="dp-info">
              <p>{ALGOS[algo]?.desc}</p>
              <p className="dp-complexity">⏱ {ALGOS[algo]?.complexity}</p>
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
          setCurStep(steps[0] || null);
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
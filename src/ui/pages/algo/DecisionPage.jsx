import { useState, useRef, useEffect } from 'react';
import { decisionTreeID3, generateDataset, predict } from '../../../core/decision/index.ts';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import './DecisionPage.css';

const ALGOS = {
  id3: { name: 'ID3', color: '#8b5cf6', desc: 'Iterative Dichotomiser 3' },
};

export default function DecisionPage() {
  const [algo, setAlgo] = useState('id3');
  const [dataset, setDataset] = useState(() => generateDataset(14));
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [tree, setTree] = useState(null);
  const [dataSize, setDataSize] = useState(14);
  const engineRef = useRef(null);
  const { saveProgress } = useProgress();


  function resetState() {
    setSteps([]);
    setStepIdx(0);
    setCurStep(null);
    setTree(null);
    setPlaying(false);
    engineRef.current?.pause();
  }

  function generateNewData() {
    const newData = generateDataset(dataSize);
    setDataset(newData);
    resetState();
  }

  function runAlgo() {
    engineRef.current?.pause();
    let s = [];
    if (algo === 'id3') {
      s = decisionTreeID3(dataset);
    }
    
    setSteps(s);
    setStepIdx(0);
    setCurStep(null);
    setTree(null); 
    
    const eng = new AnimationEngine({
      steps: s,
      speed,
      onStep: (step, idx) => {
        setCurStep(step);
        setStepIdx(idx + 1);
        
        if (step.tree) {
          setTree(step.tree);
        } else if (step.type === 'init') {
          setTree(null);
        }
      },
      onDone: () => setPlaying(false),
    });
    
    engineRef.current = eng;
    eng.play();
    setPlaying(true);
    saveProgress('decision', 'ID3');
  }

  function renderTree(node, x = 500, y = 40, xOffset = 220) {
    if (!node) return null;
    
    if (node.type === 'leaf') {
      return (
        <g key={`leaf-${x}-${y}-${node.value}`}>
          <rect
            x={x - 35}
            y={y - 15}
            width={70}
            height={30}
            rx={15}
            fill={node.value === 'yes' ? '#10b981' : '#f43f5e'}
            stroke="#fff"
            strokeWidth={1}
          />
          <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
            {node.value}
          </text>
        </g>
      );
    }
    
    const branches = Object.entries(node.branches || {});
    const children = [];
    const totalBranches = branches.length;
    
    branches.forEach(([value, child], i) => {
      const childX = x - (xOffset * (totalBranches - 1) / 2) + i * xOffset;
      const childY = y + 80;
      
      children.push(
        <g key={`edge-${node.feature}-${value}-${i}`}>
          <line
            x1={x}
            y1={y + 15}
            x2={childX}
            y2={childY - 15}
            stroke="#4a6b8a"
            strokeWidth={2}
          />
          <text
            x={(x + childX) / 2}
            y={(y + childY) / 2 - 5}
            textAnchor="middle"
            fill="#8b9eb5"
            fontSize={10}
            backgroundColor="#0d1117"
          >
            {value}
          </text>
          {/* Thu hẹp khoảng cách xOffset theo độ sâu để tránh tràn màn hình */}
          {renderTree(child, childX, childY, xOffset * 0.55)}
        </g>
      );
    });
    
    return (
      <g key={`node-${node.feature}-${x}-${y}`}>
        <rect
          x={x - 55}
          y={y - 15}
          width={110}
          height={30}
          rx={5}
          fill="#1e3a5f"
          stroke="#58a6ff"
          strokeWidth={2}
        />
        <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
          {node.feature}
        </text>
        {children}
      </g>
    );
  }

  function stepDesc(s) {
    if (!s) return 'Nhấn ▶ để xây dựng cây quyết định';
    if (s.type === 'init') return `Khởi tạo: ${s.totalSamples} mẫu, ${s.features?.length} features`;
    if (s.type === 'target_distribution') return s.desc || 'Tính toán phân phối nhãn target...';
    if (s.type === 'check_stop') {
      return `Độ sâu ${s.depth}: ${s.dataSize} mẫu - ${s.isPure ? '✓ Thuần khiết (Pure)' : 'Tiếp tục phân tách'}`;
    }
    if (s.type === 'leaf') return `🎯 Tạo nút lá: Kết quả "${s.value}" (Độ sâu ${s.depth})`;
    if (s.type === 'calculate_entropy') return `Entropy của tập hiện tại = ${s.entropy?.toFixed(3)}`;
    if (s.type === 'calculate_gain') {
      const gainStr = Object.entries(s.gains || {})
        .map(([k, v]) => `${k}: ${v.toFixed(3)}`)
        .join(', ');
      return `📊 Information Gain: ${gainStr} → Chọn "${s.bestFeature}" (${s.bestGain?.toFixed(3)})`;
    }
    if (s.type === 'split') return `✂️ Tách nút theo thuộc tính "${s.feature}"`;
    if (s.type === 'branch') return `🌿 Xem xét nhánh "${s.value}": Có ${s.subsetSize} mẫu dữ liệu`;
    if (s.type === 'done') return `✅ Thuật toán hoàn thành! Cây quyết định đã được xây dựng trọn vẹn.`;
    return s.desc || '';
  }

  const getInfo = () => {
    if (!curStep) return null;
    const info = [];
    if (curStep.depth !== undefined) info.push(`Depth:${curStep.depth}`);
    if (curStep.dataSize !== undefined) info.push(`Samples:${curStep.dataSize}`);
    if (curStep.entropy !== undefined) info.push(`Entropy:${curStep.entropy.toFixed(3)}`);
    if (curStep.bestGain !== undefined) info.push(`Best Gain:${curStep.bestGain.toFixed(3)}`);
    if (curStep.bestFeature) info.push(`Best Feature:${curStep.bestFeature}`);
    return info;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Decision Tree - ID3</h1>
        <p>Xây dựng cây quyết định từng bước với thuật toán ID3</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button
            key={k}
            className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => {
              setAlgo(k);
              resetState();
            }}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="decision-workspace">
        <div className="decision-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep)}</span>
          </div>

          <div className="dataset-container">
            <div className="dataset-title">📊 Dataset ({dataset.length} samples)</div>
            <div className="dataset-table-wrap">
              <table className="dataset-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Age</th>
                    <th>Income</th>
                    <th>Student</th>
                    <th>Credit Rating</th>
                    <th style={{ color: '#f472b6' }}>Buy Computer</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{row.age}</td>
                      <td>{row.income}</td>
                      <td>{row.student}</td>
                      <td>{row.credit_rating}</td>
                      <td style={{ 
                        color: row.buy_computer === 'yes' ? '#10b981' : '#f43f5e',
                        fontWeight: 'bold'
                      }}>
                        {row.buy_computer}
                      </td>
                    </tr>
                  ))}
                  {dataset.length > 10 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#4a6b8a' }}>
                        ... và {dataset.length - 10} mẫu khác
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tree-container">
            <div className="tree-title">🌳 Visualizing Tree Graph</div>
            <div className="tree-svg-wrap">
              <svg viewBox="0 0 1000 420" className="tree-svg">
                {tree ? (
                  renderTree(tree, 500, 40, 240) 
                ) : (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#4a6b8a" fontSize={14}>
                    {steps.length > 0 ? 'Đang phân tích và dựng cây...' : 'Nhấn nút Khởi chạy ở thanh bên để xem cây hoạt động'}
                  </text>
                )}
              </svg>
            </div>
          </div>

          {curStep && (
            <div className="decision-info-panel">
              <div className="info-grid">
                {getInfo()?.map((item, i) => (
                  <div key={i} className="info-item">
                    <span className="info-label">{item.split(':')[0]}:</span>
                    <span className="info-value">{item.split(':')[1]}</span>
                  </div>
                ))}
                {curStep.targetCounts && (
                  <div className="info-item">
                    <span className="info-label">Distribution:</span>
                    <span className="info-value">
                      {Object.entries(curStep.targetCounts)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(' | ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="decision-sidebar">
          <div className="ctrl-section">
            <h3>Dataset Settings</h3>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: '#4a6b8a' }}>Số mẫu: {dataSize}</label>
              <input
                type="range"
                min="8"
                max="30"
                value={dataSize}
                onChange={e => setDataSize(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>
            <button className="btn-generate" style={{ width: '100%' }} onClick={generateNewData}>
              🎲 Tạo dữ liệu ngẫu nhiên
            </button>
          </div>

          <div className="ctrl-section">
            <h3>Attributes List</h3>
            <div style={{ fontSize: 11, color: '#8b9eb5', lineHeight: 1.8 }}>
              <div>• Age (&lt;=30, 31-40, &gt;40)</div>
              <div>• Income (high, medium, low)</div>
              <div>• Student (yes, no)</div>
              <div>• Credit Rating (fair, excellent)</div>
              <div style={{ marginTop: 8, color: '#f472b6', fontWeight: 'bold' }}>
                🎯 Target: Buy Computer
              </div>
            </div>
          </div>

          <div className="ctrl-section">
            <h3>Execute Simulation</h3>
            <button
              className="btn-generate"
              style={{ width: '100%', background: '#8b5cf6', color: '#fff', fontWeight: 'bold' }}
              onClick={runAlgo}
            >
              ▶ Khởi chạy Animation
            </button>
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
          setTree(null);
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
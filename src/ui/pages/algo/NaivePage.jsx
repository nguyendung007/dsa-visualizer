import { useState, useRef } from 'react';
import { naiveBayes, generateDataset, predictSample } from '../../../core/naive/index.ts';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import './NaivePage.css';

const ALGOS = {
  naive: { name: 'Naive Bayes', color: '#06b6d4', desc: 'Phân loại dựa trên định lý Bayes' },
};

export default function NaivePage() {
  const [algo, setAlgo] = useState('naive');
  const [dataset, setDataset] = useState(() => generateDataset(14));
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [dataSize, setDataSize] = useState(14);
  const engineRef = useRef(null);
  const { saveProgress } = useProgress();

  function generateNewData() {
    const newData = generateDataset(dataSize);
    setDataset(newData);
    setSteps([]);
    setStepIdx(0);
    setCurStep(null);
    setPlaying(false);
  }

  function runAlgo() {
    engineRef.current?.pause();
    let s;
    if (algo === 'naive') {
      s = naiveBayes(dataset);
    }
    
    setSteps(s);
    setStepIdx(0);
    setCurStep(null);
    
    const eng = new AnimationEngine({
      steps: s,
      speed,
      onStep: (step, idx) => {
        setCurStep(step);
        setStepIdx(idx + 1);
      },
      onDone: () => setPlaying(false),
    });
    
    engineRef.current = eng;
    eng.play();
    setPlaying(true);
    saveProgress('naive', 'Naive Bayes');
  }

  // Step description
  function stepDesc(s) {
    if (!s) return 'Nhấn ▶ để chạy Naive Bayes';
    if (s.type === 'init') return `Khởi tạo: ${s.totalSamples} mẫu, ${s.features?.length} features, ${s.classes?.length} classes`;
    if (s.type === 'target_distribution') return s.desc;
    if (s.type === 'prior') return s.desc;
    if (s.type === 'likelihood_matrix') return s.desc;
    if (s.type === 'predict_sample') return s.desc;
    if (s.type === 'calculate_class') return s.desc;
    if (s.type === 'prediction_result') return s.desc;
    if (s.type === 'done') return s.desc;
    return s.desc || '';
  }

  // Render Prior Chart
  function renderPriorChart(prior) {
    if (!prior) return null;
    const entries = Object.entries(prior);
    const maxVal = Math.max(...entries.map(([, v]) => v), 0.01);
    
    return (
      <div className="chart-container">
        <div className="chart-title">📊 Prior Probabilities</div>
        <div className="bar-chart">
          {entries.map(([label, value]) => (
            <div key={label} className="bar-item">
              <div className="bar-label">P({label})</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(value / maxVal) * 100}%`,
                    background: label === 'yes' ? '#10b981' : '#f43f5e'
                  }}
                />
                <span className="bar-value">{value.toFixed(3)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Likelihood Matrix
  function renderLikelihoodMatrix(likelihoodMatrix) {
    if (!likelihoodMatrix) return null;
    
    const features = Object.keys(likelihoodMatrix);
    const classes = new Set();
    for (const feature of features) {
      for (const value of Object.keys(likelihoodMatrix[feature])) {
        for (const cls of Object.keys(likelihoodMatrix[feature][value])) {
          classes.add(cls);
        }
      }
    }
    const classList = Array.from(classes);
    
    return (
      <div className="matrix-container">
        <div className="chart-title">📊 Likelihood Matrix</div>
        <table className="likelihood-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Value</th>
              {classList.map(cls => (
                <th key={cls} style={{ color: cls === 'yes' ? '#10b981' : '#f43f5e' }}>
                  P(feature|{cls})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map(feature => {
              const rows = [];
              const values = Object.keys(likelihoodMatrix[feature]);
              values.forEach((value, idx) => {
                rows.push(
                  <tr key={`${feature}-${value}`}>
                    {idx === 0 && (
                      <td rowSpan={values.length} style={{ fontWeight: 'bold', color: '#58a6ff' }}>
                        {feature}
                      </td>
                    )}
                    <td>{value}</td>
                    {classList.map(cls => (
                      <td key={cls}>
                        {likelihoodMatrix[feature][value][cls]?.toFixed(3) || '0.000'}
                      </td>
                    ))}
                  </tr>
                );
              });
              return rows;
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Render Prediction Details
  function renderPredictionDetails(s) {
    if (!s || s.type !== 'calculate_class') return null;
    
    return (
      <div className="prediction-detail">
        <div className="detail-class" style={{ color: s.class === 'yes' ? '#10b981' : '#f43f5e' }}>
          {s.class === 'yes' ? '✅' : '❌'} Class: {s.class}
        </div>
        <div className="detail-formula">
          P({s.class}|features) = P({s.class}) × ∏ P(feature|{s.class})
        </div>
        <div className="detail-calculation">
          <span className="calc-prior">Prior: {s.prior.toFixed(4)}</span>
          {s.details?.map((d, i) => (
            <span key={i} className="calc-likelihood">
              × P({d.feature}={d.value}|{s.class}) = {d.likelihood.toFixed(4)}
            </span>
          ))}
          <span className="calc-result" style={{ color: '#f59e0b' }}>
            = {s.posterior.toFixed(6)}
          </span>
        </div>
      </div>
    );
  }

  // Render Prediction Result
  function renderPredictionResult(s) {
    if (!s || s.type !== 'prediction_result') return null;
    
    return (
      <div className="result-container">
        <div className="result-header">
          <span className="result-label">🔮 Dự đoán:</span>
          <span className={`result-value ${s.isCorrect ? 'correct' : 'incorrect'}`}>
            {s.predicted}
          </span>
          <span className="result-actual">
            (Thực tế: {s.actual} {s.isCorrect ? '✅' : '❌'})
          </span>
        </div>
        <div className="result-details">
          {Object.entries(s.allResults || {}).map(([cls, data]) => (
            <div key={cls} className="result-class">
              <span style={{ color: cls === 'yes' ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>
                {cls}:
              </span>
              <span> P = {data.posterior?.toFixed(6)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Naive Bayes Classifier</h1>
        <p>Phân loại dựa trên Định lý Bayes với giả định các feature độc lập</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button
            key={k}
            className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => {
              setAlgo(k);
              setSteps([]);
              setStepIdx(0);
              setCurStep(null);
              setPlaying(false);
              engineRef.current?.pause();
            }}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="naive-workspace">
        {/* Main */}
        <div className="naive-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep)}</span>
          </div>

          {/* Dataset Table */}
          <div className="dataset-container">
            <div className="dataset-title">
              📊 Dataset ({dataset.length} samples)
            </div>
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

          {/* Visualization Area */}
          <div className="viz-container">
            {/* Prior Chart */}
            {curStep?.type === 'prior' && renderPriorChart(curStep.prior)}
            
            {/* Likelihood Matrix */}
            {curStep?.type === 'likelihood_matrix' && renderLikelihoodMatrix(curStep.likelihoodMatrix)}
            
            {/* Prediction Details */}
            {curStep?.type === 'calculate_class' && renderPredictionDetails(curStep)}
            
            {/* Prediction Result */}
            {curStep?.type === 'prediction_result' && renderPredictionResult(curStep)}
            
            {/* Sample Info */}
            {curStep?.type === 'predict_sample' && (
              <div className="sample-info">
                <div className="chart-title">🔍 Sample được chọn để dự đoán</div>
                <div className="sample-details">
                  {Object.entries(curStep.sample || {}).map(([key, value]) => (
                    <div key={key} className="sample-item">
                      <span className="sample-key">{key}:</span>
                      <span className="sample-value">{value}</span>
                    </div>
                  ))}
                  <div className="sample-item">
                    <span className="sample-key">Actual:</span>
                    <span className="sample-value" style={{ 
                      color: curStep.actualClass === 'yes' ? '#10b981' : '#f43f5e',
                      fontWeight: 'bold'
                    }}>
                      {curStep.actualClass}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bayes Formula */}
            {curStep && (
              <div className="bayes-formula">
                <div className="formula-title">📐 Định lý Bayes</div>
                <div className="formula">
                  P(class | features) = 
                  <span className="formula-part prior">P(class)</span>
                  <span className="formula-part operator"> × </span>
                  <span className="formula-part likelihood">∏ P(feature | class)</span>
                </div>
                <div className="formula-desc">
                  <span className="desc-item prior">★ Prior: Xác suất ban đầu của class</span>
                  <span className="desc-item likelihood">★ Likelihood: Xác suất feature khi biết class</span>
                  <span className="desc-item posterior">★ Posterior: Xác suất class khi biết features</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="naive-sidebar">
          <div className="ctrl-section">
            <h3>Dataset</h3>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: '#4a6b8a' }}>
                Số mẫu: {dataSize}
              </label>
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
              🎲 Tạo dataset ngẫu nhiên
            </button>
          </div>

          <div className="ctrl-section">
            <h3>Features</h3>
            <div style={{ fontSize: 11, color: '#8b9eb5', lineHeight: 1.8 }}>
              <div>• Age ({'<=30'}, 31-40, {'>40'})</div>
              <div>• Income (high, medium, low)</div>
              <div>• Student (yes, no)</div>
              <div>• Credit Rating (fair, excellent)</div>
              <div style={{ marginTop: 8, color: '#f472b6' }}>
                🎯 Target: Buy Computer (yes/no)
              </div>
            </div>
          </div>

          <div className="ctrl-section">
            <h3>Run Algorithm</h3>
            <button
              className="btn-generate"
              style={{ width: '100%', background: '#06b6d4' }}
              onClick={runAlgo}
            >
              ▶ Chạy Naive Bayes
            </button>
          </div>

          <div className="ctrl-section">
            <h3>Giả định Naive Bayes</h3>
            <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.7 }}>
              <b>Naive Bayes</b> dựa trên <b style={{ color: '#06b6d4' }}>Định lý Bayes</b><br />
              với giả định các feature <b style={{ color: '#f59e0b' }}>độc lập</b> với nhau.<br />
              <br />
              <b>Công thức:</b><br />
              P(class|features) ∝ P(class) × ∏ P(feature|class)<br />
              <br />
              <b>Ưu điểm:</b> Đơn giản, nhanh, hiệu quả với dữ liệu lớn.<br />
              <b>Nhược điểm:</b> Giả định độc lập không luôn đúng.
            </div>
          </div>

          <div className="ctrl-section">
            <h3>Thông tin</h3>
            <div style={{ fontSize: 12, color: '#8b9eb5', lineHeight: 1.8 }}>
              <div>Tổng mẫu: {dataset.length}</div>
              <div>Features: 4</div>
              <div>Classes: 2 (yes/no)</div>
              {curStep?.prior && (
                <div>
                  Prior: yes = {curStep.prior.yes?.toFixed(3)}, no = {curStep.prior.no?.toFixed(3)}
                </div>
              )}
              {curStep?.predicted && (
                <div>
                  Dự đoán: <b style={{ color: curStep.predicted === 'yes' ? '#10b981' : '#f43f5e' }}>
                    {curStep.predicted}
                  </b>
                </div>
              )}
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
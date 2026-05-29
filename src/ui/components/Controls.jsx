import './Controls.css';

export default function Controls({ playing, onPlay, onPause, onReset, onStep, onStepBack, speed, onSpeedChange, step, total }) {
  return (
    <div className="controls">
      <div className="ctrl-buttons">
        <button className="ctrl-btn" onClick={onReset} title="Reset">⏮</button>
        <button className="ctrl-btn" onClick={onStepBack} title="Step back">⏪</button>
        <button className="ctrl-btn primary" onClick={playing ? onPause : onPlay}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={onStep} title="Step forward">⏩</button>
      </div>

      <div className="ctrl-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: total ? `${(step / total) * 100}%` : '0%' }} />
        </div>
        <span className="ctrl-count">{step} / {total}</span>
      </div>

      <div className="ctrl-speed">
        <span className="ctrl-label">Speed</span>
        <input
          type="range" min="50" max="1000" step="50"
          value={1050 - speed}
          onChange={e => onSpeedChange(1050 - parseInt(e.target.value))}
        />
        <span className="ctrl-label">{speed <= 200 ? 'Fast' : speed <= 500 ? 'Med' : 'Slow'}</span>
      </div>
    </div>
  );
}

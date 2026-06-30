// ui/logger/LoggerPanel.jsx
// Phần UI hiển thị bảng log, tách riêng khỏi Logger.jsx vì JSX khá dài.

import React, { useState, useEffect, memo } from 'react';
import { useLogger } from './Logger.jsx';

const LOG_TYPES = {
  click:      { label: 'Click',      color: '#58a6ff', icon: '🖱️' },
  state:      { label: 'State',      color: '#10b981', icon: '📊' },
  action:     { label: 'Action',     color: '#f59e0b', icon: '⚡' },
  error:      { label: 'Error',      color: '#ef4444', icon: '❌' },
  render:     { label: 'Render',     color: '#a78bfa', icon: '🔄' },
  lifecycle:  { label: 'Lifecycle',  color: '#f472b6', icon: '🔁' },
  navigation: { label: 'Navigation', color: '#06b6d4', icon: '🧭' },
  custom:     { label: 'Custom',     color: '#fbbf24', icon: '🔧' },
};

export default function LoggerPanel({ componentName, onClose, maxLogs = 500, autoScroll = true }) {
  const { logs, clearLogs, exportLogs, filter, setFilter, logRef, totalLogs } = useLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const dataStr = JSON.stringify(log.data).toLowerCase();
    return (
      dataStr.includes(term) ||
      log.type.includes(term) ||
      log.component.includes(term)
    );
  });

  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll, logRef]);

  const displayLogs = filteredLogs.slice(-maxLogs);

  return (
    <div className={`logger-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="logger-header">
        <div className="logger-title">
          <span>📋 Dev Logger</span>
          <span className="logger-badge">{totalLogs} logs</span>
          <span className="logger-component-badge">{componentName}</span>
        </div>

        <div className="logger-controls">
          <button
            className="logger-btn expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            ━
          </button>

          <input
            type="text"
            placeholder="🔍 Filter logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="logger-search"
          />

          <select value={filter} onChange={e => setFilter(e.target.value)} className="logger-filter">
            <option value="all">📋 All</option>
            {Object.entries(LOG_TYPES).map(([key, { label, icon }]) => (
              <option key={key} value={key}>
                {icon} {label}
              </option>
            ))}
          </select>

          <button onClick={clearLogs} className="logger-btn clear">🗑</button>
          <button onClick={exportLogs} className="logger-btn export">💾</button>
          <button onClick={onClose} className="logger-btn close">✕</button>
        </div>
      </div>

      {isExpanded && (
        <div className="logger-body" ref={logRef}>
          {displayLogs.length === 0 ? (
            <div className="logger-empty">
              {searchTerm ? 'No matching logs found' : 'No logs yet. Interact with the page to see logs.'}
            </div>
          ) : (
            displayLogs.map(log => <LogEntry key={log.id} log={log} />)
          )}
        </div>
      )}
    </div>
  );
}

const LogEntry = memo(function LogEntry({ log }) {
  const typeInfo = LOG_TYPES[log.type] || { label: log.type, color: '#6b7280', icon: '📌' };
  const time = new Date(log.timestamp).toLocaleTimeString('vi-VN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const dataStr = typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data);
  const isLarge = dataStr.length > 100;

  return (
    <div className="log-entry" style={{ borderLeftColor: typeInfo.color }}>
      <div className="log-header" onClick={() => isLarge && setIsExpanded(!isExpanded)}>
        <span className="log-time">{time}</span>
        <span className="log-type" style={{ color: typeInfo.color }}>
          {typeInfo.icon} {typeInfo.label}
        </span>
        <span className="log-component">{log.component}</span>
        {isLarge && <span className="log-expand-btn">{isExpanded ? '▼' : '▶'}</span>}
      </div>
      <div className={`log-data ${isExpanded ? 'expanded' : ''}`}>
        <pre>{dataStr}</pre>
      </div>
    </div>
  );
});
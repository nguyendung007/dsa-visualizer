// ui/logger/Logger.jsx
// Gộp: LoggerContext + LoggerProvider + useLogger + LoggerLayout (thay cho 3 file cũ:
// LoggerContext.jsx, LoggerPage.jsx, LoggerLayout.jsx)
//
// Phần UI hiển thị bảng log (panel) nằm ở file LoggerPanel.jsx riêng.

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LoggerPanel from './LoggerPanel.jsx';
import './Logger.css';

// ============================================================
// 1. CONTEXT + PROVIDER
// ============================================================

const LoggerContext = createContext(null);

export function LoggerProvider({ children }) {
  const [logs, setLogs] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'click' | 'state' | 'action' | 'error' | ...
  const logRef = useRef(null);

  const addLog = useCallback(
    (type, data, component) => {
      if (!isEnabled) return;

      const entry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type,
        component,
        data: typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data,
        stack: new Error().stack?.split('\n').slice(2, 5).join('\n') || '',
      };

      setLogs(prev => [...prev, entry]);

      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }, 50);
    },
    [isEnabled]
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  const exportLogs = useCallback(() => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logger-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  return (
    <LoggerContext.Provider
      value={{
        logs: filteredLogs,
        addLog,
        clearLogs,
        exportLogs,
        isEnabled,
        setIsEnabled,
        filter,
        setFilter,
        logRef,
        totalLogs: logs.length,
      }}
    >
      {children}
    </LoggerContext.Provider>
  );
}

export function useLogger() {
  const ctx = useContext(LoggerContext);
  if (!ctx) throw new Error('useLogger must be used within LoggerProvider');
  return ctx;
}

// ============================================================
// 2. LOGGER LAYOUT (route wrapper, thay cho LoggerLayout + LoggerPage cũ)
// ============================================================
//
// LƯU Ý QUAN TRỌNG:
// Bản cũ (LoggerPage) cố gắng "wrap" các prop onXxx của children để log thao tác
// click — nhưng vì children ở đây là <Outlet/> (route element không có prop
// nào được truyền vào), cơ chế đó KHÔNG bắt được thao tác thật sự bên trong các
// Page (vd: GraphPage). Bản gộp này bỏ phần wrap props vô dụng đó, chỉ giữ lại
// phần log có tác dụng thật: mount/unmount + chuyển route (navigation).
// Việc log chi tiết thao tác bên trong từng Page sẽ làm sau (Hướng A: bắt click
// bằng capture-phase listener / Hướng B: gọi addLog() trực tiếp trong Page).

export default function LoggerLayout({ children }) {
  const { addLog, isEnabled, totalLogs } = useLogger();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  const [isPanelVisible, setIsPanelVisible] = useState(
    () => localStorage.getItem('loggerVisible') === 'true'
  );

  const componentName = getComponentNameFromPath(location.pathname);

  // Log route changes
  useEffect(() => {
    if (isEnabled && prevPathRef.current !== location.pathname) {
      addLog(
        'navigation',
        {
          from: prevPathRef.current,
          to: location.pathname,
          route: location.pathname.split('/')[1] || 'home',
        },
        'Router'
      );
      prevPathRef.current = location.pathname;
    }
  }, [location, addLog, isEnabled]);

  // Log mount/unmount của Page hiện tại
  useEffect(() => {
    if (isEnabled) {
      addLog('lifecycle', { action: 'mount', component: componentName }, componentName);
    }
    return () => {
      if (isEnabled) {
        addLog('lifecycle', { action: 'unmount', component: componentName }, componentName);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName]);

  // Tự động bắt mọi click bên trong Page hiện tại (Hướng A: capture-phase listener)
  const contentRef = useRef(null);
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleClick = e => {
      if (!isEnabled) return;
      // Chỉ log click trên các phần tử "có ý nghĩa" (nút, input, select, link...)
      const target = e.target.closest('button, [role="button"], input, select, a, [data-log]');
      if (!target) return;

      addLog(
        'click',
        {
          tag: target.tagName,
          text: target.innerText?.slice(0, 60) || target.value || '',
          id: target.id || undefined,
          name: target.name || undefined,
          dataLog: target.dataset?.log || undefined,
        },
        componentName
      );
    };

    // dùng capture phase (true) để bắt được click dù bên trong có e.stopPropagation()
    el.addEventListener('click', handleClick, true);
    return () => el.removeEventListener('click', handleClick, true);
  }, [componentName, isEnabled, addLog]);

  // Phím tắt Ctrl+Shift+L để bật/tắt panel
  useEffect(() => {
    const handler = e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setIsPanelVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('loggerVisible', String(isPanelVisible));
  }, [isPanelVisible]);

  return (
    <div className="logger-wrapper">
      <button
        className={`logger-toggle-btn ${isPanelVisible ? 'active' : ''}`}
        onClick={() => setIsPanelVisible(v => !v)}
        title="Toggle Logger Panel (Ctrl+Shift+L)"
      >
        📋
        <span className="logger-toggle-badge">{totalLogs}</span>
      </button>

      <div className="logger-content" ref={contentRef}>{children || <Outlet />}</div>

      {isPanelVisible && (
        <LoggerPanel componentName={componentName} onClose={() => setIsPanelVisible(false)} />
      )}
    </div>
  );
}

function getComponentNameFromPath(path) {
  if (path === '/') return 'SortingPage';
  const name = path.split('/')[1];
  if (!name) return 'Home';
  return name.charAt(0).toUpperCase() + name.slice(1) + 'Page';
}
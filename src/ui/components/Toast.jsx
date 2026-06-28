import { useState, useEffect } from 'react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  position:  { bottom: '20px', right: '20px' },
  fontSize:  { icon: '18px', text: '14px' },
  fontFamily: "'JetBrains Mono', monospace",
  borderRadius: '8px',
  padding: '16px 20px',
  zIndex: 9999,
  animation: {
    slideInDuration:  '1s',
    slideOutStart:    '2s',
    slideOutDuration: '1s',
  },
  types: {
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', icon: '✓' },
    error:   { bg: 'rgba(239, 68, 68, 0.1)',  border: '#ef4444', icon: '✕' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: '⚠' },
  },
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toast
 * Props:
 *   message  string  — nội dung hiển thị
 *   type     'success' | 'error' | 'warning'
 *   duration number  — ms trước khi ẩn (default 3000)
 */
export default function Toast({ message, type = 'success', duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!message) return;
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!isVisible || !message) return null;

  const { bg, border, icon } = CONFIG.types[type] ?? CONFIG.types.success;
  const { slideInDuration, slideOutStart, slideOutDuration } = CONFIG.animation;

  return (
    <div style={{
      position:    'fixed',
      bottom:      CONFIG.position.bottom,
      right:       CONFIG.position.right,
      backgroundColor: bg,
      border:      `2px solid ${border}`,
      borderRadius: CONFIG.borderRadius,
      padding:     CONFIG.padding,
      color:       border,
      fontSize:    CONFIG.fontSize.text,
      fontWeight:  'bold',
      fontFamily:  CONFIG.fontFamily,
      display:     'flex',
      alignItems:  'center',
      gap:         '12px',
      zIndex:      CONFIG.zIndex,
      animation:   `toast-slideIn ${slideInDuration} ease-out, toast-slideOut ${slideOutDuration} ease-out ${slideOutStart} forwards`,
    }}>
      <span style={{ fontSize: CONFIG.fontSize.icon }}>{icon}</span>
      <span>{message}</span>

      <style>{`
        @keyframes toast-slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes toast-slideOut {
          from { transform: translateX(0);     opacity: 1; }
          to   { transform: translateX(400px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  bg:                '#050408',
  textColor:         '#aaa',
  fontFamily:        "'JetBrains Mono', monospace",
  spinnerFontSize:   '48px',
  messageFontSize:   '16px',
  animationDuration: '1s',
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LoadingSpinner
 * Props:
 *   message  string  — dòng chữ phía dưới icon (default 'Đang tải...')
 */
export default function LoadingSpinner({ message = 'Đang tải...' }) {
  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      height:          '100vh',
      backgroundColor: CONFIG.bg,
      color:           CONFIG.textColor,
      fontFamily:      CONFIG.fontFamily,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize:        CONFIG.spinnerFontSize,
          marginBottom:    '20px',
          animation:       `loading-spin ${CONFIG.animationDuration} linear infinite`,
        }}>
          ⟳
        </div>
        <p style={{ fontSize: CONFIG.messageFontSize }}>{message}</p>

        <style>{`
          @keyframes loading-spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

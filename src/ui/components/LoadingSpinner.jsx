export default function LoadingSpinner({ message = 'Đang tải...' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#050408',
      color: '#fff',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px',
          animation: 'spin 1s linear infinite',
        }}>
          ⟳
        </div>
        <p style={{ fontSize: '16px', color: '#aaa' }}>{message}</p>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

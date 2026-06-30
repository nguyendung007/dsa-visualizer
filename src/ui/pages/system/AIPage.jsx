import { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../../api/ai.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import './AIPage.css';

export default function AIPage() {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'ai', text }
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setError('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.ask(question, context.trim() || undefined);
      const answer = res.data?.answer ?? 'Không nhận được phản hồi từ AI';
      setMessages(prev => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Lỗi khi gọi AI, vui lòng thử lại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <h1>🤖 Hỏi AI về thuật toán</h1>
        <p className="ai-subtitle">Đặt câu hỏi về thuật toán, cấu trúc dữ liệu, độ phức tạp...</p>
      </div>

      <div className="ai-context-bar">
        <label htmlFor="ai-context">Ngữ cảnh (tuỳ chọn):</label>
        <input
          id="ai-context"
          type="text"
          placeholder="VD: Dijkstra, QuickSort, AVL Tree..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
        {messages.length > 0 && (
          <button type="button" className="ai-clear-btn" onClick={handleClear}>
            Xoá hội thoại
          </button>
        )}
      </div>

      <div className="ai-chat-box">
        {messages.length === 0 && !loading && (
          <div className="ai-empty">
            Hãy đặt câu hỏi đầu tiên của bạn, ví dụ: "Độ phức tạp của Merge Sort là gì?"
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`ai-message ai-message-${m.role}`}>
            <div className="ai-message-role">{m.role === 'user' ? 'Bạn' : 'AI'}</div>
            <div className="ai-message-text">{m.text}</div>
          </div>
        ))}

        {loading && (
          <div className="ai-message ai-message-ai">
            <div className="ai-message-role">AI</div>
            <div className="ai-message-text">
              <LoadingSpinner message="Đang suy nghĩ..." />
            </div>
          </div>
        )}

        {error && <div className="ai-error">{error}</div>}

        <div ref={bottomRef} />
      </div>

      <form className="ai-input-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nhập câu hỏi về thuật toán..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Gửi
        </button>
      </form>
    </div>
  );
}
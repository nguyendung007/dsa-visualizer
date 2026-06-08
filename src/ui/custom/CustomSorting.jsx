// Phục vụ nhận thuật toán từ user,sẽ dùng chung với mọi page 

import { useState } from 'react';
import { wrapWithProxy } from '../../core/sorting/proxyWrapper.js';
import './CustomSorting.css';

const PLACEHOLDER = `// Nhận vào arr[], sắp xếp trực tiếp trên mảng
// Chỉ dùng arr[i], arr[j] để đọc/ghi — không dùng splice, sort()
function mySort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let t = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = t;
      }
    }
  }
}`;

export default function CustomAlgoModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleAdd() {
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên thuật toán.'); return;
    }
    if (!code.trim()) {
      setError('Vui lòng nhập code.'); return;
    }

    // Parse hàm từ code người dùng
    let userFn;
    try {
      // eslint-disable-next-line no-new-func
      userFn = new Function(`${code}; return mySort;`)();
      if (typeof userFn !== 'function') throw new Error('Không tìm thấy hàm mySort.');
    } catch (e) {
      setError('Lỗi parse: ' + e.message); return;
    }

    // Thử chạy thử với mảng nhỏ để validate
    try {
      const testSteps = wrapWithProxy(userFn, [3, 1, 2]);
      if (!testSteps || testSteps.length === 0) throw new Error('Không sinh được steps.');
    } catch (e) {
      setError('Lỗi khi chạy thử: ' + e.message); return;
    }

    // Trả về fn bọc sẵn trong proxy để SortingPage dùng như algo bình thường
    const wrappedFn = (arr) => wrapWithProxy(userFn, arr);

    onAdd({
      fn: wrappedFn,
      name: name.trim(),
      color: '#f472b6',
    });

    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">＋ Thêm thuật toán của bạn</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label className="modal-label">Tên thuật toán</label>
          <input
            className="modal-input"
            placeholder="vd: My Bubble Sort"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <label className="modal-label" style={{ marginTop: 16 }}>
            Code hàm <span className="modal-note">(tên hàm phải là <code>mySort</code>)</span>
          </label>
          <textarea
            className="modal-textarea"
            placeholder={PLACEHOLDER}
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
          />

          <div className="modal-warning">
            ⚠ Chỉ hỗ trợ thuật toán dùng so sánh và swap trực tiếp qua index.
            Không dùng <code>arr.splice()</code>, <code>arr.sort()</code>, hay mảng tạm.
          </div>

          {error && <div className="modal-error">✕ {error}</div>}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="modal-btn-add" onClick={handleAdd}>Thêm vào danh sách</button>
        </div>

      </div>
    </div>
  );
}
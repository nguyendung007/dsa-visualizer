import { useState } from 'react';
import './ComplexityPage.css';

const SORTING = [
  { name: 'Selection Sort', best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false, note: 'Luôn O(n²), không phụ thuộc dữ liệu' },
  { name: 'Insertion Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, note: 'Tốt cho mảng gần sắp xếp' },
  { name: 'Bubble Sort',    best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, note: 'Có thể dừng sớm nếu không đổi chỗ' },
  { name: 'Shell Sort',     best: 'O(n log n)', avg: 'O(n log² n)', worst: 'O(n²)', space: 'O(1)', stable: false, note: 'Phụ thuộc sequence gap' },
  { name: 'Merge Sort',     best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true, note: 'Ổn định, dùng cho linked list' },
  { name: 'Quick Sort',     best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false, note: 'Nhanh nhất thực tế, pivot quan trọng' },
  { name: 'Heap Sort',      best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false, note: 'Đảm bảo O(n log n), không cần extra space' },
  { name: 'Counting Sort',  best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n+k)', space: 'O(k)', stable: true, note: 'k = range giá trị, chỉ dùng cho số nguyên' },
  { name: 'Radix Sort',     best: 'O(nk)', avg: 'O(nk)', worst: 'O(nk)', space: 'O(n+k)', stable: true, note: 'k = số chữ số, rất nhanh cho số nguyên lớn' },
  { name: 'Bucket Sort',    best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n²)', space: 'O(n)', stable: true, note: 'Tốt khi phân bố đều' },
];

const GRAPH = [
  { name: 'BFS',            time: 'O(V+E)', space: 'O(V)', note: 'Tìm đường ngắn nhất (unweighted), dùng Queue' },
  { name: 'DFS',            time: 'O(V+E)', space: 'O(V)', note: 'Phát hiện chu trình, dùng Stack/Đệ quy' },
  { name: 'Dijkstra',       time: 'O((V+E) log V)', space: 'O(V)', note: 'Shortest path, không có cạnh âm, dùng Min-Heap' },
  { name: 'Bellman-Ford',   time: 'O(VE)', space: 'O(V)', note: 'Shortest path, hỗ trợ cạnh âm, phát hiện chu trình âm' },
  { name: 'Kruskal',        time: 'O(E log E)', space: 'O(V)', note: 'MST, sắp xếp cạnh + Union-Find' },
  { name: 'Prim',           time: 'O((V+E) log V)', space: 'O(V)', note: 'MST, tốt cho đồ thị dày, dùng Min-Heap' },
  { name: 'Kosaraju',       time: 'O(V+E)', space: 'O(V)', note: 'SCC: 2 lần DFS + đồ thị đảo ngược' },
  { name: 'Topo Sort (DFS)',time: 'O(V+E)', space: 'O(V)', note: 'Chỉ cho DAG, dùng DFS + stack' },
  { name: 'Topo Sort (Kahn)',time: 'O(V+E)', space: 'O(V)', note: 'Dùng in-degree + Queue, phát hiện chu trình' },
];

const TREES = [
  { name: 'BST Insert',     best: 'O(log n)', avg: 'O(log n)', worst: 'O(n)', space: 'O(n)', note: 'Worst case khi cây suy thoái thành linked list' },
  { name: 'BST Delete',     best: 'O(log n)', avg: 'O(log n)', worst: 'O(n)', space: 'O(n)', note: 'Cần tìm in-order successor' },
  { name: 'BST Search',     best: 'O(1)', avg: 'O(log n)', worst: 'O(n)', space: 'O(1)', note: '' },
  { name: 'BST Floor/Ceil', best: 'O(log n)', avg: 'O(log n)', worst: 'O(n)', space: 'O(1)', note: 'Duyệt cây theo điều kiện' },
  { name: 'AVL Insert',     best: 'O(log n)', avg: 'O(log n)', worst: 'O(log n)', space: 'O(n)', note: 'Tự cân bằng bằng rotation, luôn O(log n)' },
  { name: 'Inorder',        best: 'O(n)', avg: 'O(n)', worst: 'O(n)', space: 'O(h)', note: 'h = chiều cao cây, cho BST xuất tăng dần' },
  { name: 'BFS (Level Order)',best:'O(n)', avg: 'O(n)', worst: 'O(n)', space: 'O(w)', note: 'w = chiều rộng lớn nhất, dùng Queue' },
];

const STRUCTURES = [
  { name: 'Stack Push/Pop',       time: 'O(1)', space: 'O(n)', note: 'LIFO, dùng array hoặc linked list' },
  { name: 'Queue Enqueue/Dequeue',time: 'O(1)', space: 'O(n)', note: 'FIFO, dùng array hoặc linked list' },
  { name: 'Priority Queue Insert',time: 'O(log n)', space: 'O(n)', note: 'Min/Max Heap' },
  { name: 'Priority Queue ExtractMin',time:'O(log n)', space: 'O(n)', note: 'Heapify down sau khi lấy' },
  { name: 'Hash Table Insert',    time: 'O(1) avg', space: 'O(n)', note: 'Worst O(n) nếu nhiều collision' },
  { name: 'Hash Table Search',    time: 'O(1) avg', space: 'O(n)', note: 'Chaining hoặc Linear Probing' },
  { name: 'Linked List Insert Head', time: 'O(1)', space: 'O(n)', note: 'Không cần duyệt' },
  { name: 'Linked List Insert Tail', time: 'O(n)', space: 'O(n)', note: 'O(1) nếu giữ con trỏ tail' },
  { name: 'Linked List Search',   time: 'O(n)', space: 'O(1)', note: 'Duyệt tuyến tính' },
];

const UNION_FIND = [
  { name: 'Quick Find — Union',   time: 'O(n)', space: 'O(n)', note: 'Cập nhật toàn bộ id[]' },
  { name: 'Quick Find — Find',    time: 'O(1)', space: 'O(n)', note: 'Truy cập trực tiếp id[i]' },
  { name: 'Quick Union — Union',  time: 'O(n)', space: 'O(n)', note: 'Worst case cây thẳng' },
  { name: 'Quick Union — Find',   time: 'O(n)', space: 'O(n)', note: 'Phải đi lên root' },
  { name: 'Weighted QU — Union',  time: 'O(log n)', space: 'O(n)', note: 'Cây cân bằng theo size' },
  { name: 'Weighted QU — Find',   time: 'O(log n)', space: 'O(n)', note: 'Chiều cao max O(log n)' },
  { name: 'Path Compression — Find', time: 'O(α(n))', space: 'O(n)', note: 'α = inverse Ackermann ≈ O(1) thực tế' },
];

const STRING = [
  { name: 'KMP Search',        time: 'O(n+m)', space: 'O(m)', note: 'n=text, m=pattern. Xây LPS table O(m)' },
  { name: 'Boyer-Moore',       time: 'O(n/m) best', space: 'O(σ)', note: 'σ=alphabet size. Thực tế rất nhanh' },
  { name: 'Rabin-Karp',        time: 'O(nm) worst', space: 'O(1)', note: 'O(n+m) trung bình, tốt khi nhiều pattern' },
  { name: 'TST Insert/Search', time: 'O(L)', space: 'O(L·n)', note: 'L = chiều dài chuỗi' },
  { name: 'LSD Radix Sort',    time: 'O(W·N)', space: 'O(N)', note: 'W=chiều dài chuỗi, N=số chuỗi' },
  { name: 'MSD Radix Sort',    time: 'O(W·N)', space: 'O(N+W)', note: 'Đệ quy, tốt hơn LSD cho chuỗi dài' },
  { name: '3-Way Radix Quick', time: 'O(W·N) worst', space: 'O(W+log N)', note: 'O(N log N) trung bình, rất nhanh thực tế' },
  { name: 'Suffix Array',      time: 'O(N log N)', space: 'O(N)', note: 'Prefix doubling. O(N log² N) với sort' },
];

const COMPLEXITY_THEORY = [
  { cls: 'O(1)',       name: 'Hằng số',      example: 'Array access, Hash lookup trung bình', color: '#10b981' },
  { cls: 'O(log n)',   name: 'Logarithmic',  example: 'Binary Search, AVL Search, Heap ops', color: '#58a6ff' },
  { cls: 'O(n)',       name: 'Tuyến tính',   example: 'Linear Search, BFS, DFS, Counting Sort', color: '#a78bfa' },
  { cls: 'O(n log n)', name: 'Linearithmic', example: 'Merge Sort, Heap Sort, Quick Sort avg', color: '#f59e0b' },
  { cls: 'O(n²)',      name: 'Bậc hai',      example: 'Bubble/Selection/Insertion Sort, Brute Force', color: '#f97316' },
  { cls: 'O(n³)',      name: 'Bậc ba',       example: 'Floyd-Warshall, ma trận nhân ngây thơ', color: '#ef4444' },
  { cls: 'O(2ⁿ)',      name: 'Hàm mũ',       example: 'Bài toán tập con, Traveling Salesman (exact)', color: '#dc2626' },
  { cls: 'O(n!)',      name: 'Giai thừa',    example: 'Liệt kê hoán vị, Brute force TSP', color: '#991b1b' },
];

function SectionTitle({ children }) {
  return <h2 className="cx-section-title">{children}</h2>;
}

function Table({ headers, rows }) {
  return (
    <div className="cx-table-wrap">
      <table className="cx-table">
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComplexityBadge({ val }) {
  const color = val?.includes('O(1)') ? '#10b981'
    : val?.includes('log n)') ? '#58a6ff'
    : val?.includes('O(n)') && !val?.includes('²') ? '#a78bfa'
    : val?.includes('n log') ? '#f59e0b'
    : val?.includes('²') ? '#f97316'
    : '#ef4444';
  return <span style={{ color, fontWeight: 700, fontFamily: 'monospace' }}>{val}</span>;
}

export default function ComplexityPage() {
  const [custom, setCustom] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cx_custom') || '[]');
    } catch (e) { return []; }
  });
  const [newAlgo, setNewAlgo] = useState({ category: 'sorting', name: '', best: '', avg: '', worst: '', space: '', note: '' });

  function saveCustom(list) {
    setCustom(list);
    try { localStorage.setItem('cx_custom', JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function addCustom() {
    if (!newAlgo.name.trim()) return;
    const list = [...custom, { ...newAlgo }];
    saveCustom(list);
    setNewAlgo({ category: 'sorting', name: '', best: '', avg: '', worst: '', space: '', note: '' });
  }

  function removeCustom(i) {
    const list = custom.slice(); list.splice(i, 1); saveCustom(list);
  }

  const sortingItems = [...SORTING, ...custom.filter(c => c.category === 'sorting')];
  const graphItems = [...GRAPH, ...custom.filter(c => c.category === 'graph')];
  const treeItems = [...TREES, ...custom.filter(c => c.category === 'trees')];
  const structItems = [...STRUCTURES, ...custom.filter(c => c.category === 'structures')];
  const stringItems = [...STRING, ...custom.filter(c => c.category === 'string')];
  const unionItems = [...UNION_FIND, ...custom.filter(c => c.category === 'union')];

  function wikiLink(name) {
    const q = encodeURIComponent(name);
    return `https://en.wikipedia.org/wiki/Special:Search?search=${q}`;
  }
  return (
    <div className="page cx-page">
      <div className="page-header">
        <h1>Lý thuyết & Độ phức tạp</h1>
        <p>Tổng hợp Big-O của tất cả thuật toán trong dự án</p>
      </div>

      <div className="cx-content">
        <section className="cx-section">
          <SectionTitle>✚ Thêm thuật toán tùy ý</SectionTitle>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <select className="arr-input" value={newAlgo.category} onChange={e=>setNewAlgo({...newAlgo,category:e.target.value})}>
              <option value="sorting">Sorting</option>
              <option value="graph">Graph</option>
              <option value="trees">Trees</option>
              <option value="structures">Data Structures</option>
              <option value="string">String</option>
              <option value="union">Union-Find</option>
            </select>
            <input className="arr-input" placeholder="Tên thuật toán" value={newAlgo.name} onChange={e=>setNewAlgo({...newAlgo,name:e.target.value})} />
            <input className="arr-input" placeholder="Best" value={newAlgo.best} onChange={e=>setNewAlgo({...newAlgo,best:e.target.value})} />
            <input className="arr-input" placeholder="Average" value={newAlgo.avg} onChange={e=>setNewAlgo({...newAlgo,avg:e.target.value})} />
            <input className="arr-input" placeholder="Worst" value={newAlgo.worst} onChange={e=>setNewAlgo({...newAlgo,worst:e.target.value})} />
            <input className="arr-input" placeholder="Space" value={newAlgo.space} onChange={e=>setNewAlgo({...newAlgo,space:e.target.value})} />
            <input className="arr-input" placeholder="Ghi chú" value={newAlgo.note} onChange={e=>setNewAlgo({...newAlgo,note:e.target.value})} style={{flex:1}} />
            <button className="btn-generate" onClick={addCustom}>Lưu</button>
          </div>
          {custom.length > 0 && (
            <div style={{marginTop:8}}>
              <strong>Đã lưu:</strong>
              <Table
                headers={["Tên","Best","Average","Worst","Space","Ghi chú","Hành động"]}
                rows={custom.map((c,i) => ([
                  <b style={{ color: '#e2e8f0' }}>{c.name} <small style={{color:'#7c93b4'}}>({c.category})</small></b>,
                  <ComplexityBadge val={c.best} />,
                  <ComplexityBadge val={c.avg} />,
                  <ComplexityBadge val={c.worst} />,
                  <ComplexityBadge val={c.space} />,
                  <span style={{ color: '#4a6b8a', fontSize: 11 }}>{c.note}</span>,
                  <button className="btn-random" onClick={() => removeCustom(i)}>Xóa</button>
                ]))}
              />
            </div>
          )}
        </section>
        {/* Big-O Theory */}
        <section className="cx-section">
          <SectionTitle>📐 Big-O Notation — Lý thuyết</SectionTitle>
          <div className="cx-theory-grid">
            {COMPLEXITY_THEORY.map(item => (
              <div key={item.cls} className="cx-theory-card">
                <div className="cx-theory-cls" style={{ color: item.color }}>{item.cls}</div>
                <div className="cx-theory-name">{item.name}</div>
                <div className="cx-theory-ex">{item.example}</div>
              </div>
            ))}
          </div>
          <div className="cx-note">
            <b>Quy tắc Big-O:</b> Bỏ hệ số hằng và các số hạng bậc thấp. O(3n² + 2n + 7) = O(n²).
            <br/>
            <b>Best/Average/Worst case</b> là 3 tình huống khác nhau của cùng một thuật toán.
            <br/>
            <b>Space complexity</b> bao gồm cả input (in-place) hoặc chỉ extra space (auxiliary).
          </div>
        </section>

        {/* Sorting */}
        <section className="cx-section">
          <SectionTitle>≋ Sorting Algorithms</SectionTitle>
          <Table
            headers={['Thuật toán', 'Best', 'Average', 'Worst', 'Space', 'Stable', 'Ghi chú', 'Xem thêm']}
            rows={sortingItems.map(a => [
              <b style={{ color: '#e2e8f0' }}>{a.name}</b>,
              <ComplexityBadge val={a.best} />,
              <ComplexityBadge val={a.avg} />,
              <ComplexityBadge val={a.worst} />,
              <ComplexityBadge val={a.space} />,
              <span style={{ color: a.stable ? '#10b981' : '#ef4444' }}>{a.stable ? '✓' : '✗'}</span>,
              <span style={{ color: '#4a6b8a', fontSize: 11 }}>{a.note}</span>,
              <a href={wikiLink(a.name)} target="_blank" rel="noopener noreferrer">Xem thêm</a>,
            ])}
          />
        </section>

        {/* Graph */}
        <section className="cx-section">
          <SectionTitle>◎ Graph Algorithms</SectionTitle>
          <Table
            headers={['Thuật toán', 'Time', 'Space', 'Ghi chú', 'Xem thêm']}
            rows={graphItems.map(a => [
              <b style={{ color: '#e2e8f0' }}>{a.name}</b>,
              <ComplexityBadge val={a.time} />,
              <ComplexityBadge val={a.space} />,
              <span style={{ color: '#4a6b8a', fontSize: 11 }}>{a.note}</span>,
              <a href={wikiLink(a.name)} target="_blank" rel="noopener noreferrer">Xem thêm</a>,
            ])}
          />
        </section>

        {/* Trees */}
        <section className="cx-section">
          <SectionTitle>⌥ Tree Operations</SectionTitle>
          <Table
            headers={['Thao tác', 'Best', 'Average', 'Worst', 'Space', 'Ghi chú', 'Xem thêm']}
            rows={treeItems.map(a => [
              <b style={{ color: '#e2e8f0' }}>{a.name}</b>,
              <ComplexityBadge val={a.best} />,
              <ComplexityBadge val={a.avg} />,
              <ComplexityBadge val={a.worst} />,
              <ComplexityBadge val={a.space} />,
              <span style={{ color: '#4a6b8a', fontSize: 11 }}>{a.note}</span>,
              <a href={wikiLink(a.name)} target="_blank" rel="noopener noreferrer">Xem thêm</a>,
            ])}
          />
        </section>

        {/* Data Structures */}
        <section className="cx-section">
          <SectionTitle>⊞ Data Structures</SectionTitle>
          <Table
            headers={['Thao tác', 'Time', 'Space', 'Ghi chú', 'Xem thêm']}
            rows={structItems.map(a => [
              <b style={{ color: '#e2e8f0' }}>{a.name}</b>,
              <ComplexityBadge val={a.time} />,
              <ComplexityBadge val={a.space} />,
              <span style={{ color: '#4a6b8a', fontSize: 11 }}>{a.note}</span>,
              <a href={wikiLink(a.name)} target="_blank" rel="noopener noreferrer">Xem thêm</a>,
            ])}
          />
        </section>

        {/* Union-Find */}
        <section className="cx-section">
          <SectionTitle>⊕ Union-Find</SectionTitle>
          <Table
            headers={['Thao tác', 'Time', 'Space', 'Ghi chú', 'Xem thêm']}
            rows={unionItems.map(a => [
              <b style={{ color: '#e2e8f0' }}>{a.name}</b>,
              <ComplexityBadge val={a.time} />,
              <ComplexityBadge val={a.space} />,
              <span style={{ color: '#4a6b8a', fontSize: 11 }}>{a.note}</span>,
              <a href={wikiLink(a.name)} target="_blank" rel="noopener noreferrer">Xem thêm</a>,
            ])}
          />
        </section>

        {/* String */}
        <section className="cx-section">
          <SectionTitle>Σ String Algorithms</SectionTitle>
          <Table
            headers={['Thuật toán', 'Time', 'Space', 'Ghi chú', 'Xem thêm']}
            rows={stringItems.map(a => [
              <b style={{ color: '#e2e8f0' }}>{a.name}</b>,
              <ComplexityBadge val={a.time} />,
              <ComplexityBadge val={a.space} />,
              <span style={{ color: '#4a6b8a', fontSize: 11 }}>{a.note}</span>,
              <a href={wikiLink(a.name)} target="_blank" rel="noopener noreferrer">Xem thêm</a>,
            ])}
          />
        </section>
      </div>
    </div>
  );
}

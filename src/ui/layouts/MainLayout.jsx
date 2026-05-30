import { NavLink, Outlet } from 'react-router-dom';
import './MainLayout.css';

const nav = [
  { path: '/sorting',    icon: '≋', label: 'Sorting',           desc: 'Selection·Insertion·Merge·Quick·Heap·Counting·Radix·Shell·Bucket' },
  { path: '/trees',      icon: '⌥', label: 'BST & AVL Tree',    desc: 'Chèn·Xóa·AVL rotation·Floor·Ceil' },
  { path: '/traversal',  icon: '↺', label: 'Tree Traversal',    desc: 'Inorder·Preorder·Postorder·Level-order·Biểu thức' },
  { path: '/graph',      icon: '◎', label: 'Graph',             desc: 'BFS·DFS·Dijkstra·Bellman-Ford·Kruskal·Prim·Kosaraju·Topo' },
  { path: '/structures', icon: '⊞', label: 'Data Structures',   desc: 'Stack·Queue·Priority Queue·Hash Table' },
  { path: '/linkedlist', icon: '⟶', label: 'Linked List',       desc: 'Singly·Doubly·Circular — Chèn·Xóa·Đảo ngược' },
  { path: '/unionfind',  icon: '⊕', label: 'Union-Find',        desc: 'Quick Find·Quick Union·Weighted·Path Compression' },
  { path: '/strings',    icon: 'Σ', label: 'String Algorithms', desc: 'TST·LSD/MSD·3-Way·Suffix Array·KMP·BM·RK' },
  { path: '/problems',   icon: '⚡', label: 'Problems',          desc: 'Two Sum: Brute Force·Two Pointer·Hash Map' },
  { path: '/complexity', icon: '𝑂', label: 'Complexity',        desc: 'Big-O lý thuyết + bảng tra cứu tất cả thuật toán' },
];

export default function MainLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">∆</span>
          <div>
            <div className="brand-title">DSA Visual</div>
            <div className="brand-sub">Algorithm Visualizer</div>
          </div>
        </div>
        <nav className="nav">
          {nav.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <span className="nav-icon">{item.icon}</span>
              <div className="nav-text">
                <span className="nav-label">{item.label}</span>
                <span className="nav-desc">{item.desc}</span>
              </div>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="badge">MSSV 25022808</div>
          <div className="badge-sub">Nguyễn Hữu Dũng</div>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

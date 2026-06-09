// Thêm setting

import { NavLink, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import bgImage from '../../assets/bg1.png';
import '../styles/global.css';
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
  { path: '/settings', icon: '⚙', label: 'Settings', desc: 'Font · Màu nền' },
];


export default function MainLayout() {
  
  const [collapsed, setCollapsed] = useState(false);

  const [bgImg, setBgImg] = useState(() => localStorage.getItem('bgImage') || '');

  useEffect(() => {
  const font = localStorage.getItem('font') || "'JetBrains Mono', monospace";
  const bg   = localStorage.getItem('bg')   || '#050408';
  document.documentElement.style.setProperty('--font', font);
  document.documentElement.style.setProperty('--bg', bg);

  // Lắng nghe khi SettingsPage thay đổi ảnh nền
  const onStorage = () => {
  const saved = localStorage.getItem('bgImage');
  setBgImg(saved || ''); 
};

  window.addEventListener('bgImageChanged', onStorage);
  return () => window.removeEventListener('bgImageChanged', onStorage);
}, []);
  
  return (
    <div
         className={`layout ${collapsed ? 'collapsed' : ''}`}
         style={{
         backgroundImage: bgImg ? `url(${bgImg})` : 'none',
         backgroundSize: 'cover',
         backgroundPosition: 'center',
         backgroundAttachment: 'fixed',
  }}
>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <span className="brand-icon">∆</span>
          <div>
            <div className="brand-title">DSA Visualizer</div>
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
          <div className="badge">UET-IAI</div>
          <div className="app-desc">Made with ❤️ for learning</div>
        </div>
      </aside>

      <button className="toggle-btn" onClick={() => setCollapsed(c => !c)}>
        {collapsed ? '›' : '‹'}
      </button>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
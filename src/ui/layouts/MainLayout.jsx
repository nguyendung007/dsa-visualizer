import { NavLink, useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import GlobalUIEffects from '../components/GlobalUIEffects.jsx';
import SplitScreenTransition from '../components/SplitScreenTransition.jsx';
import Toast from '../components/Toast.jsx';
import '../styles/global.css';
import './MainLayout.css';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  brand: { icon: '∆', title: 'DSA Visualizer', badge: 'UET-IAI', tagline: 'Made with ❤️ for learning' },
  defaults: {
    font:  "'JetBrains Mono', monospace",
    bg:    '#050408',
  },
  cssVars: { font: '--font', bg: '--bg' },
  storageKeys: { font: 'font', bg: 'bg', bgImage: 'bgImage' },
  events:  { bgImageChanged: 'bgImageChanged' },
};

const NAV = [
  { path: '/sorting',     icon: '📊',  label: 'Sorting',           desc: 'Vài thuật toán sắp xếp' },
  { path: '/trees',       icon: '🌳',  label: 'BST & AVL Tree',    desc: 'Chèn-Xóa cây BST/AVL' },
  { path: '/traversal',   icon: '🔄',  label: 'Tree Traversal',    desc: 'Các loại duyệt cây - Biểu thức' },
  { path: '/graph',       icon: '🔗',  label: 'Graph',             desc: 'Các thuật toán đồ thị' },
  { path: '/maze',        icon: '🗺️',  label: 'Maze',              desc: 'Các thuật toán tìm kiếm trong mê cung' },
  { path: '/adversarial', icon: '⚔️',  label: 'Adversarial',       desc: 'Các thuật toán tìm kiếm đối kháng' },
  { path: '/knowledge',   icon: '🧠',  label: 'Knowledge',         desc: 'Các mô hình tri thức cơ bản' },
  { path: '/localsearch', icon: '🔍',  label: 'LocalSearch',       desc: 'Các thuật toán tìm kiếm cục bộ' },
  { path: '/decision',    icon: '🌿',  label: 'Decision Tree',     desc: 'ID3 - Xây dựng cây quyết định' },
  { path: '/naive',       icon: '📐',  label: 'Naive Bayes',       desc: 'Phân loại xác suất với định lý Bayes' },
  { path: '/structures',  icon: '📦',  label: 'Data Structures',   desc: 'Các cấu trúc dữ liệu cơ bản' },
  { path: '/linkedlist',  icon: '⛓️',  label: 'Linked List',       desc: 'Singly·Doubly·Circular — Chèn·Xóa·Đảo ngược' },
  { path: '/unionfind',   icon: '🔀',  label: 'Union-Find',        desc: 'Quick Find·Quick Union·Weighted·Path Compression' },
  { path: '/strings',     icon: '🔤',  label: 'String Algorithms', desc: 'TST·LSD/MSD·3-Way·Suffix Array·KMP·BM·RK' },
  { path: '/problems',    icon: '🎯',  label: 'Problems',          desc: 'Two Sum: Brute Force·Two Pointer·Hash Map' },
  { path: '/csp',         icon: '[o]', label: 'Csp',               desc: 'Các bài toán có ràng buộc CSP' },
  { path: '/complexity',  icon: '📈',  label: 'Complexity',        desc: 'Big-O lý thuyết + bảng tra cứu tất cả thuật toán' },
  { path: '/settings',    icon: '⚙️',  label: 'Settings',          desc: 'Font · Màu nền' },
];
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MainLayout — orchestrator duy nhất đọc context + localStorage.
 * Không có logic UI nào trong chính nó; chỉ distribute data xuống component con.
 */
export default function MainLayout() {
  const { user, logout }   = useAuth();
  const { toast }          = useProgress();
  const navigate           = useNavigate();
  const location           = useLocation();
  const currentOutlet      = useOutlet();

  const [collapsed, setCollapsed] = useState(false);

  // ── App-level settings (đọc localStorage một chỗ duy nhất) ─────────────
  const [bgImg, setBgImg] = useState(() =>
    localStorage.getItem(CONFIG.storageKeys.bgImage) || ''
  );

  useEffect(() => {
    const font = localStorage.getItem(CONFIG.storageKeys.font) || CONFIG.defaults.font;
    const bg   = localStorage.getItem(CONFIG.storageKeys.bg)   || CONFIG.defaults.bg;
    document.documentElement.style.setProperty(CONFIG.cssVars.font, font);
    document.documentElement.style.setProperty(CONFIG.cssVars.bg,   bg);

    const onBgImageChanged = () => {
      setBgImg(localStorage.getItem(CONFIG.storageKeys.bgImage) || '');
    };
    window.addEventListener(CONFIG.events.bgImageChanged, onBgImageChanged);
    return () => window.removeEventListener(CONFIG.events.bgImageChanged, onBgImageChanged);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Hiệu ứng toàn cục — không cần biết context hay storage */}
      <GlobalUIEffects />

      {/* Toast — nhận dữ liệu từ context qua đây, không tự import context */}
      {toast.message && <Toast message={toast.message} type={toast.type} />}

      <div
        className={`layout ${collapsed ? 'collapsed' : ''}`}
        style={{
          backgroundImage:    bgImg ? `url(${bgImg})` : 'none',
          backgroundSize:     'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="brand">
            <span className="brand-icon">{CONFIG.brand.icon}</span>
            <div>
              <div className="brand-title">{CONFIG.brand.title}</div>
            </div>
          </div>

          <nav className="nav">
            {NAV.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
              >
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-text">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-desc">{item.desc}</span>
                </div>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            {user && (
              <div style={{ marginBottom: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>
                  Đăng nhập: {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '8px 12px',
                    backgroundColor: 'rgba(255,67,54,0.2)',
                    color: '#ff4336', border: '1px solid #ff4336',
                    borderRadius: '4px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s',
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            )}
            <div className="badge">{CONFIG.brand.badge}</div>
            <div className="app-desc">{CONFIG.brand.tagline}</div>
          </div>
        </aside>

        <button className="toggle-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '›' : '‹'}
        </button>

        <main className="content">
          {/* location + outlet được truyền xuống — SplitScreenTransition không tự đọc router */}
          <SplitScreenTransition location={location} outlet={currentOutlet} />
        </main>
      </div>
    </>
  );
}

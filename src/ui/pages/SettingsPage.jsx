// Thêm module setting để user tùy chỉnh
import { useState } from 'react';
import './SettingsPage.css';

import bg1 from '../../assets/bg1.png';
import bg2 from '../../assets/bg2.png';
import bg3 from '../../assets/bg3.png';

const FONTS = [
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'JetBrains Mono',  value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: 'Georgia',         value: "Georgia, serif" },
  { label: 'Arial',           value: "Arial, sans-serif" },
  { label: 'Courier New',     value: "'Courier New', monospace" },
];

const BG_PRESETS = [
  { label: 'Đen tuyền',   value: '#000000' },
  { label: 'Navy đậm',    value: '#050408' },
  { label: 'Xanh đêm',   value: '#0a0e1a' },
  { label: 'Xám tối',    value: '#111318' },
  { label: 'Tuỳ chỉnh',  value: 'custom' },
];

const BG_IMAGES = [
  { label: 'Your Name', src: bg1 },
  { label: 'Kurumi', src: bg2 },
  { label: 'Tokka Tokyo Ghoul',   src: bg3 },
];

function applySettings(font, bg) {
  document.documentElement.style.setProperty('--font', font);
  document.documentElement.style.setProperty('--bg', bg);
}

export default function SettingsPage() {
  const [font, setFont] = useState(() => localStorage.getItem('font') || FONTS[0].value);
  const [bg, setBg] = useState(() => localStorage.getItem('bg') || '#000000');
  const [customBg, setCustomBg] = useState(bg);
  const [saved, setSaved] = useState(false);

  const isCustom = !BG_PRESETS.slice(0, -1).some(p => p.value === bg);

  function handleFont(val) {
    setFont(val);
    applySettings(val, bg);
  }

  function handleBgPreset(val) {
    if (val === 'custom') return;
    setBg(val);
    setCustomBg(val);
    applySettings(font, val);
  }

  function handleCustomBg(val) {
    setCustomBg(val);
    setBg(val);
    applySettings(font, val);
  }

  function handleSave() {
    localStorage.setItem('font', font);
    localStorage.setItem('bg', bg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    const defaultFont = FONTS[1].value;
    const defaultBg = '#050408';
    setFont(defaultFont);
    setBg(defaultBg);
    setCustomBg(defaultBg);
    applySettings(defaultFont, defaultBg);
    localStorage.removeItem('font');
    localStorage.removeItem('bg');
  }

  const [bgImage, setBgImage] = useState(() => localStorage.getItem('bgImage') || '');

  function handleBgImage(src) {
  setBgImage(src);
  localStorage.setItem('bgImage', src);  // thêm
  window.dispatchEvent(new Event('bgImageChanged'));  // thêm
  document.documentElement.style.setProperty('--bg-image', `url(${src})`);
}

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙ Settings</h1>
        <p>Tuỳ chỉnh giao diện · Font · Màu nền</p>
      </div>

      <div className="settings-body">

        {/* Font */}
        <section className="settings-section">
          <div className="settings-section-title">Phông chữ</div>
          <div className="settings-options">
            {FONTS.map(f => (
              <button
                key={f.value}
                className={`settings-option ${font === f.value ? 'active' : ''}`}
                style={{ fontFamily: f.value }}
                onClick={() => handleFont(f.value)}
              >
                {f.label}
                <span className="settings-preview">Aa Bb 123</span>
              </button>
            ))}
          </div>
        </section>

        {/* Màu nền */}
        <section className="settings-section">
          <div className="settings-section-title">Màu nền</div>
          <div className="settings-options">
            {BG_PRESETS.slice(0, -1).map(p => (
              <button
                key={p.value}
                className={`settings-option ${bg === p.value && !isCustom ? 'active' : ''}`}
                onClick={() => handleBgPreset(p.value)}
              >
                <span className="settings-color-dot" style={{ background: p.value }} />
                {p.label}
                <span className="settings-preview" style={{ color: '#4a6b8a' }}>{p.value}</span>
              </button>
            ))}

            {/* Custom color */}
            <div className={`settings-option ${isCustom ? 'active' : ''}`}>
              <span className="settings-color-dot" style={{ background: customBg }} />
              Tuỳ chỉnh
              <input
                type="color"
                className="settings-color-input"
                value={customBg}
                onChange={e => handleCustomBg(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Background */}
        <section className="settings-section">
          <div className="settings-section-title">Ảnh nền</div>
          <div className="settings-bg-grid">
            {BG_IMAGES.map(img => (
              <div
                key={img.src}
                className={`settings-bg-thumb ${bgImage === img.src ? 'active' : ''}`}
                style={{ backgroundImage: `url(${img.src})` }}
                onClick={() => handleBgImage(img.src)}
              >
                <span>{img.label}</span>
              </div>
            ))}

            {/* Upload ảnh tùy chỉnh */}
            <label className="settings-bg-upload">
              ＋ Tải ảnh lên
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  handleBgImage(url);
                }}
              />
            </label>
          </div>
        </section>

        {/* Preview */}
        <section className="settings-section">
          <div className="settings-section-title">Xem trước</div>
          <div className="settings-preview-box" style={{ background: bg, fontFamily: font }}>
            <div className="settings-preview-title">DSA Visualizer</div>
            <div className="settings-preview-text">Sorting · Graph · Trees · Linked List</div>
            <div className="settings-preview-code">function* bubbleSort(arr) {'{ yield step; }'}</div>
          </div>
        </section>

        {/* Actions */}
        <div className="settings-actions">
          <button className="settings-btn-reset" onClick={handleReset}>↺ Đặt lại mặc định</button>
          <button className="settings-btn-save" onClick={handleSave}>
            {saved ? '✓ Đã lưu!' : 'Lưu cài đặt'}
          </button>
        </div>

      </div>
    </div>
  );
}
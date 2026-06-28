import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  meteorCount:        500,
  meteorColors:       ['#17ecdb', '#4714d1', '#de0de6', '#f30a0a', '#2ae619'],
  transitionDuration: 1000,   // ms — tổng thời gian hiệu ứng
  overlayBg:          '#0a041a',
  overlayOpacity: {
    fadeIn:  300,   // ms
  },
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SplitScreenTransition
 * Props:
 *   location  object  — react-router location (cần .pathname)
 *   outlet    ReactNode — <Outlet /> đã được resolve ở MainLayout
 */
export default function SplitScreenTransition({ location, outlet }) {
  const [displayOutlet,   setDisplayOutlet]   = useState(outlet);
  const [displayPathname, setDisplayPathname] = useState(location.pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStatus, setTransitionStatus] = useState('');

  const half = CONFIG.transitionDuration / 2;

  useEffect(() => {
    if (location.pathname === displayPathname) {
      setDisplayOutlet(outlet);
      return;
    }

    setIsTransitioning(true);
    setTransitionStatus('active');

    const t1 = setTimeout(() => {
      setDisplayOutlet(outlet);
      setDisplayPathname(location.pathname);

      const t2 = setTimeout(() => {
        setTransitionStatus('closing');

        const t3 = setTimeout(() => {
          setIsTransitioning(false);
          setTransitionStatus('');
        }, half);

        return () => clearTimeout(t3);
      }, 50);

      return () => clearTimeout(t2);
    }, half);

    return () => clearTimeout(t1);
  }, [location.pathname, outlet, displayPathname]);

  // Meteor data — hình ngẫu nhiên, chỉ tạo lại khi transition bắt đầu
  const meteors = useMemo(() => {
    return Array.from({ length: CONFIG.meteorCount }).map((_, i) => {
      const color = CONFIG.meteorColors[Math.floor(Math.random() * CONFIG.meteorColors.length)];
      return {
        id: i,
        style: {
          top:            `${Math.random() * 100}%`,
          left:           `${Math.random() * 110 - 20}%`,
          width:          `${Math.random() * 170 + 150}px`,
          color,
          background:     `linear-gradient(90deg, ${color}, transparent)`,
          animationDelay: `${Math.random() * 900}ms`,
        },
      };
    });
  }, [isTransitioning]);

  // Inject keyframes once
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'meteor-dynamic-styles';
    style.textContent = `
      .meteor-transition-overlay {
        position: fixed; top: 0; left: 0;
        width: 100vw; height: 100vh;
        z-index: 9999; pointer-events: none; overflow: hidden;
        background: ${CONFIG.overlayBg};
        opacity: 0;
        transition: opacity ${CONFIG.overlayOpacity.fadeIn}ms ease;
      }
      .meteor-transition-overlay.active,
      .meteor-transition-overlay.closing { opacity: 1; }

      .star-container {
        position: absolute; width: 100%; height: 100%;
        transform: rotate(-45deg); top: -50%;
      }

      .dynamic-meteor {
        position: absolute; height: 2px; border-radius: 999px;
        filter: drop-shadow(0 0 8px currentColor);
        animation: meteorFall ${CONFIG.transitionDuration}ms cubic-bezier(0.17,0.67,0.83,0.67) forwards;
        opacity: 0;
      }

      @keyframes meteorFall {
        0%   { transform: translateX(0) scaleX(0);      opacity: 0; }
        10%  { opacity: 1; }
        40%  { transform: translateX(800px) scaleX(1.5); }
        100% { transform: translateX(2000px) scaleX(0); opacity: 0; }
      }

      .page-transition-content { opacity: 1; transition: opacity 400ms ease; }
      .page-transition-content.transitioning { opacity: 0.3; }
    `;
    document.head.appendChild(style);
    return () => document.getElementById('meteor-dynamic-styles')?.remove();
  }, []);

  const overlay = isTransitioning
    ? createPortal(
        <div className={`meteor-transition-overlay ${transitionStatus}`}>
          <div className="star-container">
            {meteors.map(m => (
              <div key={m.id} className="dynamic-meteor" style={m.style} />
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className={`page-transition-content ${isTransitioning ? 'transitioning' : ''}`}>
        {displayOutlet}
      </div>
      {overlay}
    </>
  );
}

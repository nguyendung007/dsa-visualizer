import { useEffect } from 'react';

const CONFIG = {
  particle: {
    defaultCount:  50,
    defaultColors: ['#17ecdb', '#4714d1', '#de0de6', '#f50808', '#0a041a', '#2ae619'],
    spawnInterval: 2800,  
    lifetime:      12000,  
    maxOverflow:   20,
    trimBatch:     5,
  },
  sparkle: {
    interval:  400,  
    lifetime:  1800, 
  },
  bigFlame: {
    interval:  4200, 
    lifetime:  2400, 
    size:      '120px',
  },
  subGlow: {
    interval: 150, 
  },
  ripple: {
    lifetime: 600,
  },
  shockwave: {
    lifetime:    1100,
    buttonLabel: '⚡ BLAZING ⚡',
    resetDelay:  1000, 
  },
  ids: {
    effectRoot:       'global-ui-effect-root',
    particleContainer:'particleContainer',
  },
  selectors: {
    button: '#magicBtn',
    hero:   '.hero',
    ring:   '.glow-ring',
    border: '.flame-border',
    sub:    '.sub',
    title:  '.title',
  },
  flags: {
    enableSparkle:  true,
    enableBigFlame: true,
    enableRipple:   true,
  },
};


function createStyleSheet(rootId) {
  const sheet = document.createElement('style');
  sheet.textContent = `
    #${rootId} {
      position: fixed; inset: 0;
      pointer-events: none; z-index: 0;
    }
    #${rootId} .particle {
      position: absolute; border-radius: 100%;
      pointer-events: none; will-change: transform, opacity;
      animation-name: floatParticle;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    #${rootId} .sparkle, #${rootId} .ripple-effect {
      position: fixed; pointer-events: none;
      border-radius: 50%; z-index: 999; opacity: 0;
    }
    #${rootId} .sparkle {
      width: 8px; height: 8px;
      background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%);
      filter: blur(1px);
      animation: sparkleFade 1.4s ease-out forwards;
    }
    #${rootId} .ripple-effect {
      border: 2px solid rgba(48,19,207,0.75);
      transform: translate(-50%,-50%) scale(0.5);
      opacity: 0.9;
      animation: rippleGrow 0.6s ease-out forwards;
    }
    @keyframes floatParticle {
      from { transform: translateY(0px); }
      to   { transform: translateY(-140px); }
    }
    @keyframes sparkleFade {
      0%   { opacity: 1; transform: scale(0.8); }
      100% { opacity: 0; transform: scale(1.4); }
    }
    @keyframes rippleGrow {
      to { transform: translate(-50%,-50%) scale(3); opacity: 0; }
    }
  `;
  document.head.appendChild(sheet);
  return sheet;
}

function spawnParticle(container, colors) {
  const el = document.createElement('div');
  el.classList.add('particle');
  const size = Math.random() * 7 + 3;
  const color = colors[Math.floor(Math.random() * colors.length)];
  Object.assign(el.style, {
    width:             `${size}px`,
    height:            `${size}px`,
    left:              `${Math.random() * 100}%`,
    top:               `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 8 + 5}s`,
    animationDelay:    `${Math.random() * 5}s`,
    backgroundColor:   color,
    boxShadow:         `0 0 ${size * 1.8}px ${color}`,
    opacity:           `${Math.random() * 0.7 + 0.2}`,
  });
  container.appendChild(el);
  return el;
}

function spawnSparkle(rootId) {
  const el = document.createElement('div');
  el.classList.add('sparkle');
  el.style.left = `${Math.random() * window.innerWidth}px`;
  el.style.top  = `${Math.random() * window.innerHeight}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), CONFIG.sparkle.lifetime);
}

function spawnRipple(e) {
  const el = document.createElement('div');
  el.classList.add('ripple-effect');
  el.style.left = `${e.clientX}px`;
  el.style.top  = `${e.clientY}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), CONFIG.ripple.lifetime);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GlobalUIEffects
 * Tất cả tuỳ chọn được truyền qua props (hoặc dùng CONFIG mặc định).
 * Component không đọc bất kỳ context / localStorage nào.
 *
 * Props:
 *   particleCount   number
 *   particleColors  string[]
 *   enableSparkle   boolean
 *   enableBigFlame  boolean
 *   enableRipple    boolean
 */

export default function GlobalUIEffects({

  particleCount  = CONFIG.particle.defaultCount,
  particleColors = CONFIG.particle.defaultColors,
  enableSparkle  = CONFIG.flags.enableSparkle,
  enableBigFlame = CONFIG.flags.enableBigFlame,
  enableRipple   = CONFIG.flags.enableRipple,
}) {

  useEffect(() => {  
    
    const colors = particleColors.length ? particleColors : CONFIG.particle.defaultColors;
    const { ids, selectors, particle, sparkle, bigFlame, subGlow, shockwave } = CONFIG;

    const root = document.createElement('div');
    root.id = ids.effectRoot;
    document.body.appendChild(root);

    const container = document.createElement('div');
    container.id = ids.particleContainer;
    root.appendChild(container);

    const sheet = createStyleSheet(ids.effectRoot);

    for (let i = 0; i < particleCount; i++) spawnParticle(container, colors);

    const particleTimer = setInterval(() => {
      if (container.children.length < particleCount + 15) {
        const p = spawnParticle(container, colors);
        setTimeout(() => p.remove(), particle.lifetime);
      }
      if (container.children.length > particleCount + particle.maxOverflow) {
        for (let i = 0; i < particle.trimBatch; i++)
          container.children[i]?.remove();
      }
    }, particle.spawnInterval);

    const sparkleTimer = enableSparkle
      ? setInterval(() => spawnSparkle(ids.effectRoot), sparkle.interval)
      : null;

    const onClickWindow = (e) => {
      if (enableRipple) spawnRipple(e);
      const btn = document.querySelector(selectors.button);
      if (btn && e.target.closest(selectors.button)) {
        btn.style.transform = 'scale(0.97)';
        setTimeout(() => { btn.style.transform = ''; }, 150);
      }
    };

    const onClickBody = (e) => {
      e.stopPropagation();
      const glow = document.createElement('div');
      Object.assign(glow.style, {
        position:     'fixed',
        left:         `${e.clientX}px`,
        top:          `${e.clientY}px`,
        width:        '10px',
        height:       '10px',
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(0,180,255,0.95) 0%, rgba(0,180,255,0.45) 35%, rgba(0,180,255,0.15) 60%, transparent 80%)',
        boxShadow:    '0 0 20px #00d9ff, 0 0 50px #00d9ff, 0 0 100px #00d9ff, 0 0 180px #00d9ff',
        transform:    'translate(-50%,-50%) scale(0)',
        opacity:      '1',
        pointerEvents:'none',
        zIndex:       '9999',
        transition:   'transform 1s cubic-bezier(0.22,1,0.36,1), opacity 1s ease-out',
      });
      document.body.appendChild(glow);
      requestAnimationFrame(() => {
        glow.style.transform = 'translate(-50%,-50%) scale(18)';
        glow.style.opacity   = '0';
      });
      setTimeout(() => glow.remove(), shockwave.lifetime);

      const btn = document.querySelector(selectors.button);
      if (btn) {
        const orig = btn.innerText;
        btn.innerText = shockwave.buttonLabel;
        btn.style.letterSpacing = '4px';
        btn.style.boxShadow     = '0 0 35px #00d9ff';
        setTimeout(() => {
          btn.innerText = orig;
          btn.style.letterSpacing = '';
          btn.style.boxShadow     = '';
        }, shockwave.resetDelay);
      }

      const titleEl = document.querySelector(selectors.title);
      if (titleEl) {
        titleEl.style.animation = 'none';
        void titleEl.offsetWidth;
        titleEl.style.animation = 'gradientShift 5s ease infinite, textGlitch 2.2s infinite';
        titleEl.style.transform = 'scale(1.02)';
        setTimeout(() => { titleEl.style.transform = ''; }, 200);
      }
    };

    const onMouseMove = (e) => {
      const heroBox = document.querySelector(selectors.hero);
      if (!heroBox) return;
      const rect    = heroBox.getBoundingClientRect();
      const distX   = (e.clientX - rect.left - rect.width  / 2) * 0.03;
      const distY   = (e.clientY - rect.top  - rect.height / 2) * 0.03;
      const ring    = document.querySelector(selectors.ring);
      if (ring) ring.style.transform = `translate(calc(-50% + ${distX}px), calc(-50% + ${distY}px)) scale(${1 + Math.abs(distX) * 0.01})`;
      const border  = document.querySelector(selectors.border);
      if (border) {
        const intensity = Math.min(0.8, Math.abs(distX) * 0.03 + 0.3);
        border.style.borderColor = `rgba(255, ${40 + intensity * 50}, 80, ${0.5 + intensity * 0.4})`;
      }
    };

    const subGlowTimer = setInterval(() => {
      const subEl = document.querySelector(selectors.sub);
      if (!subEl) return;
      const g = Math.sin(Date.now() / 800) * 0.2 + 0.6;
      subEl.style.boxShadow = `0 0 ${12 + g * 12}px rgba(255,40,80,${0.4 + g * 0.3})`;
    }, subGlow.interval);

    const bigFlameTimer = enableBigFlame
      ? setInterval(() => {
          const flare = document.createElement('div');
          Object.assign(flare.style, {
            position:     'fixed',
            width:        bigFlame.size,
            height:       bigFlame.size,
            left:         `${Math.random() * 80 + 10}%`,
            top:          `${Math.random() * 80 + 10}%`,
            background:   'radial-gradient(circle, rgba(255,50,80,0.25), rgba(100,0,0,0))',
            borderRadius: '50%',
            filter:       'blur(35px)',
            pointerEvents:'none',
            zIndex:       '2',
          });
          document.body.appendChild(flare);
          setTimeout(() => flare.remove(), bigFlame.lifetime);
        }, bigFlame.interval)
      : null;

    window.addEventListener('click', onClickWindow);
    document.body.addEventListener('click', onClickBody);
    document.body.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('click', onClickWindow);
      document.body.removeEventListener('click', onClickBody);
      document.body.removeEventListener('mousemove', onMouseMove);
      clearInterval(particleTimer);
      if (sparkleTimer)  clearInterval(sparkleTimer);
      clearInterval(subGlowTimer);
      if (bigFlameTimer) clearInterval(bigFlameTimer);
      sheet?.parentNode?.removeChild(sheet);
      root?.parentNode?.removeChild(root);
    };
  }, [particleCount, particleColors, enableSparkle, enableBigFlame, enableRipple]);

  return null;
}

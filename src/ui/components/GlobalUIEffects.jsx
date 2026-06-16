import { useEffect } from 'react';

const DEFAULT_PARTICLE_COUNT = 50
const DEFAULT_PARTICLE_COLORS = ['#17ecdb', '#4714d1', '#de0de6', '#d6e2e2', '#0a041a', '#2ae619'];

function createStyleSheet(effectRootId) {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    #${effectRootId} {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    #${effectRootId} .particle {
      position: absolute;
      border-radius: 100%;
      pointer-events: none;
      will-change: transform, opacity;
      animation-name: floatParticle;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }

    #${effectRootId} .sparkle,
    #${effectRootId} .ripple-effect {
      position: fixed;
      pointer-events: none;
      border-radius: 50%;
      z-index: 999;
      opacity: 0;
    }

    #${effectRootId} .sparkle {
      width: 8px;
      height: 8px;
      background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%);
      filter: blur(1px);
      animation: sparkleFade 1.4s ease-out forwards;
    }

    #${effectRootId} .ripple-effect {
      border: 2px solid rgba(48, 19, 207, 0.75);
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0.9;
      animation: rippleGrow 0.6s ease-out forwards;
    }

    @keyframes floatParticle {
      from { transform: translateY(0px); }
      to { transform: translateY(-140px); }
    }

    @keyframes sparkleFade {
      0% { opacity: 1; transform: scale(0.8); }
      100% { opacity: 0; transform: scale(1.4); }
    }

    @keyframes rippleGrow {
      to { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }
  `;

  document.head.appendChild(styleSheet);
  return styleSheet;
}

function createParticle(particleContainer, colors) {
  const particle = document.createElement('div');
  particle.classList.add('particle');
  const size = Math.random() * 7 + 3;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.top = `${Math.random() * 100}%`;
  particle.style.animationDuration = `${Math.random() * 8 + 5}s`;
  particle.style.animationDelay = `${Math.random() * 5}s`;
  const colorChoice = colors[Math.floor(Math.random() * colors.length)];
  particle.style.backgroundColor = colorChoice;
  particle.style.boxShadow = `0 0 ${size * 1.8}px ${colorChoice}`;
  particle.style.opacity = `${Math.random() * 0.7 + 0.2}`;
  particleContainer.appendChild(particle);
  return particle;
}

function createSparkle() {
  const spark = document.createElement('div');
  spark.classList.add('sparkle');
  spark.style.left = `${Math.random() * window.innerWidth}px`;
  spark.style.top = `${Math.random() * window.innerHeight}px`;
  document.body.appendChild(spark);
  setTimeout(() => {
    spark.remove();
  }, 1800);
}

function createRipple(event) {
  const ripple = document.createElement('div');
  ripple.classList.add('ripple-effect');
  ripple.style.left = `${event.clientX}px`;
  ripple.style.top = `${event.clientY}px`;
  document.body.appendChild(ripple);
  setTimeout(() => {
    ripple.remove();
  }, 600);
}


export default function GlobalUIEffects({
  particleCount = DEFAULT_PARTICLE_COUNT,
  particleColors = DEFAULT_PARTICLE_COLORS,
  effectRootId = 'global-ui-effect-root',
  particleContainerId = 'particleContainer',
  buttonSelector = '#magicBtn',
  heroSelector = '.hero',
  ringSelector = '.glow-ring',
  borderSelector = '.flame-border',
  subSelector = '.sub',
  titleSelector = '.title',
  enableSparkle = true,
  enableBigFlame = true,
  enableRipple = true,
}) {
  useEffect(() => {
    const colors = particleColors.length ? particleColors : DEFAULT_PARTICLE_COLORS;
    const root = document.createElement('div');
    root.id = effectRootId;
    document.body.appendChild(root);

    const particleContainer = document.createElement('div');
    particleContainer.id = particleContainerId;
    root.appendChild(particleContainer);

    const styleSheet = createStyleSheet(effectRootId);

    const particles = [];
    for (let i = 0; i < particleCount; i += 1) {
      particles.push(createParticle(particleContainer, colors));
    }

    const particleInterval = window.setInterval(() => {
      if (particleContainer.children.length < particleCount + 15) {
        const newParticle = createParticle(particleContainer, colors);
        setTimeout(() => {
          newParticle.remove();
        }, 12000);
      }
      if (particleContainer.children.length > particleCount + 20) {
        for (let i = 0; i < 5; i += 1) {
          if (particleContainer.children[i]) {
            particleContainer.children[i].remove();
          }
        }
      }
    }, 2800);

    const sparkleInterval = enableSparkle ? window.setInterval(createSparkle, 400) : null;

    const clickHandler = (event) => {
      if (enableRipple) {
        createRipple(event);
      }
      const igniteBtn = document.querySelector(buttonSelector);
      if (igniteBtn && event.target.closest(buttonSelector)) {
        igniteBtn.style.transform = 'scale(0.97)';
        setTimeout(() => {
          igniteBtn.style.transform = '';
        }, 150);
      }
    };

  const fireHandler = (event) => {
  event.stopPropagation();

  const button = document.querySelector(buttonSelector);

  // Shockwave Glow Effect
  const glow = document.createElement('div');

  glow.style.position = 'fixed';
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;

  glow.style.width = '10px';
  glow.style.height = '10px';

  glow.style.borderRadius = '50%';

  glow.style.background =
    'radial-gradient(circle, rgba(0,180,255,0.95) 0%, rgba(0,180,255,0.45) 35%, rgba(0,180,255,0.15) 60%, transparent 80%)';

  glow.style.boxShadow = `
    0 0 20px #00d9ff,
    0 0 50px #00d9ff,
    0 0 100px #00d9ff,
    0 0 180px #00d9ff
  `;

  glow.style.transform =
    'translate(-50%, -50%) scale(0)';

  glow.style.opacity = '1';
  glow.style.pointerEvents = 'none';
  glow.style.zIndex = '9999';

  glow.style.transition =
    'transform 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 1s ease-out';

  document.body.appendChild(glow);

  requestAnimationFrame(() => {
    glow.style.transform =
      'translate(-50%, -50%) scale(18)';
    glow.style.opacity = '0';
  });

  setTimeout(() => {
    glow.remove();
  }, 1100);

  // Button Effect
  if (button) {
    const originalText = button.innerText;

    button.innerText = '⚡ BLAZING ⚡';
    button.style.letterSpacing = '4px';
    button.style.boxShadow = '0 0 35px #00d9ff';

    setTimeout(() => {
      button.innerText = originalText;
      button.style.letterSpacing = '';
      button.style.boxShadow = '';
    }, 1000);
  }

  // Title Effect
  const titleEl = document.querySelector(titleSelector);

  if (titleEl) {
    titleEl.style.animation = 'none';

    // Force Reflow
    void titleEl.offsetWidth;

    titleEl.style.animation =
      'gradientShift 5s ease infinite, textGlitch 2.2s infinite';

    titleEl.style.transform = 'scale(1.02)';

    setTimeout(() => {
      titleEl.style.transform = '';
    }, 200);
  }
};

    const mouseMoveHandler = (event) => {
      const heroBox = document.querySelector(heroSelector);
      const ring = document.querySelector(ringSelector);
      if (!heroBox) return;
      const rect = heroBox.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = (event.clientX - centerX) * 0.03;
      const distY = (event.clientY - centerY) * 0.03;

      if (ring) {
        ring.style.transform = `translate(calc(-50% + ${distX}px), calc(-50% + ${distY}px)) scale(${1 + Math.abs(distX) * 0.01})`;
      }

      const borderDiv = document.querySelector(borderSelector);
      if (borderDiv) {
        const intensity = Math.min(0.8, Math.abs(distX) * 0.03 + 0.3);
        borderDiv.style.borderColor = `rgba(255, ${40 + intensity * 50}, 80, ${0.5 + intensity * 0.4})`;
      }
    };

    const subGlowInterval = window.setInterval(() => {
      const subEl = document.querySelector(subSelector);
      if (!subEl) return;
      const glowIntensity = Math.sin(Date.now() / 800) * 0.2 + 0.6;
      subEl.style.boxShadow = `0 0 ${12 + glowIntensity * 12}px rgba(255, 40, 80, ${0.4 + glowIntensity * 0.3})`;
    }, 150);

    const bigFlameInterval = enableBigFlame
      ? window.setInterval(() => {
          const bigFlare = document.createElement('div');
          bigFlare.style.position = 'fixed';
          bigFlare.style.width = '120px';
          bigFlare.style.height = '120px';
          bigFlare.style.left = `${Math.random() * 80 + 10}%`;
          bigFlare.style.top = `${Math.random() * 80 + 10}%`;
          bigFlare.style.background = 'radial-gradient(circle, rgba(255, 50, 80, 0.25), rgba(100, 0, 0, 0))';
          bigFlare.style.borderRadius = '50%';
          bigFlare.style.filter = 'blur(35px)';
          bigFlare.style.pointerEvents = 'none';
          bigFlare.style.zIndex = '2';
          document.body.appendChild(bigFlare);
          setTimeout(() => {
            bigFlare.remove();
          }, 2400);
        }, 4200)
      : null;

    window.addEventListener('click', clickHandler);
    document.body.addEventListener('click', fireHandler);
    document.body.addEventListener('mousemove', mouseMoveHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
      document.body.removeEventListener('click', fireHandler);
      document.body.removeEventListener('mousemove', mouseMoveHandler);
      window.clearInterval(particleInterval);
      if (sparkleInterval) window.clearInterval(sparkleInterval);
      window.clearInterval(subGlowInterval);
      if (bigFlameInterval) window.clearInterval(bigFlameInterval);
      if (styleSheet && styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
    };
  }, [
    particleCount,
    particleColors,
    effectRootId,
    particleContainerId,
    buttonSelector,
    heroSelector,
    ringSelector,
    borderSelector,
    subSelector,
    titleSelector,
    enableSparkle,
    enableBigFlame,
    enableRipple,
  ]);

  return null;
}

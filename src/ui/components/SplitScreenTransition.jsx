import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

// ==========================================
// CONFIG CỦA BẠN - THAY ĐỔI TẠI ĐÂY LÀ ĂN NGAY
// ==========================================
const METEOR_COUNT = 500; // 🌟 Số lượng sao băng bạn muốn (thích bao nhiêu nhập bấy nhiêu)
const METEOR_COLORS = ['#17ecdb', '#4714d1', '#de0de6', '#d6e2e2', '#2ae619']; // 🎨 Bộ màu của sao

const TRANSITION_DURATION = 1000; // Tổng thời gian chạy hiệu ứng (ms)

const SplitScreenTransition = ({ location, outlet }) => {
  const [displayOutlet, setDisplayOutlet] = useState(outlet);
  const [displayPathname, setDisplayPathname] = useState(location.pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStatus, setTransitionStatus] = useState('');

  useEffect(() => {
    if (location.pathname !== displayPathname) {
      setIsTransitioning(true);
      setTransitionStatus('active');

      const timer1 = setTimeout(() => {
        setDisplayOutlet(outlet);
        setDisplayPathname(location.pathname);

        const timer2 = setTimeout(() => {
          setTransitionStatus('closing');

          const timer3 = setTimeout(() => {
            setIsTransitioning(false);
            setTransitionStatus('');
          }, TRANSITION_DURATION / 2);

          return () => clearTimeout(timer3);
        }, 50);

        return () => clearTimeout(timer2);
      }, TRANSITION_DURATION / 2);

      return () => clearTimeout(timer1);
    } else {
      setDisplayOutlet(outlet);
    }
  }, [location.pathname, outlet, displayPathname]);

  // 🚀 TỰ ĐỘNG TẠO CONFIG NGẪU NHIÊN CHO MỖI NGÔI SAO
  // Dùng useMemo để danh sách tọa độ này không bị tính toán lại khi component re-render làm lệch hướng bay
  const meteors = useMemo(() => {
    return Array.from({ length: METEOR_COUNT }).map((_, index) => {
      const randomColor = METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)];
      return {
        id: index,
        style: {
          top: `${Math.random() * 100}%`,        // Rải ngẫu nhiên từ trên xuống dưới
          left: `${Math.random() * 110 - 20}%`,   // Rải ngẫu nhiên từ rìa trái qua phải (-20% đến 90%)
          width: `${Math.random() * 170 + 150}px`,// Độ dài đuôi sao ngẫu nhiên từ 150px đến 320px
          color: randomColor,
          background: `linear-gradient(90deg, ${randomColor}, transparent)`,
          animationDelay: `${Math.random() * 900}ms`, // Độ trễ rơi so le từ 0 đến 250ms
        }
      };
    });
  // Chỉ tạo lại mảng sao khi quá trình chuyển trang bắt đầu (khi isTransitioning bật từ false -> true)
  }, [isTransitioning]);

  // Inject CSS chung cho cấu trúc khung nền vũ trụ và chuyển động của sao
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'meteor-dynamic-styles';
    style.textContent = `
      .meteor-transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        pointer-events: none;
        overflow: hidden;
        background: #0a041a; /* Màu nền không gian tối của bạn */
        opacity: 0;
        transition: opacity 300ms ease;
      }
      
      .meteor-transition-overlay.active,
      .meteor-transition-overlay.closing {
        opacity: 1;
      }

      .star-container {
        position: absolute;
        width: 100%;
        height: 100%;
        transform: rotate(-45deg); /* Góc nghiêng đổ chéo từ trên trái xuống */
        top: -50%;
      }

      .dynamic-meteor {
        position: absolute;
        height: 2px;
        border-radius: 999px;
        filter: drop-shadow(0 0 8px currentColor);
        animation: meteorFall ${TRANSITION_DURATION}ms cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards;
        opacity: 0;
      }

      @keyframes meteorFall {
        0% {
          transform: translateX(0) scaleX(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        40% {
          transform: translateX(800px) scaleX(1.5);
        }
        100% {
          transform: translateX(2000px) scaleX(0);
          opacity: 0;
        }
      }

      .page-transition-content {
        opacity: 1;
        transition: opacity 400ms ease;
      }
      .page-transition-content.transitioning {
        opacity: 0.3;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const elem = document.getElementById('meteor-dynamic-styles');
      if (elem) elem.remove();
    };
  }, []);

  const overlay = isTransitioning ? createPortal(
    <div className={`meteor-transition-overlay ${transitionStatus}`}>
      <div className="star-container">
        {/* Vòng lặp map tự động render số lượng sao dựa trên cấu hình */}
        {meteors.map((meteor) => (
          <div 
            key={meteor.id} 
            className="dynamic-meteor" 
            style={meteor.style}
          />
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div className={`page-transition-content ${isTransitioning ? 'transitioning' : ''}`}>
        {displayOutlet}
      </div>
      {overlay}
    </>
  );
};

export default SplitScreenTransition;
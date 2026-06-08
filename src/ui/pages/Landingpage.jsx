import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <div className="landing-content">
        <div className="landing-icon">XIN CHÀO ĐẾN VỚI</div>
        <h1 className="landing-title">DSA Visualizer</h1>
        <p className="landing-sub">Một thứ giúp có thể giúp bạn không tạch DSA</p>
        <button className="landing-btn" onClick={() => navigate('/sorting')}>
          Bắt đầu nào !
        </button>
      </div>
    </div>
  );
}
import { useOutlet, useLocation } from 'react-router-dom';
import SplitScreenTransition from './SplitScreenTransition.jsx';

export default function TransitionOutlet() {
  const location     = useLocation();
  const currentOutlet = useOutlet();
  return <SplitScreenTransition location={location} outlet={currentOutlet} />;
}
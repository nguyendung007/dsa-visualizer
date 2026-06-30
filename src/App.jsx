import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import LoggerLayout, { LoggerProvider } from './ui/logger/Logger.jsx';
import MainLayout from './ui/layouts/MainLayout.jsx';

import { useAuth } from './context/AuthContext.jsx';
import { useProgress } from './context/ProgressContext.jsx';

import LoadingSpinner from './ui/components/LoadingSpinner.jsx';
import GlobalUIEffects from './ui/components/GlobalUIEffects.jsx';
import TransitionOutlet from './ui/components/TransitionOutlet.jsx';
import Toast from './ui/components/Toast.jsx';

import AIPage from './ui/pages/system/AIPage.jsx';
import LoginPage from './ui/pages/system/LoginPage.jsx';
import ComplexityPage from './ui/pages/system/ComplexityPage.jsx';
import SettingsPage from './ui/pages/system/SettingsPage.jsx';

import SortingPage from './ui/pages/algo/SortingPage.jsx';
import TreePage from './ui/pages/algo/TreePage.jsx';
import TraversalPage from './ui/pages/algo/TraversalPage.jsx';
import GraphPage from './ui/pages/algo/GraphPage.jsx';
import StructuresPage from './ui/pages/algo/StructuresPage.jsx';
import LinkedListPage from './ui/pages/algo/LinkedListPage.jsx';
import UnionFindPage from './ui/pages/algo/UnionFindPage.jsx';
import StringPage from './ui/pages/algo/StringPage.jsx';
import ProblemsPage from './ui/pages/algo/ProblemsPage.jsx';
import KnowledgePage from './ui/pages/algo/KnowledgePage.jsx';
import LocalSearchPage from './ui/pages/algo/LocalSearchPage.jsx';
import DecisionPage from './ui/pages/algo/DecisionPage.jsx';
import AdversarialPage from './ui/pages/algo/AdversarialPage.jsx';
import MazePage from './ui/pages/algo/MazePage.jsx';
import NaivePage from './ui/pages/algo/NaivePage.jsx';
import CspPage from './ui/pages/algo/CspPage.jsx';
import DPPage from './ui/pages/algo/DPPage.jsx';


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Đang tải..." />;
  return user ? children : <Navigate to="/login" replace />;
}

function LayoutWrapper() {
  const { user, logout } = useAuth();
  const { toast } = useProgress();
  
  return <MainLayout user={user} logout={logout} toast={toast} />;
}


export default function App() {
  const { loading } = useAuth();
  const { toast } = useProgress();
  const isDev = 'development'; 

  const [isEffectOn, setIsEffectOn] = useState(
  () => localStorage.getItem('effectOn') !== 'false'
);

useEffect(() => {
  const onChange = () => setIsEffectOn(localStorage.getItem('effectOn') !== 'false');
  window.addEventListener('effectOnChanged', onChange);
  return () => window.removeEventListener('effectOnChanged', onChange);
}, []);

  if (loading) {
    return <LoadingSpinner message="Đang kiểm tra xác thực..." />;
  }

  return (
    <>
      {isEffectOn && <GlobalUIEffects />}
      {toast.message && (
        <Toast message={toast.message} type={toast.type} />
      )}
      <BrowserRouter>
      <LoggerProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <LayoutWrapper />
              </ProtectedRoute>
            }
          >
            <Route element={<TransitionOutlet />}>
            <Route element={<LoggerLayout />}>
              <Route path="/"           element={<SortingPage />} />
              <Route path="/sorting"    element={<SortingPage />} />
              <Route path="/trees"      element={<TreePage />} />
              <Route path="/traversal"  element={<TraversalPage />} />
              <Route path="/graph"      element={<GraphPage />} />
              <Route path="/maze"       element={<MazePage />} />
              <Route path="/adversarial" element={<AdversarialPage />} />
              <Route path="/knowledge"  element={<KnowledgePage />} />
              <Route path="/dp"         element={<DPPage />} />
              <Route path="/localsearch" element={<LocalSearchPage />} />
              <Route path="/decision"   element={<DecisionPage />} />
              <Route path="/naive"      element={<NaivePage />} />
              <Route path="/structures" element={<StructuresPage />} />
              <Route path="/linkedlist" element={<LinkedListPage />} />
              <Route path="/unionfind"  element={<UnionFindPage />} />
              <Route path="/strings"    element={<StringPage />} />
              <Route path="/problems"   element={<ProblemsPage />} />
              <Route path="/ai"   element={<AIPage />} />
              <Route path="/csp"        element={<CspPage />} />
              <Route path="/complexity" element={<ComplexityPage />} />
              <Route path="/settings"   element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
        </LoggerProvider>
      </BrowserRouter>
    </>
  );
}
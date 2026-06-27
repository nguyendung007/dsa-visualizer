import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import MainLayout from './ui/layouts/MainLayout.jsx';
import LoginPage from './ui/pages/system/LoginPage.jsx';
import LoadingSpinner from './ui/components/LoadingSpinner.jsx';
import GlobalUIEffects from './ui/components/GlobalUIEffects.jsx';
import SplitScreenTransition from './ui/components/SplitScreenTransition.jsx';

import SortingPage from './ui/pages/algo/SortingPage.jsx';
import TreePage from './ui/pages/algo/TreePage.jsx';
import TraversalPage from './ui/pages/algo/TraversalPage.jsx';
import GraphPage from './ui/pages/algo/GraphPage.jsx';
import StructuresPage from './ui/pages/algo/StructuresPage.jsx';
import LinkedListPage from './ui/pages/algo/LinkedListPage.jsx';
import UnionFindPage from './ui/pages/algo/UnionFindPage.jsx';
import StringPage from './ui/pages/algo/StringPage.jsx';
import ProblemsPage from './ui/pages/algo/ProblemsPage.jsx';
import ComplexityPage from './ui/pages/system/ComplexityPage.jsx';
import SettingsPage from './ui/pages/system/SettingsPage.jsx';


import KnowledgePage from './ui/pages/algo/KnowledgePage.jsx';
import LocalSearchPage from './ui/pages/algo/LocalSearchPage.jsx';
import DecisionPage from './ui/pages/algo/DecisionPage.jsx';
import AdversarialPage from './ui/pages/algo/AdversarialPage.jsx';
import MazePage from './ui/pages/algo/MazePage.jsx';
import NaivePage from './ui/pages/algo/NaivePage.jsx';
import CspPage from './ui/pages/algo/CspPage.jsx';

import Toast from './ui/components/Toast.jsx';  // ← THÊM IMPORT
import { useProgress } from './context/ProgressContext.jsx'; 

// Protected Route - chỉ cho phép user đã đăng nhập
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Đang tải..." />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { loading } = useAuth();
  const { toast } = useProgress();  // ← LẤY toast state
  

  if (loading) {
    return <LoadingSpinner message="Đang kiểm tra xác thực..." />;
  }

  return (
    <>
      <GlobalUIEffects />

      {toast.message && (
              <Toast message={toast.message} type={toast.type} />
            )}
      <BrowserRouter>
          <Routes>
            {/* Trang đăng nhập - public */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Trang chính - protected */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<SortingPage />} />
              <Route path="/sorting"    element={<SortingPage />} />
              <Route path="/trees"      element={<TreePage />} />
              <Route path="/traversal"  element={<TraversalPage />} />
              <Route path="/graph"      element={<GraphPage />} />
              <Route path="/maze"      element={<MazePage />} />
              <Route path="/adversarial" element={<AdversarialPage />} /> 
              <Route path="/knowledge"  element={<KnowledgePage />} /> 
              <Route path="/localsearch"  element={<LocalSearchPage />} />
              <Route path="/decision"   element={<DecisionPage />} />
              <Route path="/naive"     element={<NaivePage />} />
              <Route path="/structures" element={<StructuresPage />} />
              <Route path="/linkedlist" element={<LinkedListPage />} />
              <Route path="/unionfind"  element={<UnionFindPage />} />
              <Route path="/strings"    element={<StringPage />} />
              <Route path="/problems"   element={<ProblemsPage />} />
              <Route path="/csp"   element={<CspPage />} />
              <Route path="/complexity" element={<ComplexityPage />} />
              <Route path="/settings"   element={<SettingsPage />} />
            </Route>
          </Routes>
      </BrowserRouter>
    </>
  );
}
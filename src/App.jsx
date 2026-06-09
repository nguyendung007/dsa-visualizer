import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './ui/layouts/MainLayout.jsx';
import LandingPage from './ui/pages/LandingPage.jsx';

import SortingPage from './ui/pages/SortingPage.jsx';
import TreePage from './ui/pages/TreePage.jsx';
import TraversalPage from './ui/pages/TraversalPage.jsx';
import GraphPage from './ui/pages/GraphPage.jsx';
import StructuresPage from './ui/pages/StructuresPage.jsx';
import LinkedListPage from './ui/pages/LinkedListPage.jsx';
import UnionFindPage from './ui/pages/UnionFindPage.jsx';
import StringPage from './ui/pages/StringPage.jsx';
import ProblemsPage from './ui/pages/ProblemsPage.jsx';
import ComplexityPage from './ui/pages/ComplexityPage.jsx';

import SettingsPage from './ui/pages/SettingsPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang giới thiệu — nằm ngoài MainLayout, không có sidebar */}
        <Route path="/" element={<LandingPage />} />

        {/* Các trang chính — nằm trong MainLayout, có sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/sorting"    element={<SortingPage />} />
          <Route path="/trees"      element={<TreePage />} />
          <Route path="/traversal"  element={<TraversalPage />} />
          <Route path="/graph"      element={<GraphPage />} />
          <Route path="/structures" element={<StructuresPage />} />
          <Route path="/linkedlist" element={<LinkedListPage />} />
          <Route path="/unionfind"  element={<UnionFindPage />} />
          <Route path="/strings"    element={<StringPage />} />
          <Route path="/problems"   element={<ProblemsPage />} />
          <Route path="/complexity" element={<ComplexityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
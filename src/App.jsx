import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './ui/layouts/MainLayout.jsx';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/sorting" replace />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

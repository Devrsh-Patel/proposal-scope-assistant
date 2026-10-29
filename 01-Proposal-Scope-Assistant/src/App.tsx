import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import ProposalsList from './pages/ProposalsList';
import NewProposal from './pages/NewProposal';
import ProposalDetail from './pages/ProposalDetail';
import Packages from './pages/Packages';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/proposals" element={<ProposalsList />} />
          <Route path="/proposals/new" element={<NewProposal />} />
          <Route path="/proposals/:id" element={<ProposalDetail />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/settings" element={<Settings />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

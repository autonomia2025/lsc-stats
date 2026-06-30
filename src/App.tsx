import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameCenter from './app/pages/GameCenter';
import SetupWizard from './app/pages/admin/SetupWizard';
import AdminDashboard from './app/pages/admin/AdminDashboard';
import PrepareMatchWizard from './app/pages/admin/PrepareMatchWizard';
import ControlCenter from './app/pages/admin/ControlCenter';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameCenter />} />
        
        {/* Admin Routes */}
        <Route path="/admin/setup" element={<SetupWizard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/prepare-match/:id" element={<PrepareMatchWizard />} />
        <Route path="/admin/mesa/:id" element={<ControlCenter />} />
      </Routes>
    </BrowserRouter>
  );
}

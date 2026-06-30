import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameCenter from './app/pages/GameCenter';
import SetupWizard from './app/pages/admin/SetupWizard';
import AdminDashboard from './app/pages/admin/AdminDashboard';
import PrepareMatchWizard from './app/pages/admin/PrepareMatchWizard';
import MesaDashboard from './app/pages/mesa/MesaDashboard';
import ControlCenter from './app/pages/mesa/ControlCenter';
import Acta from './app/pages/mesa/Acta';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameCenter />} />
        
        {/* Admin Routes */}
        <Route path="/admin/setup" element={<SetupWizard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/prepare-match/:id" element={<PrepareMatchWizard />} />
        
        {/* Mesa Routes */}
        <Route path="/mesa" element={<MesaDashboard />} />
        <Route path="/mesa/:id" element={<ControlCenter />} />
        <Route path="/mesa/:id/acta" element={<Acta />} />
      </Routes>
    </BrowserRouter>
  );
}

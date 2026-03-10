import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Leads from './pages/Leads';
import Leaves from './pages/Leaves';
import Activities from './pages/Activities';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { useState } from 'react';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        {mobileOpen && (
          <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
        )}
        <div className="main-content">
          <Header onMenuClick={() => setMobileOpen(true)} />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

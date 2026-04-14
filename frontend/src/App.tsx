import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionExpiredModal } from './components/SessionExpiredModal';
import { LoginPage } from './pages/LoginPage';
import { InventoryDashboard } from './pages/InventoryDashboard';

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <LanguageProvider>
      <AuthProvider>
        <SessionExpiredModal />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <InventoryDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;

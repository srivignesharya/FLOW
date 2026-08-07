import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';

import { Auth } from './pages/Auth';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { IngestStudio } from './pages/IngestStudio';
import { TaskManager } from './pages/TaskManager';
import { StudyPlanner } from './pages/StudyPlanner';
import { Analytics } from './pages/Analytics';
import { Copilot } from './pages/Copilot';
import { Settings } from './pages/Settings';

import { ToastProvider } from './components/ToastContainer';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Verifying authentication session..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Layout>{children}</Layout>;
};

export const App: React.FC = () => {
  return (
    <>
      <ToastProvider />
      <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ingest"
        element={
          <ProtectedRoute>
            <IngestStudio />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TaskManager />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner"
        element={
          <ProtectedRoute>
            <StudyPlanner />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/copilot"
        element={
          <ProtectedRoute>
            <Copilot />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};

export default App;

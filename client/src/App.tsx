import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';

// Core entry routes (eager for instant initial paint)
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';

// Route-level code-splitting for high-performance bundle loading
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const IngestStudio = lazy(() => import('./pages/IngestStudio').then(m => ({ default: m.IngestStudio })));
const TaskManager = lazy(() => import('./pages/TaskManager').then(m => ({ default: m.TaskManager })));
const StudyPlanner = lazy(() => import('./pages/StudyPlanner').then(m => ({ default: m.StudyPlanner })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Copilot = lazy(() => import('./pages/Copilot').then(m => ({ default: m.Copilot })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })));

import { ToastProvider } from './components/ToastContainer';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Verifying authentication session..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner fullPage text="Loading workspace..." />}>
      <Layout>{children}</Layout>
    </Suspense>
  );
};

// Root Route: Public Landing page for search engine crawlers and unauthenticated visitors;
// Authenticated academic workspace for logged-in users.
const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Initializing ZENITH workspace..." />;
  }

  if (user) {
    return (
      <Suspense fallback={<LoadingSpinner fullPage text="Loading ZENITH dashboard..." />}>
        <Layout>
          <Dashboard />
        </Layout>
      </Suspense>
    );
  }

  return <Landing />;
};

export const App: React.FC = () => {
  return (
    <>
      <ToastProvider />
      <Suspense fallback={<LoadingSpinner fullPage text="Loading..." />}>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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
    </Suspense>
    </>
  );
};

export default App;

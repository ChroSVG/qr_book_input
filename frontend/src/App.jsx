import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./providers/ToastProvider";
import { ErrorBoundary } from "./ui";
import { Layout } from "./layouts/Layout";
import { Spinner } from "./ui";
import { isAuthenticated } from "./lib/api";
import { setupAuthDebug } from "./lib/authDebug";

const ScanPage = lazy(() => import("./pages/ScanPage"));
const TablePage = lazy(() => import("./pages/TablePage"));
const DownloadsPage = lazy(() => import("./pages/DownloadsPage"));
const DownloadsHistoryPage = lazy(() => import("./pages/DownloadsHistoryPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));

// Setup auth debug helper
if (typeof window !== "undefined") {
  setupAuthDebug();
}

// Protected route component
function ProtectedRoute({ children }) {
  const authenticated = isAuthenticated();
  
  // Debug logging
  console.log('[Route] ProtectedRoute check:', {
    authenticated,
    hasToken: !!localStorage.getItem("auth_token"),
    pathname: window.location.pathname,
  });
  
  if (!authenticated) {
    console.warn('[Route] Not authenticated, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <Routes>
            {/* Auth routes - no layout */}
            <Route path="/auth" element={
              <Suspense fallback={<PageLoader />}>
                <AuthPage />
              </Suspense>
            } />
            
            {/* Protected routes with layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <ScanPage />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/scan" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <ScanPage />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/table" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <TablePage />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/downloads" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <DownloadsPage />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/downloads/history" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <DownloadsHistoryPage />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}

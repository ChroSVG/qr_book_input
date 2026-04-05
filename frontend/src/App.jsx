import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./providers/ToastProvider";
import { ErrorBoundary } from "./ui";
import { Layout } from "./layouts/Layout";
import { Spinner } from "./ui";

const ScanPage = lazy(() => import("./pages/ScanPage"));
const TablePage = lazy(() => import("./pages/TablePage"));

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<ScanPage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/table" element={<TablePage />} />
              </Routes>
            </Suspense>
          </Layout>
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

// file: frontend/src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

// Lazy load pages untuk code splitting
const ScanPage = lazy(() => import('./pages/ScanPage'));
const TablePage = lazy(() => import('./pages/TablePage'));

// Komponen loading sementara saat halaman diload
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow p-4 flex gap-4">
          <Link to="/scan" className="text-blue-600">Scan & Input</Link>
          <Link to="/table" className="text-blue-600">Table</Link>
        </nav>
        <main className="p-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ScanPage/>} />
              <Route path="/scan" element={<ScanPage/>} />
              <Route path="/table" element={<TablePage/>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

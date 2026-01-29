// file: frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ScanPage from "./pages/ScanPage";
import TablePage from "./pages/TablePage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow p-4 flex gap-4">
          <Link to="/scan" className="text-blue-600">Scan & Input</Link>
          <Link to="/table" className="text-blue-600">Table</Link>
        </nav>
        <main className="p-6">
          <Routes>
            <Route path="/" element={<ScanPage/>} />
            <Route path="/scan" element={<ScanPage/>} />
            <Route path="/table" element={<TablePage/>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

$content = @'
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchData, updateData, deleteData, exportCsv, exportExcel } from "../hooks/useApi";
import { Toast } from "../components/Toast";
import DataTable from "../components/DataTable";
import QrScanner from "../components/QrScanner";

export default function TablePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get page and q from URL query params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const q = searchParams.get("q") || "";

  const handleResetSearch = () => {
    setSearchParams({});
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData({ page, limit: 10, q });
      setItems(result.data || []);
      setTotalPages(result.total_pages || 1);
      setTotal(result.total || 0);
    } catch (error) {
      setToast({ msg: "Gagal memuat data: " + error, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  // Load data saat page atau q berubah
  useEffect(() => {
    load();
  }, [page, q, load]);

  const handleQrScan = useCallback((decoded) => {
    setSearchParams({ page: 1, q: decoded });
    setIsModalOpen(false);
    setToast({ msg: `Filter: ${decoded}`, type: "success" });
  }, [setSearchParams]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const handleSearchChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
      params.set("page", "1");
    } else {
      params.delete("q");
      params.set("page", "1");
    }
    setSearchParams(params);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Inventaris</h2>
          <p className="text-gray-500 mt-1">Kelola dan pantau stok barang secara real-time.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCsv} className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">CSV</button>
          <button onClick={exportExcel} className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all">Export Excel</button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg shadow-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div><p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Total Item</p><p className="text-2xl font-bold">{total}</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg shadow-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div><p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Halaman</p><p className="text-2xl font-bold">{page} / {totalPages}</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg shadow-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            </div>
            <div><p className="text-purple-100 text-xs font-semibold uppercase tracking-wider">Pencarian</p><p className="text-2xl font-bold">{q ? 'Aktif' : '-'}</p></div>
          </div>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="relative w-full md:flex-1 max-w-2xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input value={q} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Cari nama barang atau kode..." className="w-full border-gray-200 border p-4 pl-12 pr-14 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none shadow-sm transition-all bg-white text-gray-700" />
          <button onClick={() => setIsModalOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          </button>
        </div>
        <button onClick={handleResetSearch} className="w-full md:w-auto px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-red-50 hover:text-red-600 transition-all active:scale-95">Reset</button>
      </div>

      {/* Table Section */}
      <div className={`relative transition-all duration-300 ${loading ? "opacity-50 blur-[2px]" : "opacity-100"}`}>
        {loading && (<div className="absolute inset-0 z-10 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div>)}
        <DataTable items={items} onUpdate={updateData} onDelete={async (id) => { await deleteData(id); load(); }} />
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500 font-medium">Halaman <span className="text-blue-600 font-bold">{page}</span> dari <span className="font-bold">{totalPages}</span></p>
        <div className="flex gap-2 w-full sm:w-auto">
          <button disabled={page === 1} onClick={() => handlePageChange(page - 1)} className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Sebelumnya</button>
          <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black disabled:opacity-30 transition-all shadow-lg shadow-gray-200">Berikutnya</button>
        </div>
      </div>

      {/* Modal & Toast */}
      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} /><div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative z-10"><div className="p-6 flex justify-between items-center border-b"><span className="font-bold text-lg">Scan Filter</span><button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-400">✕</button></div><div className="aspect-square"><QrScanner onScan={handleQrScan} /></div></div></div>)}
      <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
'@

Set-Content -Path "C:\Users\HP\Desktop\input-qr-gpt-20260129T092154Z-3-001\input-qr-gpt\frontend\src\pages\TablePage.jsx" -Value $content -Encoding UTF8
Write-Host "File updated successfully!"

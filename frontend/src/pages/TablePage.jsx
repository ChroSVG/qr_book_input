import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useItems, useUpdateItem, useDeleteItem } from "../hooks/useItems";
import { downloadExport } from "../lib/api";
import { useToast } from "../providers/ToastProvider";
import DataTable from "../components/DataTable";
import QrScanner from "../components/QrScanner";
import { Button, Input, Spinner, Badge, Modal } from "../ui";

export default function TablePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const q = searchParams.get("q") || "";

  const { items, total, totalPages, loading, error, refetch } = useItems({ page, limit: 10, q });
  const { update, loading: updating } = useUpdateItem();
  const { remove } = useDeleteItem();

  const [qrFilterOpen, setQrFilterOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Initialize Yamli on search input
  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof Yamli !== "undefined" && Yamli.init) {
        Yamli.init();
        Yamli.yamlify("yamli-table-search", { startMode: "offOrUserDefault" });
      }
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // Sync input value with URL search param
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.value = q;
    }
  }, [q]);

  // ── Handlers ────────────────────────────────────────────────────────

  const handleSearchSubmit = useCallback((e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    const value = searchInputRef.current?.value.trim() || "";
    if (value) params.set("q", value);
    params.set("page", "1");
    setSearchParams(params);
  }, [setSearchParams]);

  const handlePageChange = useCallback((newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleExport = useCallback(async (format) => {
    try {
      await downloadExport(format);
      toast("Export downloaded", { type: "success", duration: 1500 });
    } catch {
      toast("Export failed", { type: "error" });
    }
  }, [toast]);

  const handleUpdate = useCallback(async (id, field, value) => {
    try {
      await update(id, { [field]: value });
      toast("Updated", { type: "success", duration: 1500 });
    } catch {
      toast("Update failed", { type: "error" });
      refetch();
    }
  }, [update, toast, refetch]);

  const handleDelete = useCallback(async (id) => {
    try {
      await remove(id);
      toast("Item deleted", { type: "success", duration: 1500 });
      refetch();
    } catch {
      toast("Delete failed", { type: "error" });
    }
  }, [remove, toast, refetch]);

  const handleQrScan = useCallback((decoded) => {
    setSearchParams({ page: "1", q: decoded });
    setQrFilterOpen(false);
    toast(`Filtered: ${decoded}`, { type: "success" });
  }, [setSearchParams, toast]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your items in real-time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} loading={false}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleExport("excel")} loading={false}>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Items" value={total} color="blue" />
        <StatCard label="Page" value={`${page} / ${totalPages || 1}`} color="emerald" />
        <StatCard label="Search" value={q ? "Active" : "—"} color="purple" className="col-span-2 sm:col-span-1" />
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            ref={searchInputRef}
            id="yamli-table-search"
            defaultValue={q}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearchSubmit(e); } }}
            placeholder="Search by name or QR code..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setQrFilterOpen(true)} title="Scan to filter">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
          </svg>
        </Button>
        {q && (
          <Button variant="ghost" onClick={() => { if (searchInputRef.current) searchInputRef.current.value = ""; setSearchParams({ page: "1" }); }}>
            Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl">
            <Spinner size="lg" />
          </div>
        )}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium">Failed to load data</p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
            <Button variant="danger" size="sm" className="mt-3" onClick={refetch}>Retry</Button>
          </div>
        ) : (
          <DataTable items={items} onUpdate={handleUpdate} onDelete={handleDelete} loading={loading} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-white px-4 py-3 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">
            Page <span className="font-semibold text-blue-600">{page}</span> of <span className="font-semibold">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
              Previous
            </Button>
            <Button variant="primary" size="sm" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* QR Filter Modal */}
      <Modal open={qrFilterOpen} onClose={() => setQrFilterOpen(false)} title="Scan to Filter">
        <div className="aspect-square rounded-xl overflow-hidden">
          <QrScanner onScan={handleQrScan} />
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ label, value, color, className = "" }) {
  const colors = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200",
    purple: "from-purple-500 to-purple-600 shadow-purple-200",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white p-4 rounded-xl shadow-md ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

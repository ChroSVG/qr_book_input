import { useState, useCallback, useEffect } from "react";
import { getDownloadHistory, deleteDownloadLog } from "../lib/api";
import { useToast } from "../providers/ToastProvider";
import { Card, Button, Spinner, Badge } from "../ui";

export default function DownloadsHistoryPage() {
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDownloadHistory({ page, limit });
      setHistory(data.downloads);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch download history");
      toast("Failed to load download history", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (downloadId) => {
    try {
      await deleteDownloadLog(downloadId);
      toast("Download log deleted", { type: "success" });
      fetchHistory();
    } catch {
      toast("Failed to delete download log", { type: "error" });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Download History</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all your tracked downloads
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Total Downloads" value={total} color="blue" />
        <StatCard label="Showing" value={`${history.length}`} color="emerald" />
      </div>

      {/* Error */}
      {error && (
        <Card className="p-6 mb-6 bg-red-50 border border-red-200 text-center">
          <p className="text-red-600 font-medium">Failed to load download history</p>
          <p className="text-sm text-red-400 mt-1">{error}</p>
          <Button variant="danger" size="sm" className="mt-3" onClick={fetchHistory}>
            Retry
          </Button>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="text-sm text-gray-400 mt-3">Loading download history…</p>
        </div>
      )}

      {/* Download History List */}
      {!loading && !error && (
        <>
          {history.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                  📂
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No downloads yet
                </h3>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Your download history will appear here once you download files.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((download) => (
                <Card
                  key={download.id}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-all"
                >
                  {/* Icon */}
                  <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg bg-blue-100 text-blue-600">
                    {getFileIcon(download.file_type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {download.filename || `${download.file_type.toUpperCase()} Export`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getFileTypeVariant(download.file_type)}>
                        {download.file_type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {formatDate(download.downloaded_at)}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(download.id)}
                    title="Delete from history"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 bg-white px-4 py-3 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-blue-600">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

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

function getFileIcon(fileType) {
  switch (fileType) {
    case "csv":
      return "📊";
    case "excel":
      return "📈";
    case "pdf":
      return "📄";
    default:
      return "📁";
  }
}

function getFileTypeVariant(fileType) {
  switch (fileType) {
    case "csv":
      return "blue";
    case "excel":
      return "emerald";
    case "pdf":
      return "red";
    default:
      return "gray";
  }
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

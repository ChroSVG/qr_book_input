import { useState, useCallback, useEffect, useRef } from "react";
import { fetchPdfList, downloadPdf } from "../lib/api";
import { useToast } from "../providers/ToastProvider";
import { Card, Button, Spinner, Badge } from "../ui";

const STORAGE_KEY = "downloaded_pdfs";

function getDownloadedFilenames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDownloadedFilenames(filenames) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...filenames]));
}

export default function DownloadsPage() {
  const toast = useToast();
  const [pdfData, setPdfData] = useState(null); // { output_dir, total, files }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null); // filename being downloaded
  const [downloadedNames, setDownloadedNames] = useState(getDownloadedFilenames);
  const abortRef = useRef(null);

  const fetchPdfs = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPdfList();
      setPdfData(data);
    } catch (err) {
      setError(err.message || "Failed to fetch PDF list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPdfs(); }, [fetchPdfs]);

  const handleDownload = useCallback(async (pdfFile) => {
    if (downloading) return;
    setDownloading(pdfFile.filename);

    try {
      await downloadPdf({ filename: pdfFile.filename });
      const next = new Set(downloadedNames);
      next.add(pdfFile.filename);
      setDownloadedNames(next);
      saveDownloadedFilenames(next);
      toast(`"${pdfFile.filename}" downloaded`, { type: "success", duration: 2000 });
    } catch {
      toast(`Failed to download "${pdfFile.filename}"`, { type: "error" });
    } finally {
      setDownloading(null);
    }
  }, [downloading, downloadedNames, toast]);

  const files = pdfData?.files || [];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDF Downloads</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and download sticker PDFs.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPdfs} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total PDFs" value={pdfData?.total ?? 0} color="blue" />
        <StatCard label="Downloaded" value={downloadedNames.size} color="emerald" />
        <StatCard
          label="Available"
          value={(pdfData?.total ?? 0) - downloadedNames.size}
          color="purple"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Error */}
      {error && (
        <Card className="p-6 mb-6 bg-red-50 border border-red-200 text-center">
          <p className="text-red-600 font-medium">Failed to load PDF list</p>
          <p className="text-sm text-red-400 mt-1">{error}</p>
          <Button variant="danger" size="sm" className="mt-3" onClick={fetchPdfs}>Retry</Button>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="text-sm text-gray-400 mt-3">Loading PDF list…</p>
        </div>
      )}

      {/* PDF List */}
      {!loading && !error && (
        <>
          {files.length === 0 ? (
            <EmptyPdfState />
          ) : (
            <div className="space-y-3">
              {files.map((pdf) => {
                const isDownloaded = downloadedNames.has(pdf.filename);
                const isDownloading = downloading === pdf.filename;

                return (
                  <Card
                    key={pdf.filename}
                    className={`p-4 flex items-center gap-4 transition-all ${
                      isDownloaded ? "bg-emerald-50/40 border-emerald-100" : "hover:bg-blue-50/20"
                    }`}
                  >
                    {/* PDF Icon */}
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                      isDownloaded ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                    }`}>
                      {isDownloaded ? "✓" : "📄"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{pdf.filename}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{pdf.size_mb}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{formatDate(pdf.modified)}</span>
                      </div>
                    </div>

                    {/* Status + Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isDownloaded && (
                        <Badge variant="emerald">Downloaded</Badge>
                      )}
                      <Button
                        variant={isDownloaded ? "outline" : "primary"}
                        size="sm"
                        loading={isDownloading}
                        onClick={() => handleDownload(pdf)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? "Downloading…" : isDownloaded ? "Download Again" : "Download"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
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

function EmptyPdfState() {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-3xl">
          📂
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No PDFs available</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          PDF files will appear here once they are generated.
        </p>
      </div>
    </Card>
  );
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

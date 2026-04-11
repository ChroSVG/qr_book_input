/**
 * API client for the QR Input backend.
 * Centralized HTTP layer — all API calls go through here.
 */
import axios from "axios";

// API base URL configuration
// For production: use empty string for relative paths (same origin)
// This ensures HTTPS when frontend is served over HTTPS
const API_BASE = import.meta.env.VITE_API_BASE || "";

// API Key configuration
const API_KEY = import.meta.env.VITE_API_KEY || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10_000,
  headers: {
    ...(API_KEY && { "X-API-Key": API_KEY }),
  },
});

// Request interceptor for debugging
api.interceptors.request.use((config) => {
  if (API_KEY) {
    config.headers["X-API-Key"] = API_KEY;
  }
  return config;
});

// ── Items ──────────────────────────────────────────────────────────────────

/**
 * @param {{ item_code: string; title: string; edition?: string; publisher_name?: string; publish_year?: number; call_number?: string; language_name?: string; place_name?: string; classification?: string; authors?: string; topics?: string; volume?: string; description?: string; extra_info?: string }} payload
 * @returns {Promise<Item>}
 */
export async function createItem(payload) {
  const { data } = await api.post("/data/", payload);
  return data;
}

/**
 * @param {string} itemCode
 * @returns {Promise<Item>}
 */
export async function getItemByQr(itemCode) {
  const { data } = await api.get(`/data/qr/${encodeURIComponent(itemCode)}`);
  return data;
}

/**
 * @param {number} id
 * @returns {Promise<Item>}
 */
export async function getItemById(id) {
  const { data } = await api.get(`/data/${id}`);
  return data;
}

/**
 * @param {{ page?: number; limit?: number; q?: string }} params
 * @returns {Promise<ItemListResponse>}
 */
export async function listItems({ page = 1, limit = 10, q = "" } = {}) {
  const { data } = await api.get("/data/", { params: { page, limit, q } });
  return data;
}

/**
 * @param {number} id
 * @param {Partial<ItemUpdate>} payload
 * @returns {Promise<Item>}
 */
export async function updateItem(id, payload) {
  const { data } = await api.put(`/data/${id}`, payload);
  return data;
}

/**
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteItem(id) {
  const { status } = await api.delete(`/data/${id}`);
  return status === 204;
}

// ── Export ─────────────────────────────────────────────────────────────────

export function getExportUrl(format) {
  return `/api/data/export/${format}`;
}

/**
 * Download an exported file (CSV or Excel).
 * Uses axios so the X-API-Key header is sent automatically.
 * @param {"csv" | "excel"} format
 */
export async function downloadExport(format) {
  const ext = format === "csv" ? "csv" : "xlsx";
  const mimeType =
    format === "csv"
      ? "text/csv;charset=utf-8"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const filename = `data_export.${ext}`;

  const { data, headers } = await api.get(`/data/export/${format}`, {
    responseType: "blob",
  });

  // Try to get filename from Content-Disposition header
  const disposition = headers["content-disposition"];
  const finalName = disposition
    ? disposition.split("filename=")[1]?.replace(/"/g, "") || filename
    : filename;

  // Create a temporary download link
  const url = window.URL.createObjectURL(new Blob([data], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", finalName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// ── Third-Party PDF Downloads ─────────────────────────────────────────────

const PDF_API_BASE = import.meta.env.VITE_PDF_API_BASE || "http://localhost:8003";

const pdfApi = axios.create({
  baseURL: PDF_API_BASE,
  timeout: 15_000,
});

/**
 * Fetch list of downloadable PDFs from third-party API.
 * Response: { output_dir: string, total: number, files: Array<{ filename: string, size_bytes: number, size_mb: string, modified: string }> }
 */
export async function fetchPdfList() {
  const { data } = await pdfApi.get("/api/pdf/list");
  return data;
}

/**
 * Download a specific PDF by filename.
 * @param {{ filename: string }} pdf
 */
export async function downloadPdf({ filename }) {
  const resp = await pdfApi.get(`/api/pdf/download/${encodeURIComponent(filename)}`, {
    responseType: "blob",
    timeout: 30_000,
  });
  const blob = new Blob([resp.data], { type: "application/pdf" });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

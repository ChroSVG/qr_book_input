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

// Request interceptor for debugging and JWT token
api.interceptors.request.use((config) => {
  if (API_KEY) {
    config.headers["X-API-Key"] = API_KEY;
  }
  
  // Add JWT token if available
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
    console.log(`[API] Request to ${config.url} - adding Bearer token`);
  } else {
    console.log(`[API] Request to ${config.url} - NO TOKEN`);
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] Error ${error.response.status} from ${error.config?.url}:`, error.response.data);
      
      if (error.response.status === 401) {
        // Token expired or invalid - clear auth data
        console.warn('[Auth] 401 Unauthorized - clearing auth token');
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      }
    } else if (error.request) {
      console.error(`[API] Network error for ${error.config?.url}:`, 'No response received');
    } else {
      console.error(`[API] Error:`, error.message);
    }
    return Promise.reject(error);
  }
);

// ── Authentication ─────────────────────────────────────────────────────────

/**
 * Register a new user
 * @param {{ username: string; email: string; password: string }} payload
 * @returns {Promise<{ id: number; username: string; email: string; is_active: boolean; created_at: string }>}
 */
export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

/**
 * Login and get JWT token
 * @param {{ username: string; password: string }} payload
 * @returns {Promise<{ access_token: string; token_type: string; user: object }>}
 */
export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  if (data.access_token) {
    localStorage.setItem("auth_token", data.access_token);
    localStorage.setItem("user_data", JSON.stringify(data.user));
    console.log('[Auth] Login successful, token saved:', data.access_token.substring(0, 20) + '...');
    console.log('[Auth] User data:', data.user);
  } else {
    console.warn('[Auth] Login response missing access_token');
  }
  return data;
}

/**
 * Logout user
 */
export function logoutUser() {
  console.log('[Auth] Logging out, clearing auth data');
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_data");
}

/**
 * Get current user data
 * @returns {Promise<{ id: number; username: string; email: string; is_active: boolean; created_at: string }>}
 */
export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem("auth_token");
}

/**
 * Get current user data from localStorage
 * @returns {object|null}
 */
export function getCurrentUserFromStorage() {
  const userData = localStorage.getItem("user_data");
  return userData ? JSON.parse(userData) : null;
}

// ── Download History ───────────────────────────────────────────────────────

/**
 * Get download history for current user
 * @param {{ page?: number; limit?: number }} params
 * @returns {Promise<{ downloads: Array<{ id: number; file_type: string; filename: string; downloaded_at: string }>; total: number }>}
 */
export async function getDownloadHistory({ page = 1, limit = 20 } = {}) {
  const { data } = await api.get("/downloads/history", { params: { page, limit } });
  return data;
}

/**
 * Delete a download log entry
 * @param {number} downloadId
 * @returns {Promise<boolean>}
 */
export async function deleteDownloadLog(downloadId) {
  const { status } = await api.delete(`/downloads/history/${downloadId}`);
  return status === 204;
}

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
 * @returns {Promise<Item|null>}
 */
export async function getItemByQr(itemCode) {
  try {
    const { data } = await api.get(`/data/qr/${encodeURIComponent(itemCode)}`);
    // Check if data is valid (not null/undefined/empty)
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return null;
    }
    return data;
  } catch (error) {
    // Return null for 404 (not found), rethrow other errors
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
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
export async function listItems({ page = 1, limit = 10, q = "", lang, cls, year } = {}) {
  const params = { page, limit, q };
  if (lang) params.lang = lang;
  if (cls) params.cls = cls;
  if (year) params.year = year;
  const { data } = await api.get("/data/", { params });
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

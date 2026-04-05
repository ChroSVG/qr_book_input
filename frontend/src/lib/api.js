/**
 * API client for the QR Input backend.
 * Centralized HTTP layer — all API calls go through here.
 */
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10_000,
});

// ── Items ──────────────────────────────────────────────────────────────────

/**
 * @param {{ qr_code: string; name: string; description?: string; extra_info?: string }} payload
 * @returns {Promise<Item>}
 */
export async function createItem(payload) {
  const { data } = await api.post("/data/", payload);
  return data;
}

/**
 * @param {string} qrCode
 * @returns {Promise<Item>}
 */
export async function getItemByQr(qrCode) {
  const { data } = await api.get(`/data/qr/${encodeURIComponent(qrCode)}`);
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

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function createData(payload) {
  const resp = await axios.post(`${API_BASE}/api/data/`, payload);
  return resp.data;
}

export async function getData(qr) {
  const resp = await axios.get(`${API_BASE}/api/data/qr/${qr}`);
  return resp.data;
}

// Fungsi untuk mendapatkan data lengkap berdasarkan QR code (termasuk ID)
export async function getDataByQr(qr) {
  const resp = await axios.get(`${API_BASE}/api/data/qr/${qr}`);
  return resp.data; // Endpoint ini seharusnya mengembalikan data lengkap termasuk ID
}

export async function fetchData({page=1, limit=10, q=""} = {}) {
  const resp = await axios.get(`${API_BASE}/api/data/`, {
    params: { page, limit, q }
  });
  return resp.data; // Returns { data: [...], total, page, limit, total_pages }
}

export async function updateData(id, field, value) {
  // Menyesuaikan dengan kebutuhan update satu field
  const resp = await axios.put(`${API_BASE}/api/data/${id}`, { [field]: value });
  return resp.data;
}

// Fungsi untuk mengupdate seluruh data
export async function updateAllData(id, payload) {
  const resp = await axios.put(`${API_BASE}/api/data/${id}`, payload);
  return resp.data;
}

export async function deleteData(id) {
  const resp = await axios.delete(`${API_BASE}/api/data/${id}`);
  return resp.status === 204;
}

export function exportCsv() {
  window.open(`${API_BASE}/api/data/export/csv`, "_blank");
}

export function exportExcel() {
  window.open(`${API_BASE}/api/data/export/excel`, "_blank");
}
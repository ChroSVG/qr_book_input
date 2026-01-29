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

export async function fetchData({page=1, limit=10, q=""} = {}) {
  const resp = await axios.get(`${API_BASE}/api/data/`, {
    params: { page, limit, q }
  });
  return resp.data; // Mengasumsikan response berisi { data: [...], total: 100 }
}

export async function updateData(id, field, value) {
  // Menyesuaikan dengan kebutuhan update satu field
  const resp = await axios.put(`${API_BASE}/api/data/${id}`, { [field]: value });
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
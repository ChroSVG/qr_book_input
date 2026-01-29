import React, { useState, useCallback, useRef } from "react";
import QrScanner from "../components/QrScanner";
import { createData, getData } from "../hooks/useApi";
import { Toast } from "../components/Toast";

export default function ScanPage() {
  const [form, setForm] = useState({ qr: "", name: "", desc: "", extra: "" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef(null);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.qr || !form.name) return setToast({ msg: "QR & Nama wajib diisi", type: "error" });
    
    setLoading(true);
    try {
      await createData({ qr_code: form.qr, name: form.name, description: form.desc, extra_info: form.extra });
      setToast({ msg: "Berhasil disimpan", type: "success" });
      setForm({ qr: "", name: "", desc: "", extra: "" });
    } catch {
      setToast({ msg: "Gagal menyimpan", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleScan = useCallback(async (decoded) => {
    if (!decoded) return;
    setForm(prev => ({ ...prev, qr: decoded }));
    try {
      const data = await getData(decoded);
      if (data) {
        setForm({ qr: decoded, name: data.name, desc: data.description, extra: data.extra_info });
        setToast({ msg: "Data ditemukan!", type: "success" });
      }
    } catch {
      setToast({ msg: "Barang baru terdeteksi", type: "info" });
      nameInputRef.current?.focus();
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Registrasi Barang</h2>
        <div className="rounded-3xl overflow-hidden shadow-lg border-4 border-white aspect-square max-w-md mx-auto relative">
          <QrScanner onScan={handleScan} />
        </div>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 h-fit">
        <form onSubmit={handleSave} className="space-y-4">
          <input value={form.qr} readOnly className="w-full bg-gray-50 border p-3 rounded-xl text-gray-400" placeholder="Kode QR" />
          <input ref={nameInputRef} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-3 rounded-xl outline-none" placeholder="Nama Barang" />
          <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="w-full border p-3 rounded-xl h-24 outline-none" placeholder="Deskripsi" />
          <input value={form.extra} onChange={e => setForm({...form, extra: e.target.value})} className="w-full border p-3 rounded-xl outline-none" placeholder="Info Tambahan" />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold disabled:bg-blue-300">
            {loading ? "Menyimpan..." : "Simpan Barang"}
          </button>
          <label className="block">
    {/* <span className="text-sm font-bold text-gray-700 ml-1">Nama Barang</span>
    <input 
      ref={nameInputRef} 
      value={form.name} 
      onChange={e => setForm({...form, name: e.target.value})} 
      className="w-full mt-1 border-gray-200 border-2 p-4 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
      placeholder="Masukkan nama barang..." 
    /> */}
  </label>
        </form>
      </div>
      <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
import React, { useState, useCallback, useRef, useEffect } from "react";
import QrScanner from "../components/QrScanner";
import { createData, getData, updateAllData } from "../hooks/useApi";
import { Toast } from "../components/Toast";

export default function ScanPage() {
  const [form, setForm] = useState({ id: null, qr: "", name: "", desc: "", extra: "" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef(null);
  const scannerInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const processScan = useCallback(async (decoded) => {
    if (!decoded) return;
    setForm(prev => ({ ...prev, qr: decoded }));
    try {
      const data = await getData(decoded);
      if (data) {
        setForm({
          id: data.id,
          qr: decoded,
          name: data.name,
          desc: data.description,
          extra: data.extra_info
        });
        setToast({ msg: "Data ditemukan!", type: "success" });
      }
    } catch {
      setToast({ msg: "Barang baru terdeteksi", type: "info" });
      setForm({
        id: null,
        qr: decoded,
        name: "",
        desc: "",
        extra: ""
      });
    }
    // Always focus to name input after scan
    setTimeout(() => nameInputRef.current?.focus(), 100);
  }, []);

  const handleScan = useCallback(async (decoded) => {
    await processScan(decoded);
  }, [processScan]);

  // Focus scanner input on mount
  useEffect(() => {
    const timer = setTimeout(() => scannerInputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Handle scanner input - accept both scanner and manual keyboard
  const handleScannerInputChange = useCallback((e) => {
    const value = e.target.value;
    if (!value) return;

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Process after delay (scanner selesai kirim atau user selesai ketik)
    scanTimeoutRef.current = setTimeout(() => {
      const qrCode = value.trim();
      if (qrCode) {
        processScan(qrCode);
      }
      e.target.value = "";
      // processScan will focus to name input
    }, 150);
  }, [processScan]);

  const handleScannerInputKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const qrCode = e.target.value.trim();
      e.target.value = "";
      if (qrCode) {
        processScan(qrCode);
      }
      // processScan will focus to name input
    }
  }, [processScan]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.qr || !form.name) return setToast({ msg: "QR & Nama wajib diisi", type: "error" });

    setLoading(true);
    try {
      if (form.id) {
        // Update existing data
        await updateAllData(form.id, {
          qr_code: form.qr,
          name: form.name,
          description: form.desc,
          extra_info: form.extra
        });
        setToast({ msg: "Berhasil diperbarui", type: "success" });
      } else {
        // Create new data
        await createData({ qr_code: form.qr, name: form.name, description: form.desc, extra_info: form.extra });
        setToast({ msg: "Berhasil disimpan", type: "success" });
      }
      setForm({ id: null, qr: "", name: "", desc: "", extra: "" });
      // Focus back to scanner input after save
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error saving data:', error);
      setToast({ msg: "Gagal menyimpan", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Registrasi Barang</h2>
        <div className="rounded-3xl overflow-hidden shadow-lg border-4 border-white aspect-square max-w-md mx-auto relative">
          <QrScanner onScan={handleScan} />
        </div>
        <p className="text-center text-gray-500 text-sm">
          📷 Scan dengan kamera atau gunakan scanner QR portable
        </p>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 h-fit">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Input untuk scanner portable - klik di sini sebelum scan */}
          <input
            ref={scannerInputRef}
            type="text"
            onChange={handleScannerInputChange}
            onKeyDown={handleScannerInputKeyDown}
            className="w-full border-2 border-blue-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="📡 Klik di sini, lalu scan QR dengan scanner portable"
            autoComplete="off"
          />
          <input value={form.qr} className="w-full bg-gray-50 border p-3 rounded-xl text-gray-400" placeholder="Kode QR" />
          <input ref={nameInputRef} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-3 rounded-xl outline-none" placeholder="Nama Barang" />
          <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="w-full border p-3 rounded-xl h-24 outline-none" placeholder="Deskripsi" />
          <input value={form.extra} onChange={e => setForm({...form, extra: e.target.value})} className="w-full border p-3 rounded-xl outline-none" placeholder="Info Tambahan" />

          <div className="flex space-x-3">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold disabled:bg-blue-300">
              {loading ? "Menyimpan..." : form.id ? "Update Barang" : "Simpan Barang"}
            </button>

            {form.id && (
              <button
                type="button"
                onClick={() => setForm({ id: null, qr: form.qr, name: "", desc: "", extra: "" })}
                className="flex-1 bg-gray-500 text-white p-4 rounded-xl font-bold hover:bg-gray-600"
              >
                Tambah Baru
              </button>
            )}
          </div>
        </form>
      </div>
      <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
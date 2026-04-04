import { useState, useCallback, useRef, useEffect } from "react";
import QrScanner from "../components/QrScanner";
import { useToast } from "../providers/ToastProvider";
import { useCreateItem, useLookupItem } from "../hooks/useItems";
import { Input, Button, Card } from "../ui";

export default function ScanPage() {
  const toast = useToast();
  const { create, loading: creating } = useCreateItem();
  const { lookup, loading: lookingUp } = useLookupItem();

  const [form, setForm] = useState({ id: null, qr: "", name: "", desc: "", extra: "" });
  const [mode, setMode] = useState("new"); // "new" | "edit"

  const nameInputRef = useRef(null);
  const scannerInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const processScan = useCallback(async (decoded) => {
    if (!decoded) return;
    setForm((prev) => ({ ...prev, qr: decoded }));

    const existing = await lookup(decoded);
    if (existing) {
      setForm({
        id: existing.id,
        qr: decoded,
        name: existing.name,
        desc: existing.description ?? "",
        extra: existing.extra_info ?? "",
      });
      setMode("edit");
      toast("Item found!", { type: "success" });
    } else {
      setForm({ id: null, qr: decoded, name: "", desc: "", extra: "" });
      setMode("new");
      toast("New item detected", { type: "info" });
    }

    setTimeout(() => nameInputRef.current?.focus(), 100);
  }, [lookup, toast]);

  // Focus scanner input on mount
  useEffect(() => {
    const t = setTimeout(() => scannerInputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  // Handheld scanner input (debounced)
  const handleScannerInputChange = useCallback((e) => {
    const value = e.target.value;
    if (!value) return;
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    scanTimeoutRef.current = setTimeout(() => {
      const qrCode = value.trim();
      if (qrCode) processScan(qrCode);
      e.target.value = "";
    }, 150);
  }, [processScan]);

  const handleScannerInputKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const qrCode = e.target.value.trim();
      e.target.value = "";
      if (qrCode) processScan(qrCode);
    }
  }, [processScan]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.qr || !form.name) {
      return toast("QR Code and Name are required", { type: "error" });
    }

    try {
      await create({
        qr_code: form.qr,
        name: form.name,
        description: form.desc || null,
        extra_info: form.extra || null,
      });
      toast("Item saved successfully", { type: "success" });
      setForm({ id: null, qr: "", name: "", desc: "", extra: "" });
      setMode("new");
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    } catch (err) {
      const msg = err.response?.status === 409
        ? "This QR code already exists"
        : "Failed to save item";
      toast(msg, { type: "error" });
    }
  };

  const handleReset = () => {
    setForm({ id: null, qr: form.qr, name: "", desc: "", extra: "" });
    setMode("new");
  };

  const loading = creating || lookingUp;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Scanner Panel */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
            <p className="text-sm text-gray-500 mt-1">Point your camera at a QR code or use a handheld scanner.</p>
          </div>

          <div className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-white">
            <QrScanner onScan={processScan} />
          </div>

          {/* Handheld scanner input */}
          <Input
            ref={scannerInputRef}
            placeholder="Or type/paste QR code here..."
            onChange={handleScannerInputChange}
            onKeyDown={handleScannerInputKeyDown}
            autoComplete="off"
          />
        </div>

        {/* Form Panel */}
        <Card className="p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {mode === "edit" ? "Edit Item" : "New Item"}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <Input value={form.qr} placeholder="QR Code" readOnly />

            <Input
              ref={nameInputRef}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Item name *"
            />

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-24"
                placeholder="Optional description"
              />
            </div>

            <Input
              value={form.extra}
              onChange={(e) => setForm({ ...form, extra: e.target.value })}
              placeholder="Extra info (optional)"
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading} className="flex-1">
                {mode === "edit" ? "Update Item" : "Save Item"}
              </Button>
              {mode === "edit" && (
                <Button type="button" variant="secondary" onClick={handleReset}>
                  New
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

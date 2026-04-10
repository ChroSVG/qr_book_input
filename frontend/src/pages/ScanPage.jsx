import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import QrScanner from "../components/QrScanner";
import { useToast } from "../providers/ToastProvider";
import { useCreateItem, useLookupItem, useUpdateItem } from "../hooks/useItems";
import { Input, Button, Card } from "../ui";

const EMPTY_FORM = {
  id: null,
  item_code: "",
  title: "",
  edition: "",
  publisher_name: "",
  publish_year: "",
  call_number: "",
  language_name: "",
  place_name: "",
  classification: "",
  authors: "",
  topics: "",
  volume: "",
  description: "",
  extra_info: "",
};

export default function ScanPage() {
  const toast = useToast();
  const { create, loading: creating } = useCreateItem();
  const { lookup, loading: lookingUp } = useLookupItem();
  const { update, loading: updating } = useUpdateItem();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [mode, setMode] = useState("new"); // "new" | "edit"
  const [lastScanned, setLastScanned] = useState(""); // Track last scanned QR

  const titleInputRef = useRef(null);
  const scannerInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const processScan = useCallback(async (decoded) => {
    if (!decoded) return;

    // Prevent processing same QR multiple times
    if (decoded === lastScanned) return;
    setLastScanned(decoded);

    setForm((prev) => ({ ...prev, item_code: decoded }));

    const existing = await lookup(decoded);
    if (existing) {
      setForm({
        id: existing.id,
        item_code: decoded,
        title: existing.title ?? "",
        edition: existing.edition ?? "",
        publisher_name: existing.publisher_name ?? "",
        publish_year: existing.publish_year ?? "",
        call_number: existing.call_number ?? "",
        language_name: existing.language_name ?? "",
        place_name: existing.place_name ?? "",
        classification: existing.classification ?? "",
        authors: existing.authors ?? "",
        topics: existing.topics ?? "",
        volume: existing.volume ?? "",
        description: existing.description ?? "",
        extra_info: existing.extra_info ?? "",
      });
      setMode("edit");
      toast("Item found!", { type: "success" });
    } else {
      setForm({ id: null, item_code: decoded, title: "", edition: "", publisher_name: "", publish_year: "", call_number: "", language_name: "", place_name: "", classification: "", authors: "", topics: "", volume: "", description: "", extra_info: "" });
      setMode("new");
      toast("New item detected", { type: "info" });
    }

    setTimeout(() => titleInputRef.current?.focus(), 100);
  }, [lookup, toast, lastScanned]);

  // Focus scanner input on mount
  useEffect(() => {
    const t = setTimeout(() => scannerInputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  // Initialize Yamli on ALL form inputs (official Yamli setup)
  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof Yamli !== "undefined" && Yamli.init) {
        Yamli.init();
        // Yamli.yamlify("yamli-item-item_code", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-title", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-edition", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-publisher_name", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-publish_year", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-call_number", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-language_name", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-place_name", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-classification", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-authors", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-topics", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-volume", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-description", { startMode: "offOrUserDefault" });
        Yamli.yamlify("yamli-item-extra_info", { startMode: "offOrUserDefault" });
      }
    }, 500);
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
    if (!form.item_code || !form.title) {
      return toast("Item Code and Title are required", { type: "error" });
    }

    // Trim trailing spaces from Yamli before saving
    const cleanForm = {
      item_code: form.item_code.trimEnd(),
      title: form.title.trimEnd(),
      edition: (form.edition || "").trimEnd() || null,
      publisher_name: (form.publisher_name || "").trimEnd() || null,
      publish_year: form.publish_year ? parseInt(form.publish_year, 10) || null : null,
      call_number: (form.call_number || "").trimEnd() || null,
      language_name: (form.language_name || "").trimEnd() || null,
      place_name: (form.place_name || "").trimEnd() || null,
      classification: (form.classification || "").trimEnd() || null,
      authors: (form.authors || "").trimEnd() || null,
      topics: (form.topics || "").trimEnd() || null,
      volume: (form.volume || "").trimEnd() || null,
      description: (form.description || "").trimEnd() || null,
      extra_info: (form.extra_info || "").trimEnd() || null,
    };

    try {
      if (mode === "edit" && form.id) {
        await update(form.id, cleanForm);
        toast("Item updated successfully", { type: "success" });
      } else {
        await create(cleanForm);
        toast("Item saved successfully", { type: "success" });
        setForm({ ...EMPTY_FORM });
        setMode("new");
      }
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    } catch (err) {
      const msg = err.response?.status === 409
        ? "This item code already exists"
        : "Failed to save item";
      toast(msg, { type: "error" });
    }
  };

  const handleReset = () => {
    setForm({ id: null, item_code: form.item_code, title: "", edition: "", publisher_name: "", publish_year: "", call_number: "", language_name: "", place_name: "", classification: "", authors: "", topics: "", volume: "", description: "", extra_info: "" });
    setMode("new");
  };

  const loading = creating || lookingUp || updating;

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
            <QrScanner
              onScan={processScan}
              cooldownMs={2000}
            />
          </div>

          {lastScanned && (
            <div className="text-xs text-center text-gray-500">
              Last scanned: <code className="bg-gray-100 px-2 py-0.5 rounded">{lastScanned.slice(0, 20)}...</code>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              ref={scannerInputRef}
              placeholder="Type or paste item code..."
              onChange={handleScannerInputChange}
              onKeyDown={handleScannerInputKeyDown}
              autoComplete="off"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => {
                const randomQR = `QR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                if (scannerInputRef.current) {
                  scannerInputRef.current.value = randomQR;
                }
                processScan(randomQR);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md active:scale-95"
              title="Generate random item code"
            >
              🎲 Random
            </button>
          </div>
        </div>

        {/* Form Panel */}
        <Card className="p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {mode === "edit" ? "Edit Item" : "New Item"}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Item Code */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Item Code *</label>
              <Input
                id="yamli-item-item_code"
                value={form.item_code}
                onChange={(e) => setForm({ ...form, item_code: e.target.value })}
                placeholder="Item code (scanned) *"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
              <Input
                id="yamli-item-title"
                ref={titleInputRef}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title *"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Edition</label>
                <Input id="yamli-item-edition" value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} placeholder="e.g. 1st, 2nd" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Publisher</label>
                <Input id="yamli-item-publisher_name" value={form.publisher_name} onChange={(e) => setForm({ ...form, publisher_name: e.target.value })} placeholder="Publisher name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                <Input id="yamli-item-publish_year" type="number" value={form.publish_year} onChange={(e) => setForm({ ...form, publish_year: e.target.value })} placeholder="e.g. 2024" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Call No.</label>
                <Input id="yamli-item-call_number" value={form.call_number} onChange={(e) => setForm({ ...form, call_number: e.target.value })} placeholder="Call number" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
                <Input id="yamli-item-language_name" value={form.language_name} onChange={(e) => setForm({ ...form, language_name: e.target.value })} placeholder="e.g. Indonesian, Arabic" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Place</label>
                <Input id="yamli-item-place_name" value={form.place_name} onChange={(e) => setForm({ ...form, place_name: e.target.value })} placeholder="Place of publication" />
              </div>
            </div>

            {/* Classification */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Classification</label>
              <Input id="yamli-item-classification" value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} placeholder="e.g. Dewey decimal" />
            </div>

            {/* Authors */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Authors</label>
              <Input id="yamli-item-authors" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} placeholder="Author(s), comma-separated" />
            </div>

            {/* Topics */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Topics</label>
              <Input id="yamli-item-topics" value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} placeholder="Topic(s), comma-separated" />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Volume</label>
              <Input id="yamli-item-volume" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} placeholder="Volume / edition" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea
                id="yamli-item-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-20"
                placeholder="Optional description"
              />
            </div>

            {/* Extra Info */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Extra Info</label>
              <textarea
                id="yamli-item-extra_info"
                value={form.extra_info}
                onChange={(e) => setForm({ ...form, extra_info: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-20"
                placeholder="Extra info (optional)"
              />
            </div>

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

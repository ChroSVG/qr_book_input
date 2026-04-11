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

const FORM_HISTORY_KEY = "scanpage_form_history";
const MAX_FORM_HISTORY = 15;
const MAX_FIELD_HISTORY = 20;

// Field history storage: { fieldName: ["value1", "value2", ...] }
function getFieldHistory() {
  try {
    const raw = localStorage.getItem("scanpage_field_history");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function addToFieldHistory(fieldName, value) {
  if (!fieldName || !value || !value.trim()) return;
  const history = getFieldHistory();
  if (!history[fieldName]) history[fieldName] = [];
  const filtered = history[fieldName].filter(v => v !== value);
  history[fieldName] = [value, ...filtered].slice(0, MAX_FIELD_HISTORY);
  localStorage.setItem("scanpage_field_history", JSON.stringify(history));
}

function getFieldHistoryValues(fieldName) {
  const history = getFieldHistory();
  return history[fieldName] || [];
}

function clearFieldHistory() {
  localStorage.removeItem("scanpage_field_history");
}

// Custom hook for field history
function useFieldHistory(fieldName) {
  const [history, setHistory] = useState(() => getFieldHistoryValues(fieldName));
  const [showDropdown, setShowDropdown] = useState(false);
  
  const addToHistory = useCallback((value) => {
    addToFieldHistory(fieldName, value);
    setHistory(getFieldHistoryValues(fieldName));
  }, [fieldName]);
  
  const clearHistory = useCallback(() => {
    const history = getFieldHistory();
    delete history[fieldName];
    localStorage.setItem("scanpage_field_history", JSON.stringify(history));
    setHistory([]);
    setShowDropdown(false);
  }, [fieldName]);
  
  // Update history when fieldName changes
  useEffect(() => {
    setHistory(getFieldHistoryValues(fieldName));
  }, [fieldName]);
  
  return { history, showDropdown, setShowDropdown, addToHistory, clearHistory };
}

// History Input Component with dropdown
function HistoryInput({ 
  id, 
  value, 
  onChange, 
  onBlur, 
  placeholder, 
  type = "text",
  fieldName,
  className = ""
}) {
  const { history, showDropdown, setShowDropdown, addToHistory, clearHistory } = useFieldHistory(fieldName);
  const wrapperRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowDropdown]);
  
  const handleSelect = useCallback((val) => {
    onChange({ target: { value: val } });
    setShowDropdown(false);
    addToHistory(val);
    // Focus back to input after selection
    setTimeout(() => {
      const input = document.getElementById(id);
      input?.focus();
    }, 50);
  }, [onChange, setShowDropdown, addToHistory, id]);
  
  const handleClearHistory = useCallback(() => {
    clearHistory();
  }, [clearHistory]);
  
  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            // Don't trigger Yamli blur here - let parent handle it
            if (e.target.value) addToHistory(e.target.value);
            onBlur?.(e);
          }}
          onFocus={() => history.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="flex-1"
        />
        {history.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="px-2 py-2.5 bg-gray-100 text-gray-600 text-xs rounded-xl hover:bg-gray-200 transition-colors"
            title={`Show ${history.length} recent ${fieldName}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* History Dropdown */}
      {showDropdown && history.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">Recent ({history.length})</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearHistory();
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear
            </button>
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {history.map((item, idx) => (
              <li
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(item);
                }}
                className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 truncate transition-colors"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function getFormHistory() {
  try {
    const raw = localStorage.getItem(FORM_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToFormHistory(formData) {
  if (!formData || !formData.item_code) return;
  const history = getFormHistory();
  const filtered = history.filter(h => h.item_code !== formData.item_code);
  const updated = [formData, ...filtered].slice(0, MAX_FORM_HISTORY);
  localStorage.setItem(FORM_HISTORY_KEY, JSON.stringify(updated));
}

function loadFromFormHistory(itemCode) {
  const history = getFormHistory();
  return history.find(h => h.item_code === itemCode) || null;
}

function clearFormHistory() {
  localStorage.removeItem(FORM_HISTORY_KEY);
}

export default function ScanPage() {
  const toast = useToast();
  const { create, loading: creating } = useCreateItem();
  const { lookup, loading: lookingUp } = useLookupItem();
  const { update, loading: updating } = useUpdateItem();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [mode, setMode] = useState("new"); // "new" | "edit"
  const [lastScanned, setLastScanned] = useState(""); // Track last scanned QR
  const [formHistory, setFormHistory] = useState(getFormHistory());
  const [showHistory, setShowHistory] = useState(false);

  const titleInputRef = useRef(null);
  const scannerInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const itemCodeWrapperRef = useRef(null);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (itemCodeWrapperRef.current && !itemCodeWrapperRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const processScan = useCallback(async (decoded) => {
    if (!decoded) return;

    // Prevent processing same QR multiple times
    if (decoded === lastScanned) return;
    setLastScanned(decoded);

    // Keep existing form data when scanning new/random QR
    const currentFormData = { ...form };

    setForm((prev) => ({ ...prev, item_code: decoded }));

    const existing = await lookup(decoded);
    if (existing && existing.id) {
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
      // Preserve existing form data when generating random QR
      setForm({
        id: null,
        item_code: decoded,
        title: currentFormData.title || "",
        edition: currentFormData.edition || "",
        publisher_name: currentFormData.publisher_name || "",
        publish_year: currentFormData.publish_year || "",
        call_number: currentFormData.call_number || "",
        language_name: currentFormData.language_name || "",
        place_name: currentFormData.place_name || "",
        classification: currentFormData.classification || "",
        authors: currentFormData.authors || "",
        topics: currentFormData.topics || "",
        volume: currentFormData.volume || "",
        description: currentFormData.description || "",
        extra_info: currentFormData.extra_info || "",
      });
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

  // Sync Yamli result to React state - simplified, no forced conversion
  const handleYamliBlur = useCallback((field) => (e) => {
    const input = e.target;
    const value = input.value;
    
    // Just sync the current value, don't force Yamli conversion
    setForm(prev => ({ ...prev, [field]: value }));
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
        const updated = await update(form.id, cleanForm);
        toast("Item updated successfully", { type: "success" });
        // Save to history
        addToFormHistory({ ...cleanForm, id: updated.id || form.id });
        setFormHistory(getFormHistory());
        // Preserve the updated data in form
        setForm({
          id: updated.id || form.id,
          item_code: (updated.item_code || form.item_code).trimEnd(),
          title: (updated.title || form.title).trimEnd(),
          edition: (updated.edition || form.edition || "").trimEnd(),
          publisher_name: (updated.publisher_name || form.publisher_name || "").trimEnd(),
          publish_year: updated.publish_year || form.publish_year || "",
          call_number: (updated.call_number || form.call_number || "").trimEnd(),
          language_name: (updated.language_name || form.language_name || "").trimEnd(),
          place_name: (updated.place_name || form.place_name || "").trimEnd(),
          classification: (updated.classification || form.classification || "").trimEnd(),
          authors: (updated.authors || form.authors || "").trimEnd(),
          topics: (updated.topics || form.topics || "").trimEnd(),
          volume: (updated.volume || form.volume || "").trimEnd(),
          description: (updated.description || form.description || "").trimEnd(),
          extra_info: (updated.extra_info || form.extra_info || "").trimEnd(),
        });
      } else {
        const created = await create(cleanForm);
        toast("Item saved successfully", { type: "success" });
        // Save to history
        addToFormHistory({ ...cleanForm, id: created.id || null });
        setFormHistory(getFormHistory());
        // Keep the saved data in form and switch to edit mode
        setForm({
          id: created.id || null,
          item_code: (created.item_code || form.item_code).trimEnd(),
          title: (created.title || form.title).trimEnd(),
          edition: (created.edition || "").trimEnd(),
          publisher_name: (created.publisher_name || "").trimEnd(),
          publish_year: created.publish_year || "",
          call_number: (created.call_number || "").trimEnd(),
          language_name: (created.language_name || "").trimEnd(),
          place_name: (created.place_name || "").trimEnd(),
          classification: (created.classification || "").trimEnd(),
          authors: (created.authors || "").trimEnd(),
          topics: (created.topics || "").trimEnd(),
          volume: (created.volume || "").trimEnd(),
          description: (created.description || "").trimEnd(),
          extra_info: (created.extra_info || "").trimEnd(),
        });
        setMode("edit");
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

  const handleHistorySelect = useCallback((historyItem) => {
    setForm({
      id: historyItem.id || null,
      item_code: historyItem.item_code || "",
      title: historyItem.title || "",
      edition: historyItem.edition || "",
      publisher_name: historyItem.publisher_name || "",
      publish_year: historyItem.publish_year || "",
      call_number: historyItem.call_number || "",
      language_name: historyItem.language_name || "",
      place_name: historyItem.place_name || "",
      classification: historyItem.classification || "",
      authors: historyItem.authors || "",
      topics: historyItem.topics || "",
      volume: historyItem.volume || "",
      description: historyItem.description || "",
      extra_info: historyItem.extra_info || "",
    });
    setMode(historyItem.id ? "edit" : "new");
    setShowHistory(false);
    toast("Form loaded from history", { type: "info" });
  }, [toast]);

  const handleClearHistory = useCallback(() => {
    clearFormHistory();
    setFormHistory([]);
    setShowHistory(false);
    toast("Form history cleared", { type: "info" });
  }, [toast]);

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
            <div ref={itemCodeWrapperRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Item Code *
                {formHistory.length > 0 && (
                  <span className="ml-2 text-[10px] text-blue-600 font-normal">
                    ({formHistory.length} saved)
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <Input
                  id="yamli-item-item_code"
                  value={form.item_code}
                  onChange={(e) => setForm({ ...form, item_code: e.target.value })}
                  onFocus={() => formHistory.length > 0 && setShowHistory(true)}
                  placeholder="Item code (scanned) *"
                  className="flex-1"
                />
                {formHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-3 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition-colors"
                    title="Show history"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Form History Dropdown */}
              {showHistory && formHistory.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Recent Forms</span>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {formHistory.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleHistorySelect(item)}
                        className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.item_code}</p>
                            <p className="text-xs text-gray-500 truncate">{item.title || "No title"}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
              <HistoryInput
                id="yamli-item-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={handleYamliBlur("title")}
                placeholder="Title *"
                fieldName="title"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Edition</label>
                <HistoryInput 
                  id="yamli-item-edition" 
                  value={form.edition} 
                  onChange={(e) => setForm({ ...form, edition: e.target.value })}
                  onBlur={handleYamliBlur("edition")} 
                  placeholder="e.g. 1st, 2nd" 
                  fieldName="edition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Publisher</label>
                <HistoryInput 
                  id="yamli-item-publisher_name" 
                  value={form.publisher_name} 
                  onChange={(e) => setForm({ ...form, publisher_name: e.target.value })}
                  onBlur={handleYamliBlur("publisher_name")} 
                  placeholder="Publisher name" 
                  fieldName="publisher_name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                <HistoryInput 
                  id="yamli-item-publish_year" 
                  type="number" 
                  value={form.publish_year} 
                  onChange={(e) => setForm({ ...form, publish_year: e.target.value })}
                  onBlur={handleYamliBlur("publish_year")} 
                  placeholder="e.g. 2024" 
                  fieldName="publish_year"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Call No.</label>
                <HistoryInput 
                  id="yamli-item-call_number" 
                  value={form.call_number} 
                  onChange={(e) => setForm({ ...form, call_number: e.target.value })}
                  onBlur={handleYamliBlur("call_number")} 
                  placeholder="Call number" 
                  fieldName="call_number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
                <HistoryInput 
                  id="yamli-item-language_name" 
                  value={form.language_name} 
                  onChange={(e) => setForm({ ...form, language_name: e.target.value })}
                  onBlur={handleYamliBlur("language_name")} 
                  placeholder="e.g. Indonesian, Arabic" 
                  fieldName="language_name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Place</label>
                <HistoryInput 
                  id="yamli-item-place_name" 
                  value={form.place_name} 
                  onChange={(e) => setForm({ ...form, place_name: e.target.value })}
                  onBlur={handleYamliBlur("place_name")} 
                  placeholder="Place of publication" 
                  fieldName="place_name"
                />
              </div>
            </div>

            {/* Classification */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Classification</label>
              <HistoryInput 
                id="yamli-item-classification" 
                value={form.classification} 
                onChange={(e) => setForm({ ...form, classification: e.target.value })}
                onBlur={handleYamliBlur("classification")} 
                placeholder="e.g. Dewey decimal" 
                fieldName="classification"
              />
            </div>

            {/* Authors */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Authors</label>
              <HistoryInput 
                id="yamli-item-authors" 
                value={form.authors} 
                onChange={(e) => setForm({ ...form, authors: e.target.value })}
                onBlur={handleYamliBlur("authors")} 
                placeholder="Author(s), comma-separated" 
                fieldName="authors"
              />
            </div>

            {/* Topics */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Topics</label>
              <HistoryInput 
                id="yamli-item-topics" 
                value={form.topics} 
                onChange={(e) => setForm({ ...form, topics: e.target.value })}
                onBlur={handleYamliBlur("topics")} 
                placeholder="Topic(s), comma-separated" 
                fieldName="topics"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Volume</label>
              <HistoryInput 
                id="yamli-item-volume" 
                value={form.volume} 
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                onBlur={handleYamliBlur("volume")} 
                placeholder="Volume / edition" 
                fieldName="volume"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea
                id="yamli-item-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value) addToFieldHistory("description", e.target.value);
                  handleYamliBlur("description")(e);
                }}
                onFocus={() => {
                  const descHistory = getFieldHistoryValues("description");
                  if (descHistory.length > 0) setForm(prev => ({ ...prev, _showDescHistory: true }));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-20"
                placeholder="Optional description"
              />
              {(() => {
                const descHistory = getFieldHistoryValues("description");
                if (descHistory.length === 0) return null;
                return (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, _showDescHistory: !prev._showDescHistory }))}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      📝 {form._showDescHistory ? "Hide" : "Show"} recent ({descHistory.length})
                    </button>
                    {form._showDescHistory && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-medium text-gray-500">Recent Descriptions</span>
                          <button
                            type="button"
                            onClick={() => {
                              const history = getFieldHistory();
                              delete history.description;
                              localStorage.setItem("scanpage_field_history", JSON.stringify(history));
                              setForm(prev => ({ ...prev, _showDescHistory: false }));
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Clear
                          </button>
                        </div>
                        <ul className="max-h-40 overflow-y-auto">
                          {descHistory.map((item, idx) => (
                            <li
                              key={idx}
                              onClick={() => {
                                setForm(prev => ({ ...prev, description: item, _showDescHistory: false }));
                                addToFieldHistory("description", item);
                              }}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 truncate transition-colors"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Extra Info */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Extra Info</label>
              <textarea
                id="yamli-item-extra_info"
                value={form.extra_info}
                onChange={(e) => setForm({ ...form, extra_info: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value) addToFieldHistory("extra_info", e.target.value);
                  handleYamliBlur("extra_info")(e);
                }}
                onFocus={() => {
                  const extraHistory = getFieldHistoryValues("extra_info");
                  if (extraHistory.length > 0) setForm(prev => ({ ...prev, _showExtraHistory: true }));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-20"
                placeholder="Extra info (optional)"
              />
              {(() => {
                const extraHistory = getFieldHistoryValues("extra_info");
                if (extraHistory.length === 0) return null;
                return (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, _showExtraHistory: !prev._showExtraHistory }))}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      📝 {form._showExtraHistory ? "Hide" : "Show"} recent ({extraHistory.length})
                    </button>
                    {form._showExtraHistory && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-medium text-gray-500">Recent Extra Info</span>
                          <button
                            type="button"
                            onClick={() => {
                              const history = getFieldHistory();
                              delete history.extra_info;
                              localStorage.setItem("scanpage_field_history", JSON.stringify(history));
                              setForm(prev => ({ ...prev, _showExtraHistory: false }));
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Clear
                          </button>
                        </div>
                        <ul className="max-h-40 overflow-y-auto">
                          {extraHistory.map((item, idx) => (
                            <li
                              key={idx}
                              onClick={() => {
                                setForm(prev => ({ ...prev, extra_info: item, _showExtraHistory: false }));
                                addToFieldHistory("extra_info", item);
                              }}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 truncate transition-colors"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
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

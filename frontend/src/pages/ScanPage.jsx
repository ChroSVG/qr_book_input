import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../providers/ToastProvider";
import { useCreateItem, useLookupItem, useUpdateItem } from "../hooks/useItems";
import ScannerPanel from "../components/ScannerPanel";
import FormPanel from "../components/FormPanel";

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

function clearFormHistory() {
  localStorage.removeItem(FORM_HISTORY_KEY);
}

export default function ScanPage() {
  const toast = useToast();
  const { create, loading: creating } = useCreateItem();
  const { lookup, loading: lookingUp } = useLookupItem();
  const { update, loading: updating } = useUpdateItem();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [mode, setMode] = useState("new");
  const [lastScanned, setLastScanned] = useState("");
  const [formHistory, setFormHistory] = useState(getFormHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [formBeforeEdit, setFormBeforeEdit] = useState(null);

  // Store Yamli-converted values (Arabic) read from DOM on blur
  const convertedValuesRef = useRef({ ...EMPTY_FORM });

  const titleInputRef = useRef(null);
  const scannerInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const itemCodeWrapperRef = useRef(null);

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
    if (decoded === lastScanned) return;
    setLastScanned(decoded);

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
      // Update converted values with data from server
      convertedValuesRef.current = {
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
      };
      setMode("edit");
      toast("Item found!", { type: "success" });
    } else {
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

  useEffect(() => {
    const t = setTimeout(() => scannerInputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof Yamli !== "undefined" && Yamli.init) {
        // Re-init Yamli to pick up new elements
        Yamli.init();
        // Yamli auto-detects elements with yamli-item-* IDs
        // Just need to call yamlify for each field
        const yamliFields = [
          "yamli-item-title", "yamli-item-edition", "yamli-item-publisher_name",
          "yamli-item-publish_year", "yamli-item-call_number", "yamli-item-language_name",
          "yamli-item-place_name", "yamli-item-classification", "yamli-item-authors",
          "yamli-item-topics", "yamli-item-volume", "yamli-item-description",
          "yamli-item-extra_info"
        ];
        yamliFields.forEach(id => {
          const el = document.getElementById(id);
          if (el && Yamli.yamlify) {
            Yamli.yamlify(id, { startMode: "onOrUserDefault" });
          }
        });
      }
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const handleFieldBlur = useCallback((field) => (e) => {
    const inputEl = e.target;
    const currentValue = inputEl.value;
    if (currentValue && !currentValue.endsWith(' ')) {
      inputEl.value = currentValue + ' ';
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Read converted value from DOM after Yamli processes
    setTimeout(() => {
      const convertedValue = inputEl.value.trimEnd();
      // Save converted value (Arabic) to ref
      convertedValuesRef.current = {
        ...convertedValuesRef.current,
        [field]: convertedValue,
      };
      // Also update React state
      setForm(prev => ({ ...prev, [field]: convertedValue }));
    }, 50);
  }, []);

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
    // Use converted values (Arabic) from ref instead of React state (Latin)
    const cv = convertedValuesRef.current;
    const title = cv.title || form.title;
    if (!form.item_code || !title) {
      return toast("Item Code and Title are required", { type: "error" });
    }

    const cleanForm = {
      item_code: form.item_code.trimEnd(),
      title: title.trimEnd(),
      edition: (cv.edition || form.edition || "").trimEnd() || null,
      publisher_name: (cv.publisher_name || form.publisher_name || "").trimEnd() || null,
      publish_year: form.publish_year ? parseInt(form.publish_year, 10) || null : null,
      call_number: (cv.call_number || form.call_number || "").trimEnd() || null,
      language_name: (cv.language_name || form.language_name || "").trimEnd() || null,
      place_name: (cv.place_name || form.place_name || "").trimEnd() || null,
      classification: (cv.classification || form.classification || "").trimEnd() || null,
      authors: (cv.authors || form.authors || "").trimEnd() || null,
      topics: (cv.topics || form.topics || "").trimEnd() || null,
      volume: (cv.volume || form.volume || "").trimEnd() || null,
      description: (cv.description || form.description || "").trimEnd() || null,
      extra_info: (cv.extra_info || form.extra_info || "").trimEnd() || null,
    };

    try {
      if (mode === "edit" && form.id) {
        // Save converted values for restore
        setFormBeforeEdit({ ...cv, item_code: form.item_code });
        const updated = await update(form.id, cleanForm);
        toast("Item updated successfully", { type: "success" });
        addToFormHistory({ ...cleanForm, id: updated.id || form.id });
        setFormHistory(getFormHistory());
        // Reset form and converted values
        setForm({ ...EMPTY_FORM, item_code: form.item_code });
        convertedValuesRef.current = { ...EMPTY_FORM };
        setMode("new");
      } else {
        // Save converted values for restore
        setFormBeforeEdit({ ...cv, item_code: form.item_code });
        const created = await create(cleanForm);
        toast("Item saved successfully", { type: "success" });
        addToFormHistory({ ...cleanForm, id: created.id || null });
        setFormHistory(getFormHistory());
        // Reset form and converted values
        setForm({ ...EMPTY_FORM, item_code: form.item_code });
        convertedValuesRef.current = { ...EMPTY_FORM };
      }
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    } catch (err) {
      const msg = err.response?.status === 409 ? "This item code already exists" : "Failed to save item";
      toast(msg, { type: "error" });
    }
  };

  const handleReset = () => {
    setForm({ ...EMPTY_FORM, item_code: form.item_code });
    convertedValuesRef.current = { ...EMPTY_FORM };
    setMode("new");
  };

  const handleRestore = () => {
    if (formBeforeEdit) {
      // Restore converted values (Arabic), keep current item_code
      const currentItemCode = form.item_code;
      setForm({ ...formBeforeEdit, item_code: currentItemCode });
      // Also restore converted values ref
      const { item_code, ...fields } = formBeforeEdit;
      convertedValuesRef.current = { ...fields };
      setFormBeforeEdit(null);
      toast("Form restored to previous state", { type: "info" });
    } else {
      toast("No previous state to restore", { type: "info" });
    }
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
    // Update converted values
    convertedValuesRef.current = {
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
    };
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

  const handleRandomClick = useCallback((randomQR) => {
    // Use converted values to check if there's data
    const cv = convertedValuesRef.current;
    const hasData = cv.title || cv.edition || cv.publisher_name ||
      cv.call_number || cv.language_name || cv.place_name ||
      cv.classification || cv.authors || cv.topics ||
      cv.volume || cv.description || cv.extra_info;

    if (hasData) {
      // Save converted values for restore
      setFormBeforeEdit({ ...cv, item_code: form.item_code });
    }
    processScan(randomQR);
  }, [form.item_code, processScan]);

  const loading = creating || lookingUp || updating;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <ScannerPanel
          lastScanned={lastScanned}
          onScan={processScan}
          onScannerInputChange={handleScannerInputChange}
          onScannerInputKeyDown={handleScannerInputKeyDown}
          onRandomClick={handleRandomClick}
        />
        <FormPanel
          mode={mode}
          form={form}
          setForm={setForm}
          loading={loading}
          formHistory={formHistory}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          itemCodeWrapperRef={itemCodeWrapperRef}
          onSave={handleSave}
          onHistorySelect={handleHistorySelect}
          onClearHistory={handleClearHistory}
          onReset={handleReset}
          onRestore={handleRestore}
          showRestore={!!formBeforeEdit}
          handleFieldBlur={handleFieldBlur}
        />
      </div>
    </div>
  );
}

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

function addToFormHistory(formData) {
  if (!formData || !formData.item_code) return;
  try {
    const raw = localStorage.getItem("scanpage_form_history");
    const history = raw ? JSON.parse(raw) : [];
    const filtered = history.filter(h => h.item_code !== formData.item_code);
    const updated = [formData, ...filtered].slice(0, 15);
    localStorage.setItem("scanpage_form_history", JSON.stringify(updated));
  } catch { /* ignore */ }
}

export default function ScanPage() {
  const toast = useToast();
  const { create, loading: creating } = useCreateItem();
  const { lookup, loading: lookingUp } = useLookupItem();
  const { update, loading: updating } = useUpdateItem();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [mode, setMode] = useState("new");
  const [lastScanned, setLastScanned] = useState("");
  const [formBeforeEdit, setFormBeforeEdit] = useState(null);
  const [autoRandom, setAutoRandom] = useState(false); // Auto-generate random QR after submit

  const scannerInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // Store Yamli-converted values (Arabic) read from DOM on blur
  const convertedValuesRef = useRef({ ...EMPTY_FORM });
  const titleInputRef = useRef(null);

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
      // For new items, preserve call_number, language_name, classification, topics from ref
      const cv = convertedValuesRef.current;
      setForm({
        id: null,
        item_code: decoded,
        title: currentFormData.title || "",
        edition: currentFormData.edition || "",
        publisher_name: currentFormData.publisher_name || "",
        publish_year: currentFormData.publish_year || "",
        call_number: currentFormData.call_number || cv.call_number || "",
        language_name: currentFormData.language_name || cv.language_name || "",
        place_name: currentFormData.place_name || "",
        classification: currentFormData.classification || cv.classification || "",
        authors: currentFormData.authors || "",
        topics: currentFormData.topics || cv.topics || "",
        volume: currentFormData.volume || "",
        description: currentFormData.description || "",
        extra_info: currentFormData.extra_info || "",
      });
      // Update converted values
      convertedValuesRef.current = {
        id: null,
        item_code: decoded,
        title: currentFormData.title || "",
        edition: currentFormData.edition || "",
        publisher_name: currentFormData.publisher_name || "",
        publish_year: currentFormData.publish_year || "",
        call_number: currentFormData.call_number || cv.call_number || "",
        language_name: currentFormData.language_name || cv.language_name || "",
        place_name: currentFormData.place_name || "",
        classification: currentFormData.classification || cv.classification || "",
        authors: currentFormData.authors || "",
        topics: currentFormData.topics || cv.topics || "",
        volume: currentFormData.volume || "",
        description: currentFormData.description || "",
        extra_info: currentFormData.extra_info || "",
      };
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
        Yamli.init();
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

          // Debug: Log only when field value changes
          let lastValue = el?.value || '';
          const observer = setInterval(() => {
            const currentVal = el?.value || '';
            if (currentVal !== lastValue) {
              console.log(`[Yamli CHANGE] ${id.replace('yamli-item-', '')}:`, {
                dom: currentVal,
                endsWithSpace: currentVal.endsWith(' '),
                length: currentVal.length,
              });
              lastValue = currentVal;
            }
          }, 100);

          if (!window.__yamliDebugIntervals) window.__yamliDebugIntervals = [];
          window.__yamliDebugIntervals.push(observer);

          // Add space BEFORE focusout happens (intercept Tab, Enter, and clicks)
          const handleKeyBeforeBlur = (e) => {
            if ((e.key === 'Tab' || e.key === 'Enter') && document.activeElement === el) {
              e.preventDefault();
              const currentVal = el.value;
              if (currentVal && !currentVal.endsWith(' ')) {
                // Use execCommand which Yamli responds to
                el.focus();
                const worked = document.execCommand('insertText', false, ' ');
                if (!worked) {
                  el.value = currentVal + ' ';
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                }
                console.log(`[Yamli ${e.key.toUpperCase()} INTERCEPT] ${id.replace('yamli-item-', '')}: execCommand=${worked} →`, el.value);

                // Read converted value AFTER Yamli processes
                setTimeout(() => {
                  const convertedVal = el.value.trimEnd();
                  const field = id.replace('yamli-item-', '');
                  console.log(`[Yamli ${e.key.toUpperCase()} AFTER] ${field}:`, convertedVal);
                  convertedValuesRef.current = {
                    ...convertedValuesRef.current,
                    [field]: convertedVal,
                  };
                  setForm(prev => ({ ...prev, [field]: convertedVal }));
                }, 80);
              }
            }
          };

          const handleMouseDownBeforeBlur = (e) => {
            if (document.activeElement === el && e.target !== el) {
              const currentVal = el.value;
              if (currentVal && !currentVal.endsWith(' ')) {
                el.focus();
                const worked = document.execCommand('insertText', false, ' ');
                if (!worked) {
                  el.value = currentVal + ' ';
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                }
                console.log(`[Yamli CLICK INTERCEPT] ${id.replace('yamli-item-', '')}: execCommand=${worked} →`, el.value);

                // Read converted value AFTER Yamli processes
                setTimeout(() => {
                  const convertedVal = el.value.trimEnd();
                  const field = id.replace('yamli-item-', '');
                  console.log(`[Yamli CLICK AFTER] ${field}:`, convertedVal);
                  convertedValuesRef.current = {
                    ...convertedValuesRef.current,
                    [field]: convertedVal,
                  };
                  setForm(prev => ({ ...prev, [field]: convertedVal }));
                }, 80);
              }
            }
          };

          document.addEventListener('keydown', handleKeyBeforeBlur, true);
          document.addEventListener('mousedown', handleMouseDownBeforeBlur, true);

          // Capture focusout: save converted value (with delay for Yamli to finish)
          // This is a FALLBACK - the primary save happens in intercept handlers
          const handleFocusOutCapture = () => {
            const field = id.replace('yamli-item-', '');
            // Wait for Yamli to finish converting after intercept
            setTimeout(() => {
              const convertedVal = el?.value.trimEnd() || '';
              console.log(`[Yamli FOCUSOUT CAPTURE] ${field}:`, {
                domAtFocusout: convertedVal,
                refAlreadyHas: convertedValuesRef.current[field],
              });
              // Only save to ref if not already saved by intercept handler
              if (!convertedValuesRef.current[field]) {
                convertedValuesRef.current = {
                  ...convertedValuesRef.current,
                  [field]: convertedVal,
                };
                setForm(prev => ({ ...prev, [field]: convertedVal }));
              }
            }, 100);
          };

          el.addEventListener('focusout', handleFocusOutCapture, true);

          if (!window.__yamliDebugListeners) window.__yamliDebugListeners = [];
          window.__yamliDebugListeners.push({
            el,
            keyHandler: handleKeyBeforeBlur,
            mouseHandler: handleMouseDownBeforeBlur,
            focusHandler: handleFocusOutCapture,
          });
        });
      }
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const handleFieldBlur = useCallback((field) => (e) => {
    const inputEl = e.target;
    const currentValue = inputEl.value;
    console.log(`[Yamli BLUR] ${field} - before:`, {
      domBefore: currentValue,
      endsWithSpace: currentValue.endsWith(' '),
    });

    if (currentValue && !currentValue.endsWith(' ')) {
      inputEl.value = currentValue + ' ';
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Read converted value from DOM after Yamli processes
    // BUT: don't update ref here — let FOCUSOUT CAPTURE handle it (with delay)
    setTimeout(() => {
      const convertedValue = inputEl.value.trimEnd();
      console.log(`[Yamli BLUR] ${field} - after:`, {
        domAfter: convertedValue,
        converted: convertedValue !== currentValue.trimEnd(),
      });
      // DON'T update ref here — FOCUSOUT CAPTURE handles it
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

    console.log('[Yamli SAVE]', {
      fromRef: cv,
      fromState: { title: form.title, edition: form.edition },
      willSave: { title, edition: cv.edition || form.edition },
    });

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
        // Reset form but preserve call_number, language_name, classification, topics
        setForm({
          ...EMPTY_FORM,
          item_code: form.item_code,
          call_number: cv.call_number || form.call_number || "",
          language_name: cv.language_name || form.language_name || "",
          classification: cv.classification || form.classification || "",
          topics: cv.topics || form.topics || "",
        });
        convertedValuesRef.current = {
          ...EMPTY_FORM,
          call_number: cv.call_number || "",
          language_name: cv.language_name || "",
          classification: cv.classification || "",
          topics: cv.topics || "",
        };
        setMode("new");
      } else {
        // Save converted values for restore
        setFormBeforeEdit({ ...cv, item_code: form.item_code });
        const created = await create(cleanForm);
        toast("Item saved successfully", { type: "success" });
        addToFormHistory({ ...cleanForm, id: created.id || null });
        // Reset form but preserve call_number, language_name, classification, topics
        setForm({
          ...EMPTY_FORM,
          item_code: form.item_code,
          call_number: cv.call_number || form.call_number || "",
          language_name: cv.language_name || form.language_name || "",
          classification: cv.classification || form.classification || "",
          topics: cv.topics || form.topics || "",
        });
        convertedValuesRef.current = {
          ...EMPTY_FORM,
          call_number: cv.call_number || "",
          language_name: cv.language_name || "",
          classification: cv.classification || "",
          topics: cv.topics || "",
        };
      }
      // Auto-generate random QR after submit if enabled
      if (autoRandom) {
        const randomQR = `QR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        setTimeout(() => processScan(randomQR), 200);
      } else {
        setTimeout(() => scannerInputRef.current?.focus(), 100);
      }
    } catch (err) {
      const msg = err.response?.status === 409 ? "This item code already exists" : "Failed to save item";
      toast(msg, { type: "error" });
    }
  };

  const handleReset = () => {
    const preservedFields = {
      call_number: convertedValuesRef.current.call_number || form.call_number || "",
      language_name: convertedValuesRef.current.language_name || form.language_name || "",
      classification: convertedValuesRef.current.classification || form.classification || "",
      topics: convertedValuesRef.current.topics || form.topics || "",
    };
    setForm({ ...EMPTY_FORM, item_code: form.item_code, ...preservedFields });
    convertedValuesRef.current = { ...EMPTY_FORM, ...preservedFields };
    setMode("new");
  };

  const handleRestore = () => {
    if (formBeforeEdit) {
      console.log('[Yamli RESTORE]', {
        restoring: formBeforeEdit,
        currentItemCode: form.item_code,
      });
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
          autoRandom={autoRandom}
          onAutoRandomChange={(e) => setAutoRandom(e.target.checked)}
        />
        <FormPanel
          mode={mode}
          form={form}
          setForm={setForm}
          loading={loading}
          onSave={handleSave}
          onReset={handleReset}
          onRestore={handleRestore}
          showRestore={!!formBeforeEdit}
          handleFieldBlur={handleFieldBlur}
        />
      </div>
    </div>
  );
}

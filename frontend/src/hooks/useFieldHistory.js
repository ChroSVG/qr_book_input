import { useState, useCallback, useEffect, useRef } from "react";

const MAX_FIELD_HISTORY = 20;
const FIELD_HISTORY_KEY = "scanpage_field_history";

function getFieldHistory() {
  try {
    const raw = localStorage.getItem(FIELD_HISTORY_KEY);
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
  localStorage.setItem(FIELD_HISTORY_KEY, JSON.stringify(history));
}

function getFieldHistoryValues(fieldName) {
  const history = getFieldHistory();
  return history[fieldName] || [];
}

export function useFieldHistory(fieldName) {
  const [history, setHistory] = useState(() => getFieldHistoryValues(fieldName));
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const addToHistory = useCallback((value) => {
    addToFieldHistory(fieldName, value);
    setHistory(getFieldHistoryValues(fieldName));
  }, [fieldName]);

  const clearHistory = useCallback(() => {
    const history = getFieldHistory();
    delete history[fieldName];
    localStorage.setItem(FIELD_HISTORY_KEY, JSON.stringify(history));
    setHistory([]);
    setShowDropdown(false);
  }, [fieldName]);

  useEffect(() => {
    setHistory(getFieldHistoryValues(fieldName));
  }, [fieldName]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return { history, showDropdown, setShowDropdown, addToHistory, clearHistory, wrapperRef };
}

// Re-export helper functions for direct access
export { getFieldHistory, getFieldHistoryValues, addToFieldHistory };

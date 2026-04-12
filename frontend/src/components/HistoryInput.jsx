import { useCallback } from "react";
import { useFieldHistory } from "../hooks/useFieldHistory";
import { Input } from "../ui";

export default function HistoryInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  fieldName,
  className = ""
}) {
  const { history, showDropdown, setShowDropdown, addToHistory, clearHistory, wrapperRef } = useFieldHistory(fieldName);

  const handleSelect = useCallback((val) => {
    onChange({ target: { value: val } });
    setShowDropdown(false);
    addToHistory(val);
    setTimeout(() => {
      const input = document.getElementById(id);
      input?.focus();
    }, 10);
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

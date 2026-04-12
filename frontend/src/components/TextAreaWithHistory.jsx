import { useState, useCallback } from "react";
import { Input } from "../ui";
import { addToFieldHistory, getFieldHistoryValues } from "../hooks/useFieldHistory";

export default function TextAreaWithHistory({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  fieldName,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const history = getFieldHistoryValues(fieldName);

  const handleClearHistory = useCallback(() => {
    const fieldHistory = getFieldHistoryValues(fieldName);
    const historyObj = JSON.parse(localStorage.getItem("scanpage_field_history") || "{}");
    delete historyObj[fieldName];
    localStorage.setItem("scanpage_field_history", JSON.stringify(historyObj));
    setShowDropdown(false);
  }, [fieldName]);

  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        onBlur={(e) => {
          if (e.target.value) addToFieldHistory(fieldName, e.target.value);
          onBlur?.(e);
        }}
        onFocus={() => history.length > 0 && setShowDropdown(true)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-20"
        placeholder={placeholder}
      />
      {history.length > 0 && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            📝 {showDropdown ? "Hide" : "Show"} recent ({history.length})
          </button>
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500">Recent {fieldName === "description" ? "Descriptions" : "Extra Info"}</span>
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
              <ul className="max-h-40 overflow-y-auto">
                {history.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      onChange({ target: { value: item } });
                      setShowDropdown(false);
                      addToFieldHistory(fieldName, item);
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
      )}
    </div>
  );
}

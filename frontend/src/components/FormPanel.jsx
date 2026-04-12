import { useCallback, useRef, useEffect } from "react";
import { Button, Card } from "../ui";
import HistoryInput from "./HistoryInput";
import FormFields from "./FormFields";

export default function FormPanel({
  mode,
  form,
  setForm,
  loading,
  formHistory,
  showHistory,
  setShowHistory,
  itemCodeWrapperRef,
  onSave,
  onHistorySelect,
  onClearHistory,
  onReset,
  onRestore,
  showRestore,
  handleFieldBlur,
}) {
  return (
    <Card className="p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {mode === "edit" ? "Edit Item" : "New Item"}
        </h2>
        {showRestore && (
          <Button type="button" variant="outline" size="sm" onClick={onRestore}>
            ↩ Restore
          </Button>
        )}
        {/* Debug: uncomment to check state */}
        {/* <span className="text-xs text-gray-400">showRestore: {String(showRestore)}</span> */}
      </div>

      <form onSubmit={onSave} className="space-y-4">
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
            <HistoryInput
              id="yamli-item-item_code"
              value={form.item_code}
              onChange={(e) => setForm({ ...form, item_code: e.target.value })}
              onFocus={() => formHistory.length > 0 && setShowHistory(true)}
              placeholder="Item code (scanned) *"
              fieldName="item_code"
            />
          </div>

          {/* Form History Dropdown */}
          {showHistory && formHistory.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500">Recent Forms</span>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {formHistory.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => onHistorySelect(item)}
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

        {/* All other form fields */}
        <FormFields form={form} setForm={setForm} handleFieldBlur={handleFieldBlur} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} className="flex-1">
            {mode === "edit" ? "Update Item" : "Save Item"}
          </Button>
          {showRestore && (
            <Button type="button" variant="secondary" onClick={onRestore}>
              ↩ Restore
            </Button>
          )}
          {mode === "edit" && (
            <Button type="button" variant="secondary" onClick={onReset}>
              New
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

import { useCallback, useRef, useEffect } from "react";
import { Button, Card } from "../ui";
import HistoryInput from "./HistoryInput";
import FormFields from "./FormFields";

export default function FormPanel({
  mode,
  form,
  setForm,
  loading,
  onSave,
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
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Item Code *
          </label>
          <HistoryInput
            id="yamli-item-item_code"
            value={form.item_code}
            onChange={(e) => setForm({ ...form, item_code: e.target.value })}
            placeholder="Item code (scanned) *"
            fieldName="item_code"
          />
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

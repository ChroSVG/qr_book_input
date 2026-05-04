import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Double-click to edit table cell content. Saves on blur or Enter.
 * 
 * @param {{ value: string; onSave: (value: string) => void; width: number }} props
 */
export default function EditableCell({ value, onSave, width }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(value ?? "");
    setEditing(false);
  }, [value]);

  // Use the width to ensure the container doesn't overflow its parent TableCell
  // We subtract a bit to account for TableCell padding (p-2 = 8px each side)
  const containerStyle = { width: width ? width - 16 : "100%", maxWidth: width ? width - 16 : "100%" };

  if (editing) {
    return (
      <div style={containerStyle}>
        <input
          ref={inputRef}
          className="w-full border border-blue-400 rounded text-sm outline-none focus:ring-2 focus:ring-blue-200 bg-white px-1 py-0.5"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { e.preventDefault(); cancel(); }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="text-sm text-gray-700 cursor-pointer hover:bg-blue-50/30 transition-colors group flex items-center justify-between gap-1 h-7"
      style={containerStyle}
      onDoubleClick={() => setEditing(true)}
    >
      <span className={`block overflow-hidden text-ellipsis whitespace-nowrap ${!draft ? "text-gray-300 italic" : ""}`}>
        {draft || "—"}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded hover:bg-blue-200 focus:outline-none focus:opacity-100 shrink-0"
        onClick={(e) => {
          e.stopPropagation(); // Prevent dblclick on row if any
          setEditing(true);
        }}
        tabIndex={-1}
      >
        Edit
      </button>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Double-click to edit table cell. Saves on blur or Enter.
 * Width is controlled by the width prop (pixel) — identical in both modes.
 * Long text in display mode shows ellipsis via overflow-hidden.
 *
 * Keyboard navigation:
 *   Enter  → save
 *   Escape → cancel
 *   Tab    → next cell (auto-focus)
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

  // Shared td style & classes — identical in both modes
  const tdStyle = { width, maxWidth: width };
  const tdClass = "px-2 py-3 whitespace-nowrap";

  if (editing) {
    return (
      <td className={tdClass} style={tdStyle}>
        <input
          ref={inputRef}
          className="w-full border border-blue-400 rounded text-sm outline-none focus:ring-2 focus:ring-blue-200 bg-transparent px-1 py-0.5"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { e.preventDefault(); cancel(); }
          }}
        />
      </td>
    );
  }

  return (
    <td
      className={tdClass + " text-sm text-gray-700 cursor-pointer hover:bg-blue-50/30 transition-colors group"}
      style={tdStyle}
      onDoubleClick={() => setEditing(true)}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={`block overflow-hidden text-ellipsis ${!draft ? "text-gray-300 italic" : ""}`}>{draft || "—"}</span>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded hover:bg-blue-200 focus:outline-none focus:opacity-100 shrink-0"
          onClick={() => setEditing(true)}
          tabIndex={-1}
        >
          Edit
        </button>
      </div>
    </td>
  );
}

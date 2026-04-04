import { useState, useEffect, useCallback } from "react";

/**
 * Double-click to edit table cell. Saves on blur or Enter.
 * @param {{ value: string; onSave: (value: string) => void }} props
 */
export default function EditableCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(value ?? "");
    setEditing(false);
  }, [value]);

  if (editing) {
    return (
      <td className="p-4 bg-blue-50/50">
        <input
          className="w-full border-2 border-blue-400 px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
        />
      </td>
    );
  }

  return (
    <td
      className="p-4 text-sm text-gray-700 cursor-pointer hover:bg-blue-50/30 transition-colors group"
      onDoubleClick={() => setEditing(true)}
    >
      <div className="flex items-center justify-between">
        <span className={!draft ? "text-gray-300 italic" : ""}>{draft || "—"}</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
          Edit
        </span>
      </div>
    </td>
  );
}

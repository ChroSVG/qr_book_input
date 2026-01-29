import React, { useState, useEffect } from "react";

export default function EditableCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => { setVal(value); }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  return (
    <td 
      className={`p-4 text-sm transition-all duration-300 group relative ${
        editing ? 'bg-blue-50/50' : 'hover:bg-blue-50/30 cursor-pointer'
      }`} 
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            className="w-full border-2 border-blue-400 p-2 rounded-xl shadow-lg outline-none focus:ring-4 focus:ring-blue-100 bg-white text-gray-700 font-medium animate-in fade-in zoom-in duration-200"
            value={val || ""}
            autoFocus
            onChange={(e) => setVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setVal(value);
                setEditing(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between min-h-[40px]">
          <span className={`leading-relaxed ${!val ? "text-gray-300 italic" : "text-gray-700 font-medium"}`}>
            {val || "Kosong"}
          </span>
          
          {/* Indikator Edit yang muncul saat hover */}
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </div>
        </div>
      )}
    </td>
  );
}
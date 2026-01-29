import React, { useEffect } from "react";

export function Toast({ msg, type = "info", onClose }) {
  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => onClose(), 2000);
    return () => clearTimeout(timer);
  }, [msg, onClose]);

  if (!msg) return null;
  const bg = type === "error" ? "bg-red-600" : "bg-green-600";

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${bg} text-white px-5 py-3 rounded-lg shadow-xl transition-opacity duration-300`} role="alert">
      <div className="flex items-center gap-4">
        <div>{msg}</div>
        <button onClick={onClose} className="font-semibold hover:underline">Tutup</button>
      </div>
    </div>
  );
}
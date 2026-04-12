import { useRef, useCallback } from "react";
import QrScanner from "./QrScanner";
import { Input } from "../ui";

export default function ScannerPanel({
  lastScanned,
  onScan,
  onScannerInputChange,
  onScannerInputKeyDown,
  onRandomClick,
}) {
  const scannerInputRef = useRef(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="text-sm text-gray-500 mt-1">Point your camera at a QR code or use a handheld scanner.</p>
      </div>

      <div className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-white">
        <QrScanner onScan={onScan} cooldownMs={2000} />
      </div>

      {lastScanned && (
        <div className="text-xs text-center text-gray-500">
          Last scanned: <code className="bg-gray-100 px-2 py-0.5 rounded">{lastScanned.slice(0, 20)}...</code>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          ref={scannerInputRef}
          placeholder="Type or paste item code..."
          onChange={onScannerInputChange}
          onKeyDown={onScannerInputKeyDown}
          autoComplete="off"
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => {
            const randomQR = `QR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            if (scannerInputRef.current) {
              scannerInputRef.current.value = randomQR;
            }
            onRandomClick(randomQR);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          title="Generate random item code"
        >
          🎲 Random
        </button>
      </div>
    </div>
  );
}

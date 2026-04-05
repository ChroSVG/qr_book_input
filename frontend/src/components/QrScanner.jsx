import { useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

/**
 * @param {{
 *   onScan: (decoded: string) => void;
 *   facingMode?: "user" | "environment";
 *   className?: string;
 * }} props
 */
export default function QrScanner({ onScan, facingMode = "environment", className = "" }) {
  const elIdRef = useRef(`qr-${Math.random().toString(36).slice(2, 9)}`);
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const cleanup = useCallback(() => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    const state = scanner.getState();
    if (state !== Html5QrcodeScannerState.NOT_STARTED) {
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(elIdRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode },
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decoded) => {
            const text = typeof decoded === "string" ? decoded : decoded.decodedText || decoded.text || "";
            if (mounted && text) onScanRef.current(text);
          }
        );
      } catch (err) {
        console.error("QR scanner error:", err);
      }
    };

    start();
    return () => { mounted = false; cleanup(); };
  }, [facingMode, cleanup]);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden rounded-2xl ${className}`}>
      <div id={elIdRef.current} className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
      {/* Scanner overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-56 h-56 border-2 border-white/50 rounded-2xl relative overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
          <div className="absolute w-full h-0.5 bg-blue-500 shadow-[0_0_12px_#3b82f6] top-0 animate-[scan_2s_linear_infinite]" />
        </div>
      </div>
      <style>{`@keyframes scan { 0% { top: 0% } 100% { top: 100% } }`}</style>
    </div>
  );
}

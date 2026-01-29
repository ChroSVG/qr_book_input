import React, { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

export default function QrScanner({ onScan, facingMode = "environment", onError }) {
  const elIdRef = useRef(`qr-scanner-${Math.random().toString(36).slice(2, 9)}`);
  const scannerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(elIdRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode },
          { 
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
          },
          (decoded) => {
            if (isMounted) onScan(decoded);
          }
        );
      } catch (err) {
        if (isMounted) {
          console.error("Scanner failed:", err);
          onError?.(err);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        const currentState = scannerRef.current.getState();
        if (currentState !== Html5QrcodeScannerState.NOT_STARTED) {
          scannerRef.current.stop()
            .then(() => scannerRef.current?.clear())
            .catch(err => console.warn("Cleanup warning:", err));
        }
      }
    };
  }, [onScan, facingMode, onError]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div id={elIdRef.current} className="w-full h-full [&_video]:object-cover" />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-blue-500 rounded-lg relative overflow-hidden shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
          <div className="absolute w-full h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] top-0 animate-[scan_2s_linear_infinite]" />
        </div>
      </div>
      <style>{`@keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }`}</style>
    </div>
  );
}
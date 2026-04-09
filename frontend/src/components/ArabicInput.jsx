import { useEffect, useRef, useCallback } from "react";

// Load Yamli SDK once globally
let yamliLoaded = false;
let yamliLoading = false;
const yamliCallbacks = [];

const loadYamliSDK = () => {
  if (yamliLoaded) return Promise.resolve();
  if (yamliLoading) return new Promise(resolve => yamliCallbacks.push(resolve));

  yamliLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "//api.yamli.com/js/yamli_api.js";
    script.async = true;
    script.onload = () => {
      yamliLoaded = true;
      yamliLoading = false;
      if (typeof Yamli === "object" && Yamli.init) {
        Yamli.init();
      }
      yamliCallbacks.forEach(cb => cb());
      yamliCallbacks.length = 0;
      resolve();
    };
    script.onerror = () => {
      yamliLoading = false;
      reject(new Error("Failed to load Yamli SDK"));
    };
    document.body.appendChild(script);
  });
};

/**
 * ArabicInput component using official Yamli SDK
 * 
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   placeholder?: string;
 *   className?: string;
 *   disabled?: boolean;
 *   id?: string;
 *   label?: string;
 * }} props
 */
export default function ArabicInput({
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  id,
  label
}) {
  const uniqueId = useRef(id || `yamli-${Math.random().toString(36).slice(2, 10)}`);
  const isYamliActive = useRef(false);
  const yamliEnabled = useRef(false);

  const toggleYamli = useCallback(async () => {
    isYamliActive.current = !isYamliActive.current;
    
    try {
      if (!yamliLoaded) {
        await loadYamliSDK();
      }

      if (isYamliActive.current) {
        // Enable Yamli on this input
        if (typeof Yamli !== "undefined" && Yamli.yamlify) {
          Yamli.yamlify(uniqueId.current, {
            startMode: "on",
            settingsPlacement: "inside",
            generateOnChangeEvent: true,
            uiLanguage: "en"
          });
          yamliEnabled.current = true;
        }
      } else {
        // Disable Yamli on this input
        if (typeof Yamli !== "undefined" && Yamli.deyamlify) {
          Yamli.deyamlify(uniqueId.current);
          yamliEnabled.current = false;
        }
      }
      
      // Force re-render
      onChange(value);
    } catch (err) {
      console.error("Yamli toggle error:", err);
    }
  }, [value, onChange]);

  // Initialize Yamli on mount
  useEffect(() => {
    let mounted = true;

    const initYamli = async () => {
      try {
        if (!yamliLoaded) {
          await loadYamliSDK();
        }
        
        if (!mounted) return;
        
        // Don't auto-enable, wait for user to toggle
      } catch (err) {
        console.error("Failed to load Yamli SDK:", err);
      }
    };

    initYamli();

    return () => {
      mounted = false;
      // Cleanup Yamli on unmount
      if (typeof Yamli !== "undefined" && Yamli.deyamlify) {
        Yamli.deyamlify(uniqueId.current);
      }
    };
  }, []);

  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label}
        </label>
      )}

      {/* Yamli toggle button */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <button
          type="button"
          onClick={toggleYamli}
          disabled={disabled}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all shadow-sm ${
            isYamliActive.current
              ? "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title={isYamliActive.current ? "Disable Arabic input (Yamli)" : "Enable Arabic input (Yamli)"}
        >
          <span className="flex items-center gap-1">
            <span className="text-sm">{isYamliActive.current ? "عربي" : "🔤"}</span>
          </span>
        </button>
      </div>

      {/* Input field */}
      <input
        type="text"
        id={uniqueId.current}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        dir={isYamliActive.current ? "rtl" : "ltr"}
        className={`w-full border rounded-xl px-4 py-2.5 pr-20 text-sm outline-none transition-all ${
          isYamliActive.current
            ? "border-blue-400 bg-blue-50/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            : "border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        style={{
          fontFamily: isYamliActive.current ? "'Noto Sans Arabic', 'Segoe UI', 'Arial', sans-serif" : "inherit",
          fontSize: isYamliActive.current ? "1.05em" : "inherit"
        }}
      />

      {/* Active indicator badge */}
      {isYamliActive.current && (
        <div className="absolute -top-2.5 left-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full shadow-sm">
          Yamli Active
        </div>
      )}
    </div>
  );
}

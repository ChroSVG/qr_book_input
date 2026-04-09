import { useState, useCallback, useRef, useEffect } from "react";

/**
 * ArabicInput component with Yamli transliteration support
 * Converts Arabizi (Latin + numbers) to Arabic text
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
  const [isYamliActive, setIsYamliActive] = useState(false);
  const [preview, setPreview] = useState("");
  const inputRef = useRef(null);
  const transliterationTimeout = useRef(null);

  // Arabizi to Arabic mapping
  const arabiziMap = {
    // Numbers (common in Arabizi)
    '2': 'أ', '3': 'ع', '5': 'خ', '6': 'ط', '7': 'ح', '8': 'ق', '9': 'ق', '0': 'ة',
    // Consonants
    'a': 'ا', 'b': 'ب', 'd': 'د', 'f': 'ف', 'g': 'ج', 'h': 'ه', 'j': 'ج', 
    'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'p': 'ب', 'q': 'ق', 'r': 'ر',
    's': 'س', 't': 'ت', 'v': 'ف', 'w': 'و', 'x': 'ش', 'y': 'ي', 'z': 'ز',
    // Vowels and special chars
    'e': 'ي', 'i': 'ي', 'o': 'و', 'u': 'و', 'c': 'ص',
    // Multi-character patterns (must be processed first)
    'sh': 'ش', 'th': 'ث', 'dh': 'ذ', 'kh': 'خ', 'gh': 'غ',
    'aa': 'آ', 'ee': 'ي', 'ou': 'و', 'ai': 'اي', 'au': 'او'
  };

  const transliterateToArabic = useCallback((text) => {
    if (!text) return text;

    let result = text.toLowerCase();
    
    // Replace multi-character patterns first (longer matches)
    const multiCharPatterns = ['sh', 'th', 'dh', 'kh', 'gh', 'aa', 'ee', 'ou', 'ai', 'au'];
    multiCharPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      result = result.replace(regex, arabiziMap[pattern]);
    });

    // Replace single characters and numbers
    const chars = result.split('');
    result = chars.map(char => {
      return arabiziMap[char] || char;
    }).join('');

    return result;
  }, []);

  const handleChange = useCallback((e) => {
    const rawValue = e.target.value;
    
    // Clear previous timeout
    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    if (isYamliActive) {
      // Show preview while typing
      const transliterated = transliterateToArabic(rawValue);
      setPreview(transliterated);
      
      // Debounce actual value update (500ms)
      transliterationTimeout.current = setTimeout(() => {
        onChange(transliterated);
        setPreview("");
      }, 500);
    } else {
      onChange(rawValue);
      setPreview("");
    }
  }, [isYamliActive, transliterateToArabic, onChange]);

  const toggleYamli = useCallback(() => {
    setIsYamliActive(prev => {
      const newState = !prev;
      if (!newState) {
        setPreview("");
      }
      return newState;
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transliterationTimeout.current) {
        clearTimeout(transliterationTimeout.current);
      }
    };
  }, []);

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
            isYamliActive
              ? "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title={isYamliActive ? "Disable Arabic input (Yamli)" : "Enable Arabic input (Yamli)"}
        >
          <span className="flex items-center gap-1">
            <span className="text-sm">{isYamliActive ? "عربي" : "🔤"}</span>
          </span>
        </button>
      </div>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || (isYamliActive ? "اكتب بالعربي أو بالإنجليزي (مثال: marhaban)" : placeholder)}
        disabled={disabled}
        dir={isYamliActive ? "rtl" : "ltr"}
        className={`w-full border rounded-xl px-4 py-2.5 pr-20 text-sm outline-none transition-all ${
          isYamliActive
            ? "border-blue-400 bg-blue-50/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            : "border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        style={{
          fontFamily: isYamliActive ? "'Noto Sans Arabic', 'Segoe UI', 'Arial', sans-serif" : "inherit",
          fontSize: isYamliActive ? "1.05em" : "inherit"
        }}
      />

      {/* Preview tooltip showing Arabic transliteration */}
      {preview && isYamliActive && (
        <div className="absolute -bottom-10 left-0 right-0 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-3 py-2 text-sm">
          <div className="text-xs text-blue-600 font-medium mb-0.5">Preview:</div>
          <div className="text-blue-800 text-right font-medium" dir="rtl">
            {preview}
          </div>
        </div>
      )}

      {/* Active indicator badge */}
      {isYamliActive && (
        <div className="absolute -top-2.5 left-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full shadow-sm">
          Yamli Active
        </div>
      )}
    </div>
  );
}

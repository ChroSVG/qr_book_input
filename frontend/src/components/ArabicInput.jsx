/**
 * ArabicInput component using official Yamli CDN
 * Simple and fast integration following Yamli setup guide
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
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label}
        </label>
      )}

      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        dir="auto"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}

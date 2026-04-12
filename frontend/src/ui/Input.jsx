import React from "react";

/**
 * @param {{
 *   value?: string;
 *   onChange?: (e) => void;
 *   placeholder?: string;
 *   type?: string;
 *   disabled?: boolean;
 *   error?: string;
 *   className?: string;
 *   readOnly?: boolean;
 * } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export function Input({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  error,
  className = "",
  readOnly = false,
  ...props
}) {
  return (
    <div className="w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`
          w-full px-4 py-2.5 rounded-xl border text-sm
          transition-all duration-150 outline-none
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          }
          ${readOnly ? "bg-gray-50 text-gray-400 cursor-default" : "bg-white text-gray-900"}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

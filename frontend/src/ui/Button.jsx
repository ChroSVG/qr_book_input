import React from "react";

const VARIANTS = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-200",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-200",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200",
  outline: "bg-transparent border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

/**
 * @param {{
 *   children: React.ReactNode;
 *   variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
 *   size?: 'sm' | 'md' | 'lg';
 *   disabled?: boolean;
 *   loading?: boolean;
 *   onClick?: () => void;
 *   type?: 'button' | 'submit' | 'reset';
 *   className?: string;
 * }} props
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl
        transition-all duration-150 active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

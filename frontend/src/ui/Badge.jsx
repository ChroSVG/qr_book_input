export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

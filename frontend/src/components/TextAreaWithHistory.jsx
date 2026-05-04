export default function TextAreaWithHistory({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  fieldName,
}) {
  // History feature disabled — simple textarea wrapper
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-20"
      placeholder={placeholder}
    />
  );
}

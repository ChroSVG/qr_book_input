import { useCallback } from "react";
import { Input } from "../ui";

export default function HistoryInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  fieldName,
  className = ""
}) {
  // History feature disabled — simple input wrapper
  return (
    <Input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

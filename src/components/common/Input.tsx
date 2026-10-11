import React, { FC } from "react";

export interface InputProps {
  value: string | number;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
  title?: string;
}

export const Input: FC<InputProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "",
  type = "text",
  title
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    title={title}
    className={`bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors ${className}`}
  />
);

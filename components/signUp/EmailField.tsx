import * as React from "react";

interface EmailFieldProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function EmailField({
  name,
  value,
  onChange,
  placeholder = "@example.google.co",
  required = false,
  className = ""
}: EmailFieldProps) {
  return (
    <div className={`w-full ${className}`}>
      <label htmlFor={name} className="block text-gray-300 text-sm font-medium mb-2">
        Correo electrónico
      </label>
      <input
        type="email"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-base transition-all duration-200"
      />
    </div>
  );
}

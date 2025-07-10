// components/singUp/EmailField.tsx
import * as React from "react";

/**
 * @typedef {Object} EmailFieldProps
 * @property {string} name
 * @property {string} value
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange
 * @property {string} [placeholder]
 * @property {boolean} [required]
 * @property {string} [className]
 */

/**
 * @param {EmailFieldProps} props
 */
export function EmailField({
  name,
  value,
  onChange,
  placeholder = "@udea.edu.co", // Default placeholder
  required = false,
  className = ""
}) {
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

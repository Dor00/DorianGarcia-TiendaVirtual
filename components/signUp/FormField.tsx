// components/signUp/FormField.tsx
import * as React from "react";

interface FormFieldProps {
  label: string;
  type?: string; // Podría ser 'text', 'password', 'file', 'select'
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; // Aceptar ChangeEvent para HTMLSelectElement
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  options?: { value: string; label: string }[]; // Nuevo: para campos de tipo 'select'
}

export function FormField({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  required = false,
  minLength,
  className = "",
  options, // Recibir las opciones
}: FormFieldProps) {
  const commonClasses = "w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-base transition-all duration-200";

  return (
    <div className={`w-full ${className}`}>
      <label htmlFor={name} className="block text-gray-300 text-sm font-medium mb-2">
        {label}
      </label>
      {type === "select" && options ? ( // Renderizar select si type es 'select' y hay opciones
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`${commonClasses} appearance-none cursor-pointer`} // Añadido appearance-none y cursor-pointer para el estilo del select
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : ( // Renderizar input para otros tipos
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className={commonClasses}
        />
      )}
    </div>
  );
}

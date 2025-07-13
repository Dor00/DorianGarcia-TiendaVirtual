// components/signUp/EmailField.tsx
"use client";

interface EmailFieldProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

export function EmailField({
  name,
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  autoComplete = "email"
}: EmailFieldProps) {
  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-gray-300 text-sm mb-2">
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
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full p-3 bg-gray-700 bg-opacity-70 border border-gray-600 rounded-md text-white
          placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
      />
    </div>
  );
}
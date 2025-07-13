// components/signUp/FormField.tsx
"use client";

interface FormFieldProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  autoComplete?: string;
  options?: { value: string; label: string }[];
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
  disabled = false,
  autoComplete,
  options = []
}: FormFieldProps) {
  const commonClasses = "w-full p-3 bg-gray-700 bg-opacity-70 border border-gray-600 rounded-md text-white " +
    "placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50";

  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-gray-300 text-sm mb-2">
        {label}
      </label>
      
      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${commonClasses} cursor-pointer`}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          disabled={disabled}
          autoComplete={autoComplete}
          className={commonClasses}
        />
      )}
    </div>
  );
}
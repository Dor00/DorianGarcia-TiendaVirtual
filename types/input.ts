// En un archivo de tipos compartido, ej. src/types/input.ts o al inicio de cada archivo .js/.ts
// si no vas a reusar las interfaces globalmente.
// Si son .js files, esto es solo para referencia conceptual.

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string; // Para el contenedor div exterior
  inputClassName?: string; // Para el input interior si necesitas más control
}

// No necesitas extender InputProps si solo vas a usar InputProps directamente.
// Pero si quisieras props específicas para email/password, lo harías:
// interface EmailInputProps extends InputProps { /* alguna prop específica para email */ }
// interface PasswordInputProps extends InputProps { /* alguna prop específica para password */ }
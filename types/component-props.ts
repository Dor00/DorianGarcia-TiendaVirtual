// src/types/component-props.ts
import React from 'react';

export interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string; // Para el contenedor div exterior
  inputClassName?: string; // Para el input interior si necesitas más control
}



export interface LoginButtonProps {
  type?: "button" | "submit" | "reset"; // 'type' es opcional y puede ser uno de estos valores
  disabled?: boolean; // 'disabled' es opcional y booleano
  children: React.ReactNode; // 'children' es el contenido del botón
  className?: string; // Por si quieres añadir clases extra
}
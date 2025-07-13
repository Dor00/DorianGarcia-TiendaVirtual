// components/dashboard/SearchInput.jsx
"use client";
import * as React from "react";

interface SearchInputProps {
  placeholder?: string;
  className?: string; // Para aplicar clases adicionales desde el padre
}

export function SearchInput({
  placeholder = "Buscar...",
  className = "",
}: SearchInputProps) {
  return (
    // El div exterior manejará el ancho y el posicionamiento (si es necesario)
    // Ya no necesita 'relative' aquí si el input y el icono están dentro del flujo normal.
    <div className={`relative flex items-center h-[60px] border border-black border-solid rounded-md overflow-hidden ${className}`}>
      {/* Icono de búsqueda - si lo necesitas */}
      {/* Si tienes un icono de búsqueda (como la lupa), lo pondrías aquí */}
      {/* <img src="/ruta/a/tu/icono-busqueda.svg" alt="Buscar" className="w-5 h-5 ml-3" /> */}

      {/* Este es el input real donde el usuario escribirá */}
      <input
        type="text"
        placeholder={placeholder}
        // w-full para que ocupe todo el ancho disponible dentro del contenedor flex
        // p-2 o pl-3, pr-3 para un padding interno
        // text-black text-opacity-60 para el estilo del texto
        // outline-none para quitar el borde de enfoque por defecto
        className="flex-grow h-full px-3 text-lg text-black text-opacity-60 outline-none placeholder-text-black placeholder-opacity-60"
      />

      {/* La etiqueta (label) ya no es necesaria aquí si usas placeholder */}
      {/* <label className="absolute left-3.5 text-2xl h-[45px] text-black text-opacity-60 top-[7px] w-[101px]">
        {placeholder}
      </label> */}
    </div>
  );
}

// components/dashboard/UserAvatar.jsx
"use client";
import * as React from "react";

interface UserAvatarProps {
  initials: string;
  className?: string; // Para aplicar clases adicionales desde el padre (como tamaño)
}

export function UserAvatar({ initials, className = "" }: UserAvatarProps) {
  return (
    // El div principal ahora manejará el tamaño y el fondo del círculo
    // Lo convertimos en un contenedor flex para centrar las iniciales
    <div
      className={`
        flex items-center justify-center
        rounded-full bg-[#81BACF] text-white
        w-10 h-10 text-xl font-light
        md:w-[60px] md:h-[60px] md:text-2xl
        ${className}
      `}
    >
      {/* Ya no necesitamos un SVG insertado con dangerouslySetInnerHTML si usamos clases de Tailwind para el círculo y color */}
      {/* <div
        dangerouslySetInnerHTML={{
          __html:
            '<svg class="user-circle" width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 60px; height: 60px; position: absolute; left: 0px; top: 0px"> <circle cx="30" cy="30" r="30" fill="#81BACF"></circle> </svg>',
        }}
      /> */}

      {/* Las iniciales se centrarán automáticamente por las clases flex del div padre */}
      <span className="max-sm:text-lg"> {/* max-sm:text-lg ya lo tenías */}
        {initials}
      </span>
    </div>
  );
}

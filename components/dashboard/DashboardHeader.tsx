// components/dashboard/DashboardHeader.jsx
"use client";
import * as React from "react";
import { SearchInput } from "./SearchInput";
import { UserAvatar } from "./UserAvatar";

export function DashboardHeader() {
  return (
    <header className="relative h-[88px] w-full bg-white border-b border-solid border-slate-600 border-opacity-60 max-sm:h-[70px]">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 md:px-8">
        {/* Lado Izquierdo: InnoSistemas y > Dashboard */}
       

        {/* Lado Derecho: UdeA, SearchInput, UserAvatar */}
        {/* Usamos flex-grow para que ocupe el espacio restante, y ajustamos el gap */}
        <div className="flex items-center gap-2 max-sm:gap-1 flex-grow justify-end min-w-0"> {/* Ajustes clave aquí */}
          {/* UdeA: Puede necesitar un tamaño de texto aún más pequeño en pantallas muy pequeñas */}
          <div className="text-3xl font-bold text-center text-emerald-800 max-md:text-2xl max-sm:text-base hidden sm:block"> {/* Ocultar UdeA en pantallas muy pequeñas? */}
            UdeA
          </div>

          {/* SearchInput: Ocultar en sm y mostrar en md. */}
          {/* Si `SearchInput` tiene un `min-width` interno, necesitamos anularlo o que sea responsivo. */}
          {/* Agregamos `flex-grow` para que ocupe el espacio disponible pero permitimos que se encoja (`min-w-0`) */}
          <SearchInput className="hidden sm:block flex-grow max-w-[250px]" /> {/* max-w para limitar crecimiento */}

          {/* UserAvatar: Reducir su tamaño en pantallas pequeñas */}
          <UserAvatar
            initials="JP"
            className="flex-shrink-0 max-sm:h-[40px] max-sm:w-[40px]"
          />
        </div>
      </div>
    </header>
  );
}

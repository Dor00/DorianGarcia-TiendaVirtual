// components/head/Header.jsx
import React from "react";

export const Header = () => {
  return (
    // Cambiado bg-white a bg-gray-900 con opacidad. Ajusta la opacidad si es necesario.
    // También ajusté el z-index para asegurarme de que esté por encima del contenido principal, pero debajo del z-index del contenido con imagen.
    <header className="flex items-center justify-between p-4 bg-gray-900 bg-opacity-80 border-b border-solid border-slate-600 border-opacity-60 h-[88px] w-full fixed top-0 left-0 z-20 md:pl-[350px] max-md:p-2.5 max-md:h-auto">
      <h1 className="text-2xl font-extrabold text-white md:text-4xl max-sm:text-xl"> {/* Cambiado texto a blanco para contraste */}
        Tienda Virtual
      </h1>

      <div className="flex items-center space-x-4">
        <div className="text-base font-bold text-blue-400 md:text-3xl max-md:text-xl max-sm:text-base"> {/* Ajustado color para contraste */}
          UdeA
        </div>

        <div className="relative w-[200px] md:w-[321px]">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full h-[40px] md:h-[60px] px-3 text-lg text-white text-opacity-80 bg-gray-700 border border-solid border-gray-600 rounded-md outline-none md:text-2xl" // Ajustado colores de input
          />
        </div>

        <div className="relative w-10 h-10 md:w-[60px] md:h-[60px] flex-shrink-0">
          <div
            dangerouslySetInnerHTML={{
              __html:
                '<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" class="user-circle" style="width: 100%; height: 100%; aspect-ratio: 1/1; fill: #81BACF; position: absolute; left: 0px; top: 0px"> <circle cx="30" cy="30" r="30" fill="#81BACF"></circle> </svg>',
            }}
          />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-light text-white md:text-2xl">
            DG
          </span>
        </div>
      </div>
    </header>
  );
};

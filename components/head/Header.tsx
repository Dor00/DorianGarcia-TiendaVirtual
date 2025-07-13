// components/head/Header.tsx
import React from "react";
import { User } from '@/types'; // Import the shared User interface

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    // Adjusted height, padding-left for smaller sidebar, reduced mobile padding
    <header className="flex items-center justify-between p-3 bg-gray-900 bg-opacity-80 border-b border-solid border-slate-600 border-opacity-60 h-16 md:h-20 lg:h-[88px] w-full fixed top-0 left-0 z-20 md:pl-[300px] lg:pl-[350px] max-sm:p-2 max-sm:h-auto">
      {/* Adjusted font sizes for better responsiveness */}
      <h1 className="text-xl font-extrabold text-white md:text-3xl max-sm:text-lg">
        Tienda Virtual
      </h1>

      {/* Adjusted spacing and item sizes */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Adjusted font sizes */}
        <div className="text-sm font-bold text-blue-400 md:text-xl max-sm:text-xs">
          {user?.nombre ?? "UdeA"}
        </div>

        {/* More flexible width for search input */}
        <div className="relative w-36 md:w-48 lg:w-64 max-w-[200px] md:max-w-[321px] flex-shrink-0">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full h-8 md:h-10 px-2 text-sm text-white text-opacity-80 bg-gray-700 border border-solid border-gray-600 rounded-md outline-none md:text-base"
          />
        </div>

        {/* Smaller user circle */}
        <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
          <div
            dangerouslySetInnerHTML={{
              __html:
                '<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" class="user-circle" style="width: 100%; height: 100%; aspect-ratio: 1/1; fill: #81BACF; position: absolute; left: 0px; top: 0px"> <circle cx="30" cy="30" r="30" fill="#81BACF"></circle> </svg>',
            }}
          />
          {/* Adjusted font size */}
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-light text-white md:text-sm">
            {user?.nombre?.[0] ?? "U"}
          </span>
        </div>

        {/* Smaller logout button */}
        <button
          onClick={onLogout}
          className="ml-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm md:text-base"
        >
          Salir
        </button>
      </div>
    </header>
  );
};
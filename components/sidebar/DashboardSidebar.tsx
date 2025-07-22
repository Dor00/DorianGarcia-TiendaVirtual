// components/sidebar/DashboardSidebar.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/router";
import { supabaseBrowser } from '@/lib/supabase';
import { NavigationButton } from "./NavigationButton";
import { User } from '@/types'; // Import the shared User interface

interface DashboardSidebarProps {
  user: User | null;
  onNavigate: (content: string) => void;
  activeContent: string;
}

export function DashboardSidebar({ user, onNavigate, activeContent }: DashboardSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    console.log("DEBUG (Sidebar): Intentando cerrar sesión desde el Sidebar...");

    if (!supabaseBrowser) {
      console.error("ERROR (Sidebar): Supabase no está disponible para cerrar sesión. No se puede proceder con el logout.");
      return;
    }

    try {
      const { error: signOutError } = await supabaseBrowser.auth.signOut();
      if (signOutError) {
        console.error("ERROR (Sidebar): Fallo al cerrar sesión en Supabase desde Sidebar:", signOutError.message);
      } else {
        console.log("DEBUG (Sidebar): Sesión cerrada correctamente en Supabase. Redirigiendo a /shop...");
        router.push('/shop');
      }
    } catch (error: any) {
      console.error("ERROR (Sidebar): Error inesperado al cerrar sesión desde Sidebar:", error.message);
    }
  };

  const defaultUserImage = "https://cdn.builder.io/api/v1/image/assets/TEMP/a1e45798d5f78408434a975f8c7bf8fe47a4769a?placeholderIfAbsent=true";

  return (
    <nav className="w-72 md:w-80 bg-gray-900 bg-opacity-80 border-r border-solid border-gray-700 flex flex-col pb-4 max-md:w-full max-sm:h-auto max-sm:relative z-20 min-h-screen">
      <div className="p-4 flex flex-col gap-2 pt-[100px] md:pt-[100px] max-sm:pt-[70px]">
        {user && (
          <div className="flex flex-col items-center mb-6">
            <img
              src={user.imagen || defaultUserImage}
              alt={user.nombre || "User Avatar"}
              className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-white md:w-24 md:h-24"
            />
            <p className="text-white text-xl font-semibold mb-1 md:text-2xl">{user.nombre}</p>
            <p className="text-gray-300 text-base mb-1 md:text-lg">{user.email}</p>
            {/* CORRECTED: Access user.roles.nombre */}
            <p className="text-gray-400 text-sm italic md:text-base">{user.roles?.nombre}</p>
          </div>
        )}

        <NavigationButton
          iconSrc="/dashboard.png"
          label="Dashboard"
          onClick={() => onNavigate('dashboard')}
          isActive={activeContent === 'dashboard'}
        />

        {/* CORRECTED: Check user.roles.nombre */}
        {user?.roles?.nombre?.toLowerCase() === 'admin' && ( // Added .toLowerCase() for robustness
          <>
            <NavigationButton
              iconSrc="/users.png"
              label="Gestionar Usuarios"
              onClick={() => onNavigate('user-management')}
              isActive={activeContent === 'user-management'}
            />
            <NavigationButton
              iconSrc="/products.png"
              label="Gestión de Productos"
              onClick={() => onNavigate('product-management')}
              isActive={activeContent === 'product-management'}
            />

            <NavigationButton
              iconSrc="/fondoInicial.png"
              label="Tienda"
              onClick={() => router.push('/shop')}
              isActive={activeContent === 'shop'}
            />
          </>
        )}

        <NavigationButton
          onClick={handleLogout}
          iconSrc="/exit.png"
          label="Salir"
        />
      </div>
    </nav>
  );
}
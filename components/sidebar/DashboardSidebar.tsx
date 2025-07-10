// components/sidebar/DashboardSidebar.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/router";
import { supabaseBrowser } from '@/lib/supabase';

import { NavigationButton } from "./NavigationButton"; // Asume que esta ruta es correcta

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  imagen?: string;
}

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
        // Redirect to the shop page after successful logout
        router.push('/shop');
      }
    } catch (error: any) {
      console.error("ERROR (Sidebar): Error inesperado al cerrar sesión desde Sidebar:", error.message);
    }
  };

  const defaultUserImage = "https://cdn.builder.io/api/v1/image/assets/TEMP/a1e45798d5f78408434a975f8c7bf8fe47a4769a?placeholderIfAbsent=true";

  return (
    <nav className="w-[322px] bg-gray-900 bg-opacity-80 border-r border-solid border-gray-700 flex flex-col pb-4 max-md:w-[280px] max-sm:w-full max-sm:h-auto max-sm:relative z-20 min-h-screen">
      <div className="p-4 flex flex-col gap-2 pt-[100px]">
        {user && (
          <div className="flex flex-col items-center mb-6">
            <img
              src={user.imagen || defaultUserImage}
              alt={user.nombre || "User Avatar"}
              className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-white"
            />
            <p className="text-white text-2xl font-semibold mb-1">{user.nombre}</p>
            <p className="text-gray-300 text-lg mb-1">{user.email}</p>
            <p className="text-gray-400 text-base italic">{user.rol}</p>
          </div>
        )}

        <NavigationButton
          iconSrc="/dashboard.png"
          label="Dashboard"
          onClick={() => onNavigate('dashboard')}
          isActive={activeContent === 'dashboard'}
        />

        {user?.rol === 'admin' && (
          <>
            <NavigationButton
              iconSrc="/users.png" // Asume que tienes este icono en tu carpeta public
              label="Gestionar Usuarios"
              onClick={() => onNavigate('user-crud')}
              isActive={activeContent === 'user-crud'}
            />
            {/* NUEVO: Botón para Gestión de Productos, solo visible para admins */}
            <NavigationButton
              iconSrc="/products.png" // <--- **IMPORTANTE: CAMBIA ESTA RUTA**
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
          onClick={handleLogout} // This is where the logout and redirect logic is called
          iconSrc="/exit.png" // Asume que tienes este icono en tu carpeta public
          label="Salir"
        />
      </div>
    </nav>
  );
}

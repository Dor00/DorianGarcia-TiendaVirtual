// components/dashboard/DashboardAdmin.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { DashboardSidebar } from '../../components/sidebar/DashboardSidebar';
import { Header } from "../../components/head/Header";

// Importa el componente completo de gestión de usuarios
import { UserManagementPage } from '../../components/admin/UserManagementPage';
// Importa el componente de gestión de productos
import { ProductManagementComponent } from '../../components/admin/ProductManagementComponent';

// Importa la interfaz User desde tu archivo de tipos central
import { User } from '@/types';

export function DashboardAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeContent, setActiveContent] = useState('dashboard');

  const fetchUserSession = useCallback(async () => {
    setLoading(true);
    try {
      if (!supabaseBrowser) {
        console.error("ERROR (DashboardAdmin): supabaseBrowser is undefined.");
        setUser(null);
        setLoading(false);
        return;
      }
      const { data: { session }, error: sessionError } = await supabaseBrowser.auth.getSession();

      if (sessionError) {
        console.error("ERROR (DashboardAdmin): Error al obtener sesión de Supabase:", sessionError.message);
        setUser(null);
        setLoading(false);
        return;
      }

      if (session) {
        const { data: userData, error: userError } = await supabaseBrowser
          .from('usuarios')
          .select('id, nombre, email, rol, imagen')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error("ERROR (DashboardAdmin): Error al obtener datos del usuario:", userError.message);
          setUser(null);
        } else if (userData) {
          // Castear a User para asegurar el tipo de rol y imagen
          setUser(userData as User);
          console.log("DEBUG (DashboardAdmin): Usuario cargado:", userData.rol);
        } else {
          console.log("DEBUG (DashboardAdmin): No se encontraron datos para el usuario logueado en la tabla 'usuarios'.");
          setUser(null);
        }
      } else {
        console.log("DEBUG (DashboardAdmin): No hay sesión activa.");
        setUser(null);
      }
    } catch (error: any) {
      console.error("ERROR (DashboardAdmin): Error inesperado al cargar la sesión/usuario:", error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserSession();

    let authListener: any = null;
    if (supabaseBrowser) {
      const { data } = supabaseBrowser.auth.onAuthStateChange(
        (event: string, session: any) => {
          console.log("DEBUG (DashboardAdmin): Auth state changed:", event);
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
            fetchUserSession();
          }
        }
      );
      authListener = data;
    }

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchUserSession]);

  const handleLogout = async () => {
    console.log("DEBUG (DashboardAdmin): Intentando cerrar sesión desde DashboardAdmin...");
    try {
      if (!supabaseBrowser) {
        console.error("ERROR (DashboardAdmin): supabaseBrowser is undefined. No se puede cerrar sesión.");
        return;
      }
      const { error: signOutError } = await supabaseBrowser.auth.signOut();
      if (signOutError) {
        console.error("ERROR (DashboardAdmin): Fallo al cerrar sesión en Supabase desde DashboardAdmin:", signOutError.message);
      } else {
        console.log("DEBUG (DashboardAdmin): Sesión cerrada correctamente en Supabase. Redireccionando...");
      }
    } catch (error: any) {
      console.error("ERROR (DashboardAdmin): Error inesperado al cerrar sesión:", error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-white text-xl">
        Cargando dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        Acceso denegado o sesión no válida. Por favor, inicia sesión.
      </div>
    );
  }

  if (user.rol !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        No tienes permisos de administrador para acceder a esta sección.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-800">
      <DashboardSidebar
        user={user}
        onNavigate={setActiveContent}
        activeContent={activeContent}
      />
      <div className="flex flex-col flex-grow">
        <Header user={user} onLogout={handleLogout} />
        {/* Adjusted padding-top to account for fixed header, and max-md:p-4 for better mobile spacing */}
        <main className="flex-grow p-6 pt-[90px] md:pt-[100px] max-md:p-4 max-md:pt-[70px] overflow-auto">
          {activeContent === 'dashboard' && (
            <div className="text-white text-3xl md:text-4xl">Bienvenido a tu Dashboard, {user?.nombre || 'Administrador'}!</div>
          )}

          {activeContent === 'user-management' && user.rol === 'admin' && (
            <UserManagementPage />
          )}

          {activeContent === 'product-management' && user.rol === 'admin' && (
            <ProductManagementComponent />
          )}

          {user.rol !== 'admin' && (activeContent === 'user-management' || activeContent === 'product-management') && (
            <div className="text-red-500 text-xl">No tienes permisos para ver esta sección.</div>
          )}
        </main>
      </div>
    </div>
  );
}
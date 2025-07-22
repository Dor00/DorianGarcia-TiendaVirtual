// components/dashboard/DashboardAdmin.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { DashboardSidebar } from '../../components/sidebar/DashboardSidebar';
import { Header } from "../../components/head/Header";
import { UserManagementPage } from '../../components/admin/UserManagementPage';
import { ProductManagementComponent } from '../../components/admin/ProductManagementComponent';
import { User } from '@/types';

export function DashboardAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeContent, setActiveContent] = useState('dashboard');
  const [error, setError] = useState<string | null>(null);

  const fetchUserSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseBrowser;
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // 1. Obtener sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(sessionError?.message || "No active session found");
      }

      // 2. Obtener datos del usuario con su rol
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select(`
          id, 
          nombre, 
          email,
          imagen,
          roles!inner(nombre)
        `)
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        throw new Error(userError?.message || "User data not found");
      }

      // 3. Validar estructura de datos
      if (!userData.roles || !userData.roles.nombre) {
        throw new Error("Role information is incomplete");
      }

      // 4. Formatear datos del usuario
      const formattedUser: User = {
        id: userData.id,
        nombre: userData.nombre,
        email: userData.email,
        imagen: userData.imagen,
        roles: {
          nombre: userData.roles.nombre
        }
      };

      setUser(formattedUser);
      console.log("User data loaded successfully:", formattedUser);

    } catch (err: any) {
      console.error("Error in fetchUserSession:", err.message);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserSession();

    // Configurar listener de cambios de autenticación
    const supabase = supabaseBrowser;
    const { data: authListener } = supabase?.auth.onAuthStateChange(
      (event: string, session: any) => {
        console.log("Auth state changed:", event);
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          fetchUserSession();
        }
      }
    ) || { subscription: null };

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserSession]);

  const handleLogout = async () => {
    try {
      const supabase = supabaseBrowser;
      const { error } = await supabase?.auth.signOut() || {};
      if (error) throw error;
      setUser(null);
    } catch (err: any) {
      console.error("Logout failed:", err.message);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-white text-xl">
        Cargando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        Error: {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        Acceso denegado. Por favor, inicia sesión.
      </div>
    );
  }

  if (!user.roles || user.roles.nombre.toLowerCase() !== 'admin') {
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

          {activeContent === 'user-management' && user.roles?.nombre === 'admin' && (
            <UserManagementPage />
          )}

          {activeContent === 'product-management' && user.roles?.nombre === 'admin' && (
            <ProductManagementComponent />
          )}

          {user.roles?.nombre !== 'admin' && (activeContent === 'user-management' || activeContent === 'product-management') && (
            <div className="text-red-500 text-xl">No tienes permisos para ver esta sección.</div>
          )}
        </main>
      </div>
    </div>
  );
}

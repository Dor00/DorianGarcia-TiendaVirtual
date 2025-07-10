// components/dashboard/DashboardAdmin.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase'; // Para el cliente de Supabase del navegador
import { DashboardSidebar } from '../sidebar/DashboardSidebar';
import { Header } from "../../components/head/Header";
import { UserCrudForm } from '../../components/crud/UserCrudForm'; // componente para la gestión de usurios
import { ProductManagementComponent } from '../admin/ProductManagementComponent'; // Componente para gestionar productos


interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  imagen?: string;
}

export function DashboardAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeContent, setActiveContent] = useState('dashboard'); // Estado para controlar el contenido activo

  // Función para obtener la sesión del usuario y sus datos
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
        // Si hay sesión, obtener los datos detallados del usuario de la tabla 'usuarios'
        const { data: userData, error: userError } = await supabaseBrowser
          .from('usuarios') 
          .select('id, nombre, email, rol, imagen')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error("ERROR (DashboardAdmin): Error al obtener datos del usuario:", userError.message);
          setUser(null);
        } else if (userData) {
          setUser(userData);
          console.log("DEBUG (DashboardAdmin): Usuario cargado:", userData.rol);
        } else {
          console.log("DEBUG (DashboardAdmin): No se encontraron datos para el usuario logueado en la tabla 'users'.");
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

    // Suscribirse a cambios de autenticación
    let authListener: any = null;
    if (supabaseBrowser) {
      const { data } = supabaseBrowser.auth.onAuthStateChange(
        (event, session) => {
          console.log("DEBUG (DashboardAdmin): Auth state changed:", event);
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
            fetchUserSession(); // Volver a cargar el usuario si el estado de auth cambia
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
        // No es necesario redirigir aquí si tienes un HOC o un layout global que maneja esto
        // Si no, podrías usar router.push('/login');
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

  // Si no hay usuario (y no está cargando), podrías redirigir o mostrar un mensaje de error/acceso denegado
  // Nota: Esto también puede ser manejado por un HOC como withAuth en pages/admin/dashboard/index.tsx
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        Acceso denegado o sesión no válida. Por favor, inicia sesión.
        {/* Aquí podrías añadir un botón para redirigir al login si no estás usando un HOC */}
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
        <main className="flex-grow p-6 overflow-auto">
          {activeContent === 'dashboard' && (
            <div className="text-white text-3xl">Bienvenido a tu Dashboard, {user?.nombre || 'Usuario'}!</div>
            // Aquí puedes colocar más contenido específico del dashboard
          )}

          {activeContent === 'user-crud' && user.rol === 'admin' && (
            <UserCrudForm />
          )}

          {activeContent === 'product-management' && user.rol === 'admin' && (
            <ProductManagementComponent />
          )}

          {/* Contenido para la gestión de equipos (visible para todos, o condiciona según tu lógica) */}
          {activeContent === 'crear-equipo' && (
            <div className="text-white text-xl">Aquí va el componente para crear un equipo.</div>
            // <CreateTeamComponent />
          )}
          {activeContent === 'unirse-equipo' && (
            <div className="text-white text-xl">Aquí va el componente para unirse a un equipo.</div>
            // <JoinTeamComponent />
          )}
          {activeContent === 'mis-equipos' && (
            <div className="text-white text-xl">Aquí va el componente para ver mis equipos.</div>
            // <MyTeamsComponent />
          )}
        </main>
      </div>
    </div>
  );
}

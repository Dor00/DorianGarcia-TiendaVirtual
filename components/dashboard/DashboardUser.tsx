// components/dashboard/DashboardUser.tsx
"use client"; // Asegúrate de que sea un componente cliente si usas hooks
import React, { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase'; // Asegúrate de que esta ruta sea correcta
import { useRouter } from 'next/router'; // Importa useRouter para la navegación
import { SideBar } from '@/components/sidebar/userSideBar'; // Ruta correcta de tu SideBar
import Link from 'next/link';

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  id_rol: string;
  imagen?: string | null; // El campo de la URL de la imagen
}

export function DashboardUser() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      setLoadingUser(true);
      setErrorUser(null);
      try {
        const supabase = supabaseBrowser;
        if (!supabase) {
          setErrorUser("No se pudo conectar con el servicio de autenticación.");
          router.push('/login');
          return;
        }
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("Error al obtener usuario autenticado:", authError?.message);
          router.push('/login'); // Redirigir al login si no hay sesión válida
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('usuarios')
          .select('id, nombre, email, id_rol, imagen') // Selecciona todos los campos necesarios
          .eq('id', user.id)
          .single();

        if (profileError || !profileData) {
          console.error("Error al obtener perfil del usuario desde DB:", profileError?.message);
          setErrorUser("No se pudo cargar la información de tu perfil.");
          // Opcional: Cerrar sesión si el perfil no existe en la DB aunque el usuario esté autenticado
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        setUserProfile(profileData);
        console.log("Perfil de usuario cargado:", profileData);
      } catch (error: any) {
        console.error("Error inesperado al cargar el perfil:", error);
        setErrorUser("Error inesperado al cargar tu perfil.");
      } finally {
        setLoadingUser(false);
      }
    }

    fetchUserProfile();
  }, [router]); // Dependencia del router para que se ejecute una vez al montar

  const handleLogout = async () => {
    setLoadingUser(true); // O puedes usar otro estado de loading para el logout
    try {
      const supabase = supabaseBrowser;
      if (!supabase) {
        setErrorUser("No se pudo conectar con el servicio de autenticación.");
        setLoadingUser(false);
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error.message);
        setErrorUser("Error al cerrar sesión: " + error.message);
      } else {
        console.log("Sesión cerrada exitosamente.");
        router.push('/login'); // Redirigir al login después de cerrar sesión
      }
    } catch (error: any) {
      console.error("Error inesperado al cerrar sesión:", error);
      setErrorUser("Error inesperado al cerrar sesión.");
    } finally {
      setLoadingUser(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex h-screen bg-gray-900 text-white justify-center items-center">
        Cargando perfil de usuario...
      </div>
    );
  }

  if (errorUser) {
    return (
      <div className="flex h-screen bg-gray-900 text-red-500 justify-center items-center">
        Error: {errorUser}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Pasar la información del usuario y la función de logout al SideBar */}
      <SideBar userProfile={userProfile} onLogout={handleLogout} />

      <div className="flex flex-col flex-1">
        {/* Navbar para Usuario (opcional) */}
        {/* <NavBar /> */}

        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-4xl font-bold mb-6">Mi Dashboard</h1>
          <p className="text-gray-300 mb-8">
            ¡Bienvenido {userProfile?.nombre}! Aquí puedes ver tus pedidos, perfil, etc.
          </p>

          {/* Contenido específico del dashboard de Usuario */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="relative flex flex-wrap gap-5 justify-between px-8 py-4 w-full bg-gray-800 bg-opacity-80 border-t border-gray-700 max-md:px-5">
              <Link
                href="/user/orders"
                className="absolute inset-0 z-10"
                aria-label="Ver pedidos"
              />

              <p className="my-auto text-xl text-gray-300 max-md:max-w-full">Explora tus pedidos recientes.</p>
              <div className="text-3xl font-bold text-blue-500 max-md:text-2xl">
                Mis Pedidos
              </div>
            </div>

            <div className="relative flex flex-wrap gap-5 justify-between px-8 py-4 w-full bg-gray-800 bg-opacity-80 border-t border-gray-700 max-md:px-5">
              <Link
                href="/user/profile"
                className="absolute inset-0 z-10"
                aria-label="Ver perfil"
              />

              <p className="my-auto text-xl text-gray-300 max-md:max-w-full">Actualiza tu información personal.</p>
              <div className="text-3xl font-bold text-blue-500 max-md:text-2xl">
                Mi profile
              </div>
            </div>
            <div className="relative flex flex-wrap gap-5 justify-between px-8 py-4 w-full bg-gray-800 bg-opacity-80 border-t border-gray-700 max-md:px-5">
              <Link
                href="/shop"
                className="absolute inset-0 z-10"
                aria-label="Tienda Virtual"
              />

              <p className="my-auto text-xl text-gray-300 max-md:max-w-full">Ingresa a la tienda virtual.</p>
              <div className="text-3xl font-bold text-blue-500 max-md:text-2xl">
                Tienda Virtual
              </div>


              {/* Más tarjetas o componentes específicos de Usuario */}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

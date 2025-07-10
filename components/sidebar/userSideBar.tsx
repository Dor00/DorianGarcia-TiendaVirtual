// components/sidebar/userSideBar.tsx
import React from 'react';
import Image from 'next/image'; // Importa el componente Image de Next.js
import Link from 'next/link';   // Importa el componente Link de Next.js

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  imagen?: string | null;
}

interface SideBarProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export function SideBar({ userProfile, onLogout }: SideBarProps) {
  const defaultAvatar = '/default-avatar.png'; // Asegúrate de tener una imagen por defecto en /public

  // Asumo que tu ruta de imagen predeterminada es algo como '/default-avatar.png'
  // y que has configurado next.config.js para permitir imágenes externas si las de Supabase están allí
  const avatarSrc = userProfile?.imagen || defaultAvatar;

  return (
    <aside className="w-64 bg-gray-800 p-6 flex flex-col items-center border-r border-gray-700">
      <div className="text-center mb-8">
        {/* Foto de Perfil */}
        {userProfile?.imagen ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-blue-500">
              <Image
                src={avatarSrc}
                alt={`${userProfile.nombre}'s avatar`}
                fill // Usa 'fill' para que la imagen ocupe todo el espacio del contenedor padre
                style={{ objectFit: 'cover' }} // Escala la imagen para cubrir el área, cortándola si es necesario
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Optimización para diferentes tamaños de pantalla
              />
            </div>
          ) : (
            // Avatar por defecto si no hay imagen
            <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-4 text-4xl font-bold text-gray-300">
              {userProfile?.nombre ? userProfile.nombre[0].toUpperCase() : 'U'}
            </div>
          )
        }

        {/* Nombre del Usuario */}
        <h2 className="text-xl font-semibold text-white">{userProfile?.nombre || 'Cargando...'}</h2>
        {/* Email del Usuario */}
        <p className="text-gray-400 text-sm">{userProfile?.email || 'cargando@ejemplo.com'}</p>
        {/* Rol del Usuario */}
        <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2">
          {userProfile?.rol || 'Rol'}
        </span>
      </div>

      {/* Navegación del Dashboard */}
      <nav className="flex flex-col gap-2 w-full">
        {/* Ejemplo de enlaces de navegación, puedes personalizarlos */}
        <Link href="/user/dashboard" passHref legacyBehavior>
          <a className="flex items-center gap-3 p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200">
            {/* Ícono de Dashboard */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l7 7 7 7M19 10v10a1 1 0 001 1h3m-14 0V9m0 0a1 1 0 011-1h6a1 1 0 011 1v7m-14 0h14"></path></svg>
            Dashboard
          </a>
        </Link>
        {/* Más enlaces, ej. "Mis Pedidos", "Mi Perfil" */}
        <Link href="/user/orders" passHref legacyBehavior>
          <a className="flex items-center gap-3 p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200">
            {/* Ícono de Pedidos */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M17 16l4 4m-4 0v-4"></path></svg>
            Mis Pedidos
          </a>
        </Link>
        <Link href="/user/profile" passHref legacyBehavior>
          <a className="flex items-center gap-3 p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200">
            {/* Ícono de Perfil */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Mi Perfil
          </a>
        </Link>
      </nav>

      <div className="mt-auto w-full">
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-3 p-3 w-full bg-red-600 rounded-md text-white font-semibold hover:bg-red-700 transition-colors duration-200"
        >
          {/* Ícono de Salir */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h5a3 3 0 013 3v1"></path></svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

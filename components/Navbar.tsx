"use client";
import { useUser } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function Navbar() {
  const user = useUser();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Refresca la página para actualizar el estado del Navbar
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <div>
        <Link href="/shop" className="text-2xl font-bold text-indigo-400">
          Mi Tienda
        </Link>
      </div>

      <div className="flex items-center gap-4">
        

        {user ? (
          <>
            <span className="text-sm text-gray-300">{user.email}</span>
            <Link
              href="/user/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <Link href="/login" className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react"; // Import useEffect and useState
import { useUser } from "@supabase/auth-helpers-react"; // Only provides basic user object
import { supabaseBrowser } from '@/lib/supabase'; // Assuming this exports a function instance
import Link from "next/link";
import { useRouter } from "next/router"; // Import useRouter for client-side navigation

// Define a minimal UserProfile interface for the Navbar
interface NavbarUserProfile {
  id: string;
  email: string; // The user's email from auth
  id_rol: string; // This is the foreign key to roles table
  // You might also want the role name directly, so we'll fetch it.
  roles: {
    nombre: string; // The name of the role (e.g., 'admin', 'user')
  } | null;
}

export default function Navbar() {
  const user = useUser(); // Supabase user object from auth-helpers
  const router = useRouter(); // Initialize router
  const [userProfile, setUserProfile] = useState<NavbarUserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // New loading state for profile

  useEffect(() => {
    async function fetchUserProfileAndRole() {
      setLoadingProfile(true);
      if (user) {
        try {
          const supabase = supabaseBrowser; // Call it as a function
          if (!supabase) {
            console.error("Supabase client not initialized in Navbar.");
            setUserProfile(null);
            setLoadingProfile(false);
            return;
          }

          const { data: profileData, error } = await supabase
            .from('usuarios')
            .select(`
              id,
              email,
              id_rol,
              roles!inner(nombre) // Fetch the role name via the foreign key
            `)
            .eq('id', user.id)
            .single();

          if (error) {
            console.error("Error fetching user profile in Navbar:", error.message);
            setUserProfile(null);
          } else if (profileData) {
            setUserProfile(profileData as NavbarUserProfile);
            console.log("User Profile loaded in Navbar:", profileData);
          }
        } catch (err: any) {
          console.error("Unexpected error fetching user profile in Navbar:", err.message);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null); // Clear profile if no user is logged in
      }
      setLoadingProfile(false);
    }

    // Only fetch if `user` object changes or on component mount
    fetchUserProfileAndRole();

    // Setup listener for auth state changes to re-fetch profile
    const supabase = supabaseBrowser; // Call it as a function
    const { data: authListener } = supabase?.auth.onAuthStateChange(
      (event: string, session: any) => {
        // If auth state changes (e.g., login/logout), re-fetch profile
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          // You might want to delay this slightly if `useUser` is also updating
          // or rely solely on `user` dependency below if useUser updates quickly.
          // For now, let's keep it simple and just re-run the effect if `user` changes.
        }
      }
    ) || { subscription: null };

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [user]); // Re-run effect if the `user` object from useUser changes

  const handleLogout = async () => {
    try {
      const supabase = supabaseBrowser; // Call it as a function
      if (!supabase) {
        console.error("Supabase client not initialized for logout.");
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error.message);
      } else {
        console.log("Sesión cerrada exitosamente.");
        router.push('/login'); // Use router.push for client-side navigation
      }
    } catch (err: any) {
      console.error("Error inesperado al cerrar sesión:", err.message);
    }
  };

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (userProfile && userProfile.roles && userProfile.roles.nombre.toLowerCase() === 'admin') {
      return "/admin/dashboard";
    }
    // Default to user dashboard or another appropriate page if role is not admin or not found
    return "/user/dashboard";
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <div>
        <Link href="/shop" className="text-2xl font-bold text-indigo-400">
          Mi Tienda
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {loadingProfile ? ( // Show loading state for profile
          <span className="text-gray-400 text-sm">Cargando perfil...</span>
        ) : user ? (
          <>
            <span className="text-sm text-gray-300">{user.email}</span>
            <Link
              href={getDashboardLink()} // Use the dynamically determined link
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
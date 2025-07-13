// utils/withAuth.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-gray-900 text-white text-xl">
    Cargando...
  </div>
);

const AccessDenied = () => (
  <div className="flex justify-center items-center h-screen bg-red-900 text-white text-xl">
    Acceso Denegado. No tienes permisos para ver esta página.
  </div>
);

export const withAuth = (
  WrappedComponent: React.ComponentType,
  allowedRoles: string[]
) => {
  const ComponentWithAuth = (props: any) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        setLoading(true);

        if (!supabaseBrowser) {
          console.error("Supabase client is not initialized.");
          router.push("/login");
          return;
        }

        const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();

        if (authError || !user) {
          console.log("No hay usuario autenticado, redirigiendo al login.");
          router.push("/login");
          return;
        }

        const { data: userData, error: profileError } = await supabaseBrowser
          .from("usuarios")
          .select("rol")
          .eq("id", user.id)
          .single();

        if (profileError || !userData) {
          console.error("Error al obtener rol:", profileError?.message);
          await supabaseBrowser.auth.signOut();
          router.push("/login");
          return;
        }

        if (allowedRoles.includes(userData.rol)) {
          setHasAccess(true);
        } else {
          console.warn(`Acceso denegado. Rol: ${userData.rol}`);
          router.push("/unauthorized");
        }

        setLoading(false);
      };

      checkAuth();
    }, [router]);

    if (loading) {
      return <LoadingSpinner />;
    }

    if (!hasAccess) {
      return <AccessDenied />;
    }

    return <WrappedComponent {...props} />;
  };

  ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return ComponentWithAuth;
};

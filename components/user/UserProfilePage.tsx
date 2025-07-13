"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/router";

interface UserProfilePageProps {
  userId: string;
}



interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  imagen?: string | null;
  
}

export default function UserProfilePage({ userId }: UserProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const router = useRouter();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: authError } = await supabaseBrowser!.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabaseBrowser!
        .from("usuarios")
        .select("id, nombre, email, rol, imagen")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setError("No se pudo cargar tu perfil.");
        return;
      }

      setProfile(data);
      setNombre(data.nombre);
    } catch (err: any) {
      console.error("Error al cargar el perfil:", err.message);
      setError("Error al cargar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!profile) return;

      const { error } = await supabaseBrowser!
        .from("usuarios")
        .update({ nombre })
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      fetchProfile();
    } catch (err: any) {
      console.error("Error al actualizar el perfil:", err.message);
      setError("Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="text-white p-4">Cargando perfil...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">Mi Perfil</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded"
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-1">Correo electrónico</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full p-2 bg-gray-700 text-white rounded cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-1">Rol</label>
          <input
            type="text"
            value={profile.rol}
            disabled
            className="w-full p-2 bg-gray-700 text-white rounded cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleUpdateProfile}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

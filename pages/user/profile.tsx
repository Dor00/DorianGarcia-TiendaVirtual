//pages/user/profile.tsx
import UserProfilePage from "@/components/user/UserProfilePage";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import {Loader} from "@/components/ui/Loader";
import {ErrorPage} from "@/components/ui/ErrorPage";
import { withAuth } from '@/utils/withAuth'; // Importa el HOC de autenticación

function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabaseBrowser.auth.getUser();
        if (error || !data.user) {
          setError("No se pudo obtener el usuario");
          router.push("/login");
          return;
        }
        setUserId(data.user.id);
      } catch (err) {
        setError("Error al verificar sesión");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (loading) return <Loader />;
  if (error) return <ErrorPage message={error} />;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <UserProfilePage userId={userId!} />
    </div>
  );
}

export default withAuth(ProfilePage, ["user"]);

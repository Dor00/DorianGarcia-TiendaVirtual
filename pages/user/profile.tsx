// pages/user/profile.tsx

import { withAuth } from "@/utils/withAuth";
import UserProfilePage from "@/components/user/UserProfilePage"; 
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!supabaseBrowser) {
        router.push("/login");
        return;
      }
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <UserProfilePage userId={userId} />
    </div>
  );
}

export default withAuth(ProfilePage, ["user"]);
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleGoogleCallback = async () => {
            const supabase = supabaseBrowser;
            if (!supabase) {
                console.error("Supabase client not available");
                router.push("/login?error=client");
                return;
            }

            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error || !session?.user) {
                console.error("Error obteniendo sesión:", error);
                router.push("/login?error=google");
                return;
            }

            const user = session.user;

            // --- PASO 1: Obtener el ID del rol predeterminado (ej. 'user' o 'admin') que en este caso es user ---
            let defaultRoleId: string | null = null;
            try {
                const { data: defaultRole, error: roleError } = await supabase
                    .from("roles")
                    .select("id")
                    .eq("nombre", "user") // Assuming 'user' is the name of your default user role
                    .single();

                if (roleError) {
                    console.error("❌ Error obteniendo ID del rol 'Usuario':", roleError);
                    // Decide how to handle this:
                    // Option A: Redirect with a specific error
                    router.push("/login?error=role_not_found");
                    return;
                    // Option B: Fallback to not setting a role if 'rol' column is nullable, or use a hardcoded fallback if safe
                    // If your 'rol' column is NOT NULL, you MUST find a role ID.
                }

                if (defaultRole) {
                    defaultRoleId = defaultRole.id;
                } else {
                    console.error("❌ Rol 'Usuario' no encontrado en la base de datos.");
                    router.push("/login?error=role_missing");
                    return;
                }
            } catch (err) {
                console.error("❌ Error inesperado al buscar el rol:", err);
                router.push("/login?error=role_fetch_failed");
                return;
            }

            // Asegúrate de que tenemos un ID de rol antes de continuar
            if (!defaultRoleId) {
                console.error("No se pudo determinar el ID de rol predeterminado.");
                router.push("/login?error=no_default_role");
                return;
            }
            // --- FIN PASO 1 ---


            // Buscar si ya existe en tabla usuarios
            const { data: existingUser, error: fetchError } = await supabase
                .from("usuarios")
                .select("id")
                .eq("id", user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
                console.error("Error buscando usuario existente:", fetchError);
                router.push("/login?error=fetch_user");
                return;
            }
            
            if (!existingUser) { 
                // --- PASO 2: Usar el defaultRoleId al insertar el nuevo usuario ---
                const { error: insertError } = await supabase
                    .from("usuarios")
                    .insert({
                        id: user.id,
                        email: user.email,
                        nombre: user.user_metadata?.full_name || user.email,
                        imagen: user.user_metadata?.avatar_url || null,
                        id_rol: defaultRoleId, // <--- AQUI ES DONDE ASIGNAMOS EL ID DEL ROL
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        // Si tu tabla 'usuarios' también tiene 'password_hash' (como en el script SQL que te di),
                        // y este usuario se registra vía Google, probablemente no tendrás un password_hash.
                        // Debes decidir si esa columna puede ser NULL o si necesitas un valor por defecto.
                        // Por ejemplo: password_hash: 'GOOGLE_AUTH_USER', o simplemente dejarla fuera si es NULLABLE.
                        // Si es NOT NULL, y no la proporcionas, la inserción fallará.
                        // Te recomiendo revisar tu schema y decidir si password_hash debe ser NULLABLE para usuarios de OAuth.
                    });

                if (insertError) {
                    console.error("❌ Error insertando usuario:", insertError);
                    router.push("/login?error=insert_user");
                    return;
                }
                // --- FIN PASO 2 ---
            }

            router.push("/shop"); // o a donde quieras redirigir
        };

        handleGoogleCallback().finally(() => setLoading(false));
    }, [router]);

    return (
        <div className="text-center mt-20">
            {loading ? "Procesando autenticación con Google..." : "Redirigiendo..."}
        </div>
    );
}
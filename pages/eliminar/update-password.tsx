// pages/update-password.tsx
"use client"; // Si estás usando el App Router, necesitas esto
import { useRouter } from 'next/router'; // O 'next/navigation' para App Router
import React, { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase'; // Asegúrate de que esta ruta es correcta
 
function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // En Next.js Pages Router, el token de la URL estaría en `router.query`
    // En Next.js App Router, usarías `useSearchParams` para obtener los parámetros de la URL.
    // Para este caso específico de Supabase, el manejo del token en la URL
    // y la actualización de la sesión por parte del cliente Supabase ocurre
    // automáticamente si el usuario ya fue redirigido con éxito desde el email.
    // Solo necesitamos que el usuario ingrese la nueva contraseña.

    // Supabase maneja la sesión automáticamente al redirigir con el token de reinicio.
    // Después de la redirección, el usuario debería estar en un estado "semi-autenticado"
    // o con la sesión actualizada para poder cambiar la contraseña.
  }, [router]);


  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) { // Supabase requiere un mínimo de 6 caracteres
        setError("La contraseña debe tener al menos 6 caracteres.");
        setLoading(false);
        return;
    }

    if (!supabaseBrowser) {
      setError("Error de inicialización de Supabase.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('Error al actualizar contraseña:', updateError);
        setError(`Error al actualizar la contraseña: ${updateError.message}`);
      } else {
        setSuccessMessage("Contraseña actualizada con éxito. Ya puedes iniciar sesión.");
        setNewPassword('');
        setConfirmPassword('');
        // Opcional: redirigir a la página de login después de un breve retraso
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white">
      <div className="p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Restablecer Contraseña</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {successMessage && <p className="text-green-500 mb-4 text-center">{successMessage}</p>}
        <form onSubmit={handleUpdatePassword}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-gray-300 text-sm font-bold mb-2">Nueva Contraseña:</label>
            <input
              type="password"
              id="newPassword"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              min-length={6}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-bold mb-2">Confirmar Nueva Contraseña:</label>
            <input
              type="password"
              id="confirmPassword"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              min-length={6}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdatePasswordPage;
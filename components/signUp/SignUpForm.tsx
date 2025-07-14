// components/signUp/SignUpForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { FormField } from "./FormField";
import { EmailField } from "./EmailField";
import { supabaseBrowser } from '@/lib/supabase'; // Importa el cliente de Supabase

export function SignUpForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contrasena: '',
    confirmarContrasena: '',
    rol: 'user' as const
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación básica
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // 1. Registro de usuario
      const { data: signUpData, error: signUpError } = await supabaseBrowser!.auth.signUp({
        email: formData.email,
        password: formData.contrasena,
        options: {
          data: {
            nombre: formData.nombre,
            rol: formData.rol
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('No se pudo crear el usuario');

      // 2. Subida de imagen (opcional)
      let imageUrl = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${signUpData.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabaseBrowser!.storage
          .from('avatars')
          .upload(filePath, selectedFile);

        if (!uploadError) {
          const { data: urlData } = supabaseBrowser!.storage
            .from('avatars')
            .getPublicUrl(filePath);
          
          imageUrl = urlData.publicUrl;
        }
      }

      // 3. Actualización del perfil
      const { error: profileError } = await supabaseBrowser!
        .from('usuarios')
        .upsert({
          id: signUpData.user.id,
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          imagen: imageUrl,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      setSuccess(true);
      router.push('/login?registro=exitoso');
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <FormField
        label="Nombre"
        type="text"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        placeholder="Tu nombre completo"
        required
        disabled={loading || success}
        autoComplete="name"
      />

      <EmailField
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="tu@email.com"
        required
        disabled={loading || success}
        autoComplete="email"
      />

      <FormField
        label="Contraseña"
        type="password"
        name="contrasena"
        value={formData.contrasena}
        onChange={handleChange}
        placeholder="Mínimo 6 caracteres"
        required
        minLength={6}
        disabled={loading || success}
        autoComplete="new-password"
      />

      <FormField
        label="Confirmar contraseña"
        type="password"
        name="confirmarContrasena"
        value={formData.confirmarContrasena}
        onChange={handleChange}
        placeholder="Repite tu contraseña"
        required
        disabled={loading || success}
        autoComplete="new-password"
      />

      <div className="flex flex-col">
        <label className="block text-gray-300 text-sm mb-2">
          Foto de perfil (opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading || success}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
            file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center mt-2">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading || success}
        className={`w-full py-3 rounded-md font-semibold text-lg mt-6
          ${loading || success ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
      >
        {loading ? 'Creando cuenta...' : success ? '¡Registro exitoso!' : 'Crear cuenta'}
      </button>

      <div className="text-center text-sm mt-4">
        <span className="text-gray-400">¿Ya tienes cuenta? </span>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-blue-500 hover:underline font-bold"
        >
          Inicia sesión
        </button>
      </div>
    </form>
  );
}
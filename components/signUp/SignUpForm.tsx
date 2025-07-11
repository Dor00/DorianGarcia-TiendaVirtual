// components/signUp/SignUpForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { FormField } from "./FormField";
import { EmailField } from "./EmailField";
import { supabaseBrowser } from '@/lib/supabase'; // Asegúrate de que esta importación sea correcta

// --- Resto de interfaces (FormFieldProps, EmailFieldProps, etc.) deben estar definidas aquí o importadas ---
// (No las incluyo de nuevo para mantener el enfoque en la solución, pero asegúrate de que estén correctas)


interface SignUpFormProps {
  onSignUpSuccess: () => void;
  onError: (error: string) => void;
}

export function SignUpForm({ onSignUpSuccess, onError }: SignUpFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contrasena: '',
    confirmarContrasena: '',
    rol: 'user' as 'user' | 'admin' 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState(false);

  interface ChangeEventTarget extends EventTarget {
    name: string;
    value: string;
  }

  interface ChangeEvent extends React.ChangeEvent<HTMLInputElement | HTMLSelectElement> {
    target: ChangeEventTarget & (HTMLInputElement | HTMLSelectElement);
  }

  const handleChange = (e: ChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  interface HandleSubmitEvent extends React.FormEvent<HTMLFormElement> {}

  // Removed the empty UploadResponse interface as it was causing an ESLint error.

  interface RegisterResponse {
    error?: string;
    user?: { id: string; email: string; nombre: string; }; 
    session?: { access_token: string }; 
  }

  const handleSubmit = async (e: HandleSubmitEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setLocalError(''); 
    setLocalSuccess(false);

    if (formData.contrasena !== formData.confirmarContrasena) {
      setLocalError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (!supabaseBrowser) {
        console.error("ERROR (SignUpForm): supabaseBrowser no está inicializado. No se puede proceder.");
        setLocalError("Error de inicialización. Por favor, recarga la página o intenta más tarde.");
        setLoading(false);
        return;
    }

    let imageUrl: string | null = null;
    let accessToken: string | null = null;
    let registeredUserId: string | null = null;

    try {
      // Step 1: Register user using your API endpoint (/api/auth/usuarios)
      // Esta API debería crear el usuario en auth.users y en tu tabla 'usuarios'
      const registerResponse = await fetch('/api/auth/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          contrasena: formData.contrasena,
          rol: formData.rol, 
        }),
      });

      const registerData: RegisterResponse = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerData.error || 'Error al registrar el usuario.');
      }
      
      console.log("Usuario registrado exitosamente en la API.");
      registeredUserId = registerData.user?.id || null; // Asegúrate de que tu API devuelva el ID del usuario

      if (!registeredUserId) {
        throw new Error("No se pudo obtener el ID del usuario después del registro.");
      }

      // Step 2: Client-side sign in to get a session/access_token for file upload
      // Esto es necesario para que el usuario autenticado pueda subir archivos a Supabase Storage
      const { data: signInData, error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email: formData.email,
        password: formData.contrasena,
      });

      if (signInError || !signInData.session) {
        console.error("Error al iniciar sesión después del registro:", signInError || "Sesión no obtenida.");
        setLocalError('Registro exitoso, pero fallo al iniciar sesión automáticamente. Por favor, inicia sesión manualmente.');
        setLoading(false);
        onError('Registro exitoso, pero fallo al iniciar sesión automáticamente. Por favor, inicia sesión manualmente.');
        setTimeout(() => { router.push('/login'); }, 2000);
        return;
      }

      accessToken = signInData.session.access_token;
      console.log("Sesión establecida después del registro, token obtenido.");

      // Step 3: Upload image to Supabase Storage if a file is selected
      if (selectedFile && accessToken && registeredUserId) {
        const fileExtension = selectedFile.name.split('.').pop();
        const fileName = `${registeredUserId}-${Date.now()}.${fileExtension}`; 
        const filePath = `avatars/${fileName}`; 

        const { error: uploadError } = await supabaseBrowser.storage
          .from('avatars') 
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true, 
          });

        if (uploadError) {
          console.error('ERROR (SignUpForm): Error al subir la imagen a Supabase Storage:', uploadError.message);
          setLocalError('Error al subir la imagen de perfil: ' + uploadError.message);
          // IMPORTANTE: NO hacemos un `return` aquí. Permitimos que el registro continúe sin imagen.
          // El usuario puede subir una imagen después de registrarse si lo desea.
        } else {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from('avatars')
              .getPublicUrl(filePath);
            imageUrl = publicUrlData.publicUrl;
            console.log("Image uploaded successfully:", imageUrl);

            // *******************************************************************
            // MODIFICACIÓN CLAVE: ACTUALIZAR EL CAMPO 'imagen' EN LA TABLA 'usuarios'
            // *******************************************************************
            console.log('Intentando actualizar la URL de la imagen en la tabla usuarios para el ID:', registeredUserId);
            const { error: updateError } = await supabaseBrowser
              .from('usuarios')
              .update({ imagen: imageUrl })
              .eq('id', registeredUserId); // Usamos el ID del usuario para la actualización

            if (updateError) {
              console.error('ERROR (SignUpForm): Error al actualizar la URL de la imagen en la tabla usuarios:', updateError.message);
              setLocalError('Error al guardar la URL de la imagen en tu perfil.');
              // No retornamos aquí para no bloquear el flujo principal de registro
            } else {
              console.log('URL de la imagen actualizada en la tabla usuarios.');
            }
        }
      }

      setLocalSuccess(true);
      setFormData({
        nombre: '',
        email: '',
        contrasena: '',
        confirmarContrasena: '',
        rol: 'user' 
      });
      setSelectedFile(null); 

      onSignUpSuccess();

      setTimeout(() => {
        router.push('/login?registro=exitoso');
      }, 2000);

    } catch (err: unknown) {
      console.error("Error general durante el registro/subida:", err);
      setLocalError(err instanceof Error ? err.message : String(err));
      onError(err instanceof Error ? err.message : String(err));
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
        placeholder="Tu nombre"
        required
      />

      <EmailField
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Tu correo electrónico"
        required
      />

      <FormField
        label="Contraseña"
        type="password"
        name="contrasena"
        value={formData.contrasena}
        onChange={handleChange}
        placeholder="Ingresa tu contraseña"
        required
        minLength={6}
      />

      <FormField
        label="Confirmar contraseña"
        type="password"
        name="confirmarContrasena"
        value={formData.confirmarContrasena}
        onChange={handleChange}
        placeholder="Confirma tu contraseña"
        required
      />

      <FormField
        label="Tipo de Usuario"
        type="select"
        name="rol"
        value={formData.rol}
        onChange={handleChange}
        required
        options={[
          { value: 'user', label: 'Usuario Regular' },
          { value: 'admin', label: 'Administrador' },
        ]}
        className="mt-2"
      />

      {/* Directly using a standard input for file upload to avoid type conflicts with FormField */}
      <div className="flex flex-col">
        <label htmlFor="imagen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Foto de Perfil (Opcional)
        </label>
        <input
          id="imagen"
          type="file"
          name="imagen"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {selectedFile && (
        <p className="text-gray-400 text-sm mt-1">Archivo seleccionado: {selectedFile.name}</p>
      )}

      {localError && (
        <div className="text-red-400 text-sm text-center mt-2">{localError}</div>
      )}

      {localSuccess && (
        <div className="mb-4 p-3 bg-green-700 text-white text-center rounded border border-green-800 animate-fade-in-down">
          ¡Usuario registrado exitosamente! Redirigiendo...
        </div>
      )}

      <button
        type="submit"
        disabled={loading || localSuccess}
        className={`w-full py-3 rounded-md font-semibold text-lg transition-colors duration-200 mt-6
          ${loading || localSuccess ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {loading ? 'Registrando...' : localSuccess ? 'Registro exitoso' : 'Crear cuenta'}
      </button>

      <div className="text-center text-sm mt-4">
        <p className="text-gray-400 inline">¿Ya tienes cuenta? </p>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-blue-500 hover:underline font-bold transition-colors duration-200"
        >
          Inicia sesión
        </button>
      </div>
    </form>
  );
}




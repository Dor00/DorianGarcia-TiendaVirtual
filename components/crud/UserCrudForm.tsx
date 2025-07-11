// components/crud/UserCrudForm.tsx
"use client"; // Marca este componente como un Client Component en Next.js

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase'; // Asegúrate de que la ruta sea correcta
import { FormField } from '@/components/signUp/FormField'; // Reutilizando FormField
import { EmailField } from '@/components/signUp/EmailField'; // Reutilizando EmailField

// --- Definiciones de interfaces (Asegúrate de que estas coincidan con tu esquema de datos) ---
// Estas interfaces son ejemplos. Debes ajustarlas a la estructura real de tus datos.
interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'user' | 'admin';
  imagen: string | null; // La URL de la imagen de perfil, puede ser string o null
  // Añade aquí cualquier otro campo de usuario que manejes
}

interface FormData {
  nombre: string;
  email: string;
  rol: 'user' | 'admin';
  contrasena?: string; // Contraseña opcional para edición (no siempre se edita)
  confirmarContrasena?: string; // Confirmación de contraseña opcional
  imagen?: File | string | null; // Puede ser un archivo (para subir), una URL (existente), o null
  // Añade aquí cualquier otro campo del formulario
}

interface UserCrudFormProps {
  editingUser?: User | null; // Usuario que se está editando (opcional para creación)
  onSuccess: () => void; // Callback al éxito de la operación
  onError: (message: string) => void; // Callback al error de la operación
}

export function UserCrudForm({ editingUser, onSuccess, onError }: UserCrudFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    rol: 'user',
    contrasena: '',
    confirmarContrasena: '',
    imagen: null, // Inicialmente sin imagen
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState(false);

  // Efecto para cargar los datos del usuario si estamos en modo edición
  useEffect(() => {
    if (editingUser) {
      setFormData({
        nombre: editingUser.nombre,
        email: editingUser.email,
        rol: editingUser.rol,
        contrasena: '', // No precargamos contraseñas por seguridad
        confirmarContrasena: '',
        imagen: editingUser.imagen, // Precargamos la URL de la imagen existente
      });
    }
  }, [editingUser]);

  // Manejador de cambios para campos de texto y select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejador de cambios para el campo de archivo (imagen)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFormData((prev) => ({ ...prev, imagen: e.target.files![0] })); // Actualiza formData con el archivo
    } else {
      setSelectedFile(null);
      setFormData((prev) => ({ ...prev, imagen: null })); // Si no hay archivo, establece imagen a null
    }
  };

  // Manejador de envío del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    setLocalSuccess(false);

    // Validación de contraseñas solo si se están proporcionando
    if (formData.contrasena || formData.confirmarContrasena) {
      if (formData.contrasena !== formData.confirmarContrasena) {
        setLocalError('Las contraseñas no coinciden.');
        setLoading(false);
        return;
      }
      if (formData.contrasena && formData.contrasena.length < 6) {
        setLocalError('La contraseña debe tener al menos 6 caracteres.');
        setLoading(false);
        return;
      }
    }

    if (!supabaseBrowser) {
      console.error("ERROR (UserCrudForm): supabaseBrowser no está inicializado.");
      setLocalError("Error de inicialización. Por favor, recarga la página o intenta más tarde.");
      setLoading(false);
      return;
    }

    let finalImageURL: string | null = null; // Variable para almacenar la URL final de la imagen

    try {
      // 1. Lógica para subir la imagen si se seleccionó un nuevo archivo
      if (selectedFile) {
        const fileExtension = selectedFile.name.split('.').pop();
        const fileName = `${editingUser?.id || 'new_user'}-${Date.now()}.${fileExtension}`; 
        const filePath = `avatars/${fileName}`; 

        const { data: uploadData, error: uploadError } = await supabaseBrowser.storage
          .from('avatars') 
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true, 
          });

        if (uploadError) {
          console.error('ERROR (UserCrudForm): Error al subir la imagen a Supabase Storage:', uploadError.message);
          setLocalError('Error al subir la imagen de perfil: ' + uploadError.message);
          // Si hay un error de subida, la URL final de la imagen será null o la existente
          finalImageURL = editingUser?.imagen ?? null; 
        } else {
          const { data: publicUrlData } = supabaseBrowser.storage
            .from('avatars')
            .getPublicUrl(filePath);
          finalImageURL = publicUrlData.publicUrl; // Asigna la URL pública de la imagen subida
          console.log("Image uploaded successfully:", finalImageURL);
        }
      } else if (typeof formData.imagen === 'string' || formData.imagen === null) {
        // Si no se seleccionó un nuevo archivo, pero formData.imagen es una cadena (URL existente) o null
        // Esto cubre el caso de mantener la imagen existente o borrarla si se estableció a null
        finalImageURL = formData.imagen;
      } else if (editingUser?.imagen) {
        // Si no se seleccionó un nuevo archivo y no se borró la imagen,
        // y hay una imagen existente en editingUser, la mantenemos.
        finalImageURL = editingUser.imagen;
      }


      // 2. Preparar los datos para la API
      const userDataToSubmit: any = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        imagen: finalImageURL, // Usamos la URL final de la imagen
      };

      // Si se proporcionó una contraseña, inclúyela
      if (formData.contrasena) {
        userDataToSubmit.contrasena = formData.contrasena;
      }

      let apiResponse;
      if (editingUser) {
        // Modo edición: PATCH a la API
        apiResponse = await fetch(`/api/auth/usuarios/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userDataToSubmit),
        });
      } else {
        // Modo creación: POST a la API
        apiResponse = await fetch('/api/auth/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userDataToSubmit),
        });
      }

      const responseData = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(responseData.error || `Error al ${editingUser ? 'actualizar' : 'crear'} el usuario.`);
      }

      setLocalSuccess(true);
      setFormData({ // Limpiar formulario o resetear a valores iniciales
        nombre: '',
        email: '',
        rol: 'user',
        contrasena: '',
        confirmarContrasena: '',
        imagen: null,
      });
      setSelectedFile(null);

      onSuccess(); // Llama al callback de éxito

      // Redirigir después de un breve retraso para mostrar el mensaje de éxito
      setTimeout(() => {
        router.push('/admin/users'); // O la ruta que desees después de la operación
      }, 2000);

    } catch (err: any) {
      console.error("Error general durante la operación de usuario:", err);
      setLocalError(err.message || 'Ocurrió un error inesperado.');
      onError(err.message || 'Ocurrió un error inesperado.'); // Llama al callback de error
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
      </h2>

      <FormField
        label="Nombre"
        type="text"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        placeholder="Nombre completo del usuario"
        required
      />

      <EmailField
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Correo electrónico del usuario"
        required
      />

      <FormField
        label="Contraseña (dejar en blanco para no cambiar)"
        type="password"
        name="contrasena"
        value={formData.contrasena || ''} // Asegura que el valor no sea undefined
        onChange={handleChange}
        placeholder="Nueva contraseña"
        minLength={6}
      />

      <FormField
        label="Confirmar Contraseña"
        type="password"
        name="confirmarContrasena"
        value={formData.confirmarContrasena || ''} // Asegura que el valor no sea undefined
        onChange={handleChange}
        placeholder="Confirma la nueva contraseña"
      />

      <FormField
        label="Rol de Usuario"
        type="select"
        name="rol"
        value={formData.rol}
        onChange={handleChange}
        required
        options={[
          { value: 'user', label: 'Usuario Regular' },
          { value: 'admin', label: 'Administrador' },
        ]}
      />

      {/* Campo para la imagen de perfil */}
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
        {/* Muestra la imagen actual si estamos editando y no se ha seleccionado una nueva */}
        {editingUser?.imagen && !selectedFile && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Imagen actual:</p>
            <img 
              src={editingUser.imagen} 
              alt="Current Profile" 
              className="w-24 h-24 object-cover rounded-full mt-1 border border-gray-300"
            />
          </div>
        )}
        {selectedFile && (
          <p className="text-gray-400 text-sm mt-1">Archivo seleccionado: {selectedFile.name}</p>
        )}
      </div>

      {localError && (
        <div className="text-red-500 text-sm text-center mt-2 p-2 bg-red-100 dark:bg-red-900 rounded-md">
          {localError}
        </div>
      )}

      {localSuccess && (
        <div className="mb-4 p-3 bg-green-700 text-white text-center rounded border border-green-800 animate-fade-in-down">
          ¡Usuario {editingUser ? 'actualizado' : 'registrado'} exitosamente! Redirigiendo...
        </div>
      )}

      <button
        type="submit"
        disabled={loading || localSuccess}
        className={`w-full py-3 rounded-md font-semibold text-lg transition-colors duration-200 mt-6
          ${loading || localSuccess ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {loading ? 'Procesando...' : localSuccess ? 'Éxito' : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')}
      </button>

      <div className="text-center text-sm mt-4">
        <button
          type="button"
          onClick={() => router.back()} // O a la ruta de listado de usuarios
          className="text-blue-500 hover:underline font-bold transition-colors duration-200"
        >
          Volver
        </button>
      </div>
    </form>
  );
}


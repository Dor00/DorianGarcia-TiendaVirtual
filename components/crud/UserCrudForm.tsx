// components/crud/UserCrudForm.tsx
"use client"; // Marca este componente como un Client Component en Next.js

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabaseBrowser } from '@/lib/supabase'; // Asegúrate de importar tu cliente Supabase para el navegador

// Define el esquema de validación con Zod
const userSchema = z.object({
  id: z.string().optional(), // ID es opcional para la creación, presente para edición
  nombre: z.string().min(1, "El nombre es requerido."),
  email: z.string().email("Formato de email inválido."),
  // La contraseña es opcional al editar, pero requerida si no hay un ID (es decir, creando)
  // Permite que sea opcional en el formulario y también una cadena vacía.
  // La validación de longitud se aplica solo si no está vacía.
  // IMPORTANTE: `refine` debe estar después de `optional().or(z.literal(''))` si quieres que no falle
  // en casos donde el campo está vacío o no se proporciona.
  contrasena: z.string()
    .optional()
    .or(z.literal(''))
    .refine(val => {
      // Si el valor es undefined o una cadena vacía, no se aplica la validación de longitud.
      // Esto es para el caso de edición donde la contraseña puede no cambiarse.
      if (val === undefined || val === '') return true;
      return val.length >= 6; // Si tiene valor, debe tener al menos 6 caracteres.
    }, "La contraseña debe tener al menos 6 caracteres si se proporciona."),
  rol: z.enum(["admin", "user", "miembro", "cliente"], { // Asegúrate de que los roles coincidan con tu DB
    errorMap: () => ({ message: "Rol inválido." })
  }),
  // Para el campo de imagen, `z.any()` es apropiado porque el `FileList` no es un tipo JS estándar.
  // Luego, la validación y el procesamiento del `FileList` se hacen en `onSubmit`.
  imagen: z.any().optional(), // Puede ser FileList, o undefined
});

// Tipo para los datos del formulario (antes de procesar el archivo)
type UserFormData = z.infer<typeof userSchema>;

// Tipo para el usuario que se obtiene de la API y se muestra en la tabla
interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'user' | 'miembro' | 'cliente'; // Definir los tipos de rol para mejor tipado
  imagen?: string | null; // Puede ser string (URL) o null
  created_at?: string;
}

export function UserCrudForm() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Configuración de react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nombre: '',
      email: '',
      contrasena: '',
      rol: 'user',
      imagen: undefined,
    }
  });

  // Watch para el campo de archivo, útil para mostrar previsualizaciones
  const imageFileWatcher = watch('imagen'); // Esto puede ser FileList o undefined

  // Función para cargar la lista de usuarios desde la API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/usuarios');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar usuarios.');
      }
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []); // useCallback para evitar recreaciones innecesarias

  // useEffect para cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Dependencia: fetchUsers

  // Función que se ejecuta al enviar el formulario (crear o actualizar)
  const onSubmit = async (formData: UserFormData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    let finalImageUrl: string | null = null;

    try {
      // 1. Manejar la subida de la imagen si se seleccionó un archivo nuevo
      const hasNewImageFile = imageFileWatcher instanceof FileList && imageFileWatcher.length > 0;
      const fileToUpload = hasNewImageFile ? imageFileWatcher[0] : null;

      if (fileToUpload) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', fileToUpload);

        const { data: { session }, error: sessionError } = await supabaseBrowser.auth.getSession();
        if (sessionError || !session?.access_token) {
          throw new Error("No hay sesión activa para subir la imagen. Por favor, inicia sesión de nuevo.");
        }

        const uploadResponse = await fetch('/api/upload-avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`, // Necesario para tu API Route si lo usas
          },
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Error al subir la imagen.');
        }
        finalImageUrl = uploadData.publicUrl;
      } else if (editingUser) {
        // En modo edición, si no hay un nuevo archivo, mantener la imagen existente
        // a menos que el campo de imagen en el formulario se haya vaciado (lo que significa eliminar)
        if (formData.imagen === undefined || (typeof formData.imagen === 'string' && formData.imagen === editingUser.imagen)) {
          // No se tocó el input de archivo y no se cambió la URL, mantener la existente
          finalImageUrl = editingUser.imagen;
        } else if (typeof formData.imagen === 'string' && formData.imagen === '') {
          // El input de archivo se vació o el campo de imagen se estableció a string vacío, significa eliminar
          finalImageUrl = null;
        }
        // Si formData.imagen es una nueva URL (string no vacío y diferente de editingUser.imagen),
        // entonces finalImageUrl ya se establece a esa nueva URL por defecto.
      } else {
        // Creando nuevo usuario sin imagen o con imagen nula
        finalImageUrl = null;
      }

      // 2. Preparar los datos y la URL para la API de CRUD de usuarios
      const method = editingUser ? 'PUT' : 'POST';
      const url = `/api/auth/usuarios` + (editingUser ? `?id=${editingUser.id}` : '');

      const dataToUpdateUser: Partial<UserFormData & { id?: string }> = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        imagen: finalImageUrl,
      };

      // La contraseña solo se envía si se ha escrito algo y cumple la longitud mínima
      // La validación Zod ya se encargó de la longitud
      if (formData.contrasena && formData.contrasena !== '') { // Verifica que no sea vacía
        dataToUpdateUser.contrasena = formData.contrasena;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToUpdateUser),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Error al ${editingUser ? 'actualizar' : 'crear'} usuario.`);
      }

      setSuccessMessage(`Usuario ${editingUser ? 'actualizado' : 'creado'} exitosamente.`);
      setEditingUser(null);
      reset(); // Resetea el formulario a los defaultValues

      // Limpiar el input type="file" directamente del DOM para mayor seguridad
      const fileInput = document.getElementById('imagen') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      await fetchUsers(); // Recargar la lista de usuarios
    } catch (err: any) {
      setError(err.message);
      console.error(`Error ${editingUser ? 'updating' : 'creating'} user:`, err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
  };

  // Función para manejar la edición de un usuario
  const handleEdit = (user: User) => {
    setEditingUser(user);
    // Establecer los valores del formulario con los datos del usuario a editar
    setValue('nombre', user.nombre);
    setValue('email', user.email);
    setValue('rol', user.rol);
    setValue('contrasena', ''); // Siempre vaciar la contraseña al editar por seguridad

    // Para la imagen:
    // Si el usuario tiene una imagen existente, asegúrate de que se muestre.
    // El `watch('imagen')` en el renderizado se encargará de esto si `editingUser.imagen` tiene valor.
    // Limpiar el input de archivo explícitamente para que el usuario pueda seleccionar uno nuevo si lo desea.
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    setValue('imagen', undefined); // Limpia el valor del campo de archivo en react-hook-form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para manejar la eliminación de un usuario
  const handleDelete = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.')) {
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/auth/usuarios?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar usuario.');
      }
      setSuccessMessage('Usuario eliminado exitosamente.');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Hubo un problema al eliminar el usuario.');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
  };

  // Función para cancelar el modo de edición y limpiar el formulario
  const handleCancelEdit = () => {
    setEditingUser(null);
    reset(); // Resetea el formulario a los defaultValues
    // Limpiar el input de archivo explícitamente
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="bg-gray-800 bg-opacity-90 p-8 rounded-lg shadow-lg text-white max-w-4xl mx-auto my-8">
      <h2 className="text-3xl font-bold mb-6 text-blue-400">
        {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
      </h2>

      {loading && <p className="text-blue-300 mb-4">Cargando...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label htmlFor="nombre" className="block text-gray-300 text-sm font-bold mb-2">Nombre:</label>
          <input
            type="text"
            id="nombre"
            {...register('nombre')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
          />
          {errors.nombre && <p className="text-red-400 text-xs italic mt-1">{errors.nombre.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email:</label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
          />
          {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="contrasena" className="block text-gray-300 text-sm font-bold mb-2">
            Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
          </label>
          <input
            type="password"
            id="contrasena"
            {...register('contrasena')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
          />
          {errors.contrasena && <p className="text-red-400 text-xs italic mt-1">{errors.contrasena.message}</p>}
        </div>

        <div>
          <label htmlFor="rol" className="block text-gray-300 text-sm font-bold mb-2">Rol:</label>
          <select
            id="rol"
            {...register('rol')}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
          >
            <option value="">Selecciona un rol</option>
            <option value="admin">Administrador</option>
            <option value="user">Usuario</option>
            <option value="miembro">Miembro</option>
            <option value="cliente">Cliente</option>
          </select>
          {errors.rol && <p className="text-red-400 text-xs italic mt-1">{errors.rol.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="imagen" className="block text-gray-300 text-sm font-bold mb-2">Subir Imagen de Perfil (Opcional):</label>
          <input
            type="file"
            id="imagen"
            {...register('imagen')}
            accept="image/*"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {errors.imagen && <p className="text-red-400 text-xs italic mt-1">{errors.imagen.message}</p>}

          {/* Mostrar imagen actual del usuario o previsualización del archivo seleccionado */}
          {((imageFileWatcher && imageFileWatcher instanceof FileList && imageFileWatcher.length > 0) || editingUser?.imagen) && (
            <div className="mt-4">
              <p className="text-gray-300 text-sm font-bold mb-2">Previsualización/Imagen actual:</p>
              <img
                src={
                  (imageFileWatcher && imageFileWatcher instanceof FileList && imageFileWatcher.length > 0)
                    ? URL.createObjectURL(imageFileWatcher[0]) // Previsualización del archivo recién seleccionado
                    : editingUser?.imagen || '' // Imagen existente del usuario (o string vacío si es null/undefined)
                }
                alt="Previsualización de Perfil"
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
              />
              {(imageFileWatcher && imageFileWatcher instanceof FileList && imageFileWatcher.length > 0) && (
                <p className="text-gray-400 text-xs italic mt-1">Se subirá esta nueva imagen.</p>
              )}
              {editingUser?.imagen && !(imageFileWatcher && imageFileWatcher instanceof FileList && imageFileWatcher.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    // Limpiar la imagen actual del usuario
                    setValue('imagen', ''); // Esto establecerá el campo 'imagen' a un string vacío
                    // Limpiar el input de tipo file
                    const fileInput = document.getElementById('imagen') as HTMLInputElement;
                    if (fileInput) {
                      fileInput.value = '';
                    }
                    // Actualizar el editingUser localmente para que la imagen desaparezca de la previsualización
                    setEditingUser(prev => prev ? { ...prev, imagen: null } : null);
                  }}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm"
                >
                  Eliminar Imagen Actual
                </button>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
          {editingUser && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Cancelar Edición
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
        </div>
      </form>

      <h3 className="text-2xl font-bold mb-4 text-gray-200">Lista de Usuarios</h3>
      {loading && <p className="text-blue-300 mt-4">Cargando usuarios...</p>}
      {error && <p className="text-red-500 mt-4">Error: {error}</p>}
      {users.length === 0 && !loading && !error && <p className="text-gray-400">No hay usuarios registrados.</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-700 rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-600 text-left text-gray-100 uppercase text-sm leading-normal">
              <th className="py-3 px-6">Imagen</th>
              <th className="py-3 px-6">Nombre</th>
              <th className="py-3 px-6">Email</th>
              <th className="py-3 px-6">Rol</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 text-sm font-light">
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-600 hover:bg-gray-600">
                <td className="py-3 px-6 text-left">
                  {user.imagen ? (
                    <img
                      src={user.imagen}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-xs text-white">N/A</div>
                  )}
                </td>
                <td className="py-3 px-6 text-left whitespace-nowrap">{user.nombre}</td>
                <td className="py-3 px-6 text-left">{user.email}</td>
                <td className="py-3 px-6 text-left">{user.rol}</td>
                <td className="py-3 px-6 text-center">
                  <button
                    onClick={() => handleEdit(user)}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-md mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

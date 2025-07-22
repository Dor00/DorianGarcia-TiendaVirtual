// components/user/UserCrudForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase'; // Assuming this is your client-side Supabase instance
import { FormField } from '@/components/signUp/FormField';
import { EmailField } from '@/components/signUp/EmailField';
import { User } from '@/types'; // Import the global User type

// Interface for roles fetched from the database
interface Role {
  id: string;
  nombre: string;
}

interface UserCrudFormProps {
  editingUser?: User | null;
  onSuccess: () => void;
  onError: (message: string) => void;
  onCancelEdit: () => void;
  onSuccessAndRefresh?: () => void; // Optional function for refreshing list
}

export function UserCrudForm({ editingUser, onSuccess, onError, onCancelEdit }: UserCrudFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contrasena: '',
    confirmarContrasena: '',
    id_rol: '', // Initialize with empty string for UUID
    imagen: null as File | string | null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]); // State to store available roles

  // Fetch roles from Supabase on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      const supabase = supabaseBrowser;
      if (!supabase) {
        setError('Error al conectar con la base de datos.');
        return;
      }
      
      const { data, error } = await supabase.from('roles').select('*');
      if (error) {
        console.error('Error fetching roles:', error);
        setError('Error al cargar roles.');
      } else {
        setRoles(data || []);
      }
    };
    fetchRoles();
  }, []);

  // Load user data when editingUser changes
  useEffect(() => {
    if (editingUser) {
      setFormData({
        nombre: editingUser.nombre,
        email: editingUser.email,
        contrasena: '',
        confirmarContrasena: '',
        id_rol: editingUser.id_rol || '', // Populate id_rol from editingUser
        imagen: editingUser.imagen
      });
      setImagePreview(editingUser.imagen);
    } else {
      resetForm();
    }
  }, [editingUser]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      contrasena: '',
      confirmarContrasena: '',
      id_rol: '', // Reset id_rol
      imagen: null
    });
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(editingUser?.imagen || null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imagen: null }));
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.nombre || !formData.email || !formData.id_rol) { // Added id_rol validation
      setError('Nombre, email y rol son campos requeridos');
      return false;
    }

    // Password validation for new user or password change
    if (!editingUser && (!formData.contrasena || formData.contrasena.length < 6)) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.contrasena && formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const uploadImage = async (userId: string) => {
    const supabase = supabaseBrowser;
    if (!selectedFile || !supabase) return null;

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error('Error al subir la imagen');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Get the session token
      const supabase = supabaseBrowser;
      if (!supabase) {
        throw new Error('Error al conectar con la base de datos.');
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No se encontró sesión de usuario. Por favor, inicie sesión.');
      }

      // 1. Upload image if a file is selected
      let imageUrl = formData.imagen as string | null;
      if (selectedFile) {
        // Use the actual user ID from the session if creating, otherwise from editingUser
        const tempUserId = editingUser?.id || session.user.id;
        imageUrl = await uploadImage(tempUserId);
      } else if (formData.imagen === null) {
        imageUrl = null; // User removed the image
      }

      // 2. Prepare data to send
      const userData = {
        nombre: formData.nombre,
        email: formData.email,
        imagen: imageUrl,
        id_rol: formData.id_rol, // Ensure id_rol is sent
        ...(formData.contrasena && { contrasena: formData.contrasena })
      };

      // 3. Send to API
      const endpoint = editingUser
        ? `/api/admin/users/${editingUser.id}` // PUT endpoint with ID
        : '/api/admin/users'; // POST endpoint without ID

      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Send the Authorization header
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la operación');
      }

      // 4. Handle success
      onSuccess();
      resetForm();

      if (!editingUser) {
        // If it's a creation, clear error message
        setError(null);
      }

    } catch (err: any) {
      console.error('Error in user operation:', err);
      setError(err.message);
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre Field */}
        <FormField
          label="Nombre Completo"
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Juan Pérez"
          required
        />

        {/* Email Field */}
        <EmailField
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Ej: usuario@ejemplo.com"
          required
          disabled={!!editingUser} // Do not allow changing email in edit mode
        />

        {/* Password Fields (only for new user or password change) */}
        {!editingUser && (
          <>
            <FormField
              label="Contraseña"
              type="password"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
            <FormField
              label="Confirmar Contraseña"
              type="password"
              name="confirmarContrasena"
              value={formData.confirmarContrasena}
              onChange={handleChange}
              placeholder="Repite la contraseña"
              required
            />
          </>
        )}

        {/* Role Selection Field */}
        <div className="space-y-2">
          <label htmlFor="id_rol" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rol
          </label>
          <select
            id="id_rol"
            name="id_rol"
            value={formData.id_rol}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Selecciona un rol</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Image Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Imagen de Perfil
          </label>

          {/* Image Preview */}
          {imagePreview && (
            <div className="flex items-center space-x-4 mb-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-16 w-16 rounded-full object-cover border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Eliminar Imagen
              </button>
            </div>
          )}

          {/* File Input */}
          <input
            type="file"
            id="imagen"
            name="imagen"
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900 dark:file:text-blue-100
              dark:hover:file:bg-blue-800"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Formatos soportados: JPG, PNG (Max. 2MB)
          </p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            } transition-colors`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : editingUser ? (
              'Actualizar Usuario'
            ) : (
              'Crear Usuario'
            )}
          </button>

          {editingUser && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-2 px-4 rounded-md font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export type { User };

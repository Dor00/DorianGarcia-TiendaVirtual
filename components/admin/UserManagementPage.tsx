// components/admin/UserManagementPage.tsx
// This file is part of a Next.js application for managing users in an admin panel.
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserCrudForm } from '@/components/user/UserCrudForm';
import { UsersTable } from '@/components/user/UsersTable';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { supabaseBrowser } from '@/lib/supabase';

export function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [crudOperationError, setCrudOperationError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Obtener token de acceso
  const getAccessToken = useCallback(async () => {
    try {
      if (!supabaseBrowser) {
        setAccessToken(null);
        return;
      }
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      setAccessToken(session?.access_token || null);
    } catch (err: any) {
      console.error("Error al obtener token:", err.message);
      setAccessToken(null);
    }
  }, []);

  // Configurar listener de autenticación
  useEffect(() => {
    getAccessToken();

    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (supabaseBrowser) {
      const { data } = supabaseBrowser.auth.onAuthStateChange((_event: any, session: { access_token: any; }) => {
        setAccessToken(session?.access_token || null);
      });
      authListener = data;
    }

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [getAccessToken]);

  // Función para cargar usuarios
  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;

    setLoadingUsers(true);
    setUsersError(null);

    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error ${response.status}`);
        } else {
          const text = await response.text();
          throw new Error(`Error ${response.status}: ${text}`);
        }
      }

      if (!contentType?.includes('application/json')) {
        throw new Error('Respuesta no válida del servidor');
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setUsersError(error.message || 'Error al cargar usuarios');

      // Redirigir si no está autorizado
      if (error.message.includes('401') || error.message.includes('403')) {
        router.push('/login');
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [accessToken, router]);

  // Efecto para cargar usuarios cuando cambia el token
  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken, fetchUsers]);

  // Manejar éxito en operaciones CRUD
  const handleCrudSuccess = useCallback(() => {
    setCrudOperationError(null);
    fetchUsers(); // Refrescar la lista después de operaciones exitosas
  }, [fetchUsers]);

  // Manejar errores en operaciones CRUD
  const handleCrudError = useCallback((message: string) => {
    setCrudOperationError(message);
  }, []);

  // Manejar edición de usuario
  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    setCrudOperationError(null);
  }, []);

  // Manejar eliminación de usuario
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!accessToken) {
      setCrudOperationError('No autenticado');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      // Actualización optimista del estado
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error; // Propagar el error para que UsersTable lo maneje
    }
  }, [accessToken]);

  // Manejar cancelación de edición
  const handleCancelEdit = useCallback(() => {
    setEditingUser(null);
    setCrudOperationError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-full lg:max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Gestión de Usuarios
          </h1>
          {editingUser && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancelar Edición
            </button>
          )}
        </div>

        {crudOperationError && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-100">
            <p className="font-bold">Error:</p>
            <p>{crudOperationError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UserCrudForm
              editingUser={editingUser}
              onSuccess={handleCrudSuccess}
              onError={handleCrudError}
              onCancelEdit={handleCancelEdit} onSuccessAndRefresh={function (): void {
                throw new Error('Function not implemented.');
              }} />
          </div>
          <div className="lg:col-span-2">
            <UsersTable
              users={users}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              loading={loadingUsers}
              error={usersError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

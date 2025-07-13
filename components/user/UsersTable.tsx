"use client";

import React, { useState } from 'react';
import { User } from './UserCrudForm';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function UsersTable({ users, onEdit, onDelete, loading, error }: UsersTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    setDeletingId(userId);
    setDeleteError(null);
    try {
      await onDelete(userId);
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(err.message || 'Error al eliminar usuario');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Lista de Usuarios</h2>

      {/* Estados de carga y error */}
      {loading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-500">Cargando usuarios...</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {deleteError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
          <strong>Error al eliminar:</strong> {deleteError}
        </div>
      )}

      {/* Tabla de usuarios */}
      {!loading && !error && users.length === 0 ? (
        <div className="text-center p-6 text-gray-500 dark:text-gray-400">
          No se encontraron usuarios registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avatar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.imagen ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={user.imagen}
                          alt={`Avatar de ${user.nombre}`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {user.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.rol === 'admin' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 disabled:opacity-50"
                      disabled={deletingId === user.id}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      disabled={deletingId === user.id}
                    >
                      {deletingId === user.id ? (
                        <>
                          <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Eliminando...
                          </span>
                        </>
                      ) : (
                        'Eliminar'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
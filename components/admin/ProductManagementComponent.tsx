//components/admin/ProductManagementComponent.tsx..
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { Product } from '@/types'; // Import Product from shared types

export function ProductManagementComponent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const getAccessToken = useCallback(async () => {
    try {
      if (!supabaseBrowser) {
        setAccessToken(null);
        console.warn("Supabase no inicializado.");
        return;
      }
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      setAccessToken(session?.access_token || null);
    } catch (err: any) {
      console.error("Error al obtener token:", err.message);
      setAccessToken(null);
    }
  }, []);

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

  useEffect(() => {
    if (accessToken) {
      fetchProducts();
    }
  }, [accessToken]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!accessToken) return;

      const response = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar productos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      if (!accessToken) {
        alert("No autenticado.");
        return;
      }
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert("Error al eliminar: " + err.message);
    }
  };

  // Adjusted type for productData to align with Product interface
  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'creado_en' | 'actualizado_en' | 'imagen_url'>, id?: string) => {
    try {
      if (!accessToken) {
        alert("No autenticado.");
        return;
      }

      const form = document.querySelector('form');
      const fileInput = form?.querySelector<HTMLInputElement>('#image_file');
      const file = fileInput?.files?.[0];

      const formData = new FormData();
      formData.append('nombre', productData.nombre);
      // FIX: Convert descripcion to string, handling null explicitly
      formData.append('descripcion', productData.descripcion || ''); //
      formData.append('precio', productData.precio.toString());
      formData.append('stock', productData.stock.toString());

      if (file) {
        formData.append('image_file', file);
      }

      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/admin/products/${id}` : '/api/admin/products';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert("Error al guardar: " + err.message);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8"> {/* Adjusted padding */}
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Gestión de Productos</h1>
      <button
        onClick={handleCreateProduct}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4 text-sm md:text-base"
      >
        Añadir Nuevo Producto
      </button>

      {loading && <p className="text-gray-400 text-sm">Cargando productos...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>} {/* Smaller text */}

      {!loading && !error && products.length === 0 && (
        <p className="text-gray-400 text-sm">No hay productos.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="bg-gray-800 p-2 md:p-4 rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 md:px-6 md:py-3">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 md:px-6 md:py-3">Nombre</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 md:px-6 md:py-3">Precio</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 md:px-6 md:py-3">Stock</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 md:px-6 md:py-3">Imagen</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-300 md:px-6 md:py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-3 py-3 text-gray-200 text-sm md:px-6 md:py-4">{product.id.substring(0, 6)}...</td>
                  <td className="px-3 py-3 text-gray-200 text-sm md:px-6 md:py-4">{product.nombre}</td>
                  <td className="px-3 py-3 text-gray-200 text-sm md:px-6 md:py-4">${product.precio?.toFixed(2) || 'N/A'}</td>
                  <td className="px-3 py-3 text-gray-200 text-sm md:px-6 md:py-4">{product.stock}</td>
                  <td className="px-3 py-3 md:px-6 md:py-4">
                    {product.imagen_url ? (
                      <img src={product.imagen_url} alt={product.nombre} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <span className="text-gray-400 text-xs">Sin imagen</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-sm md:px-6 md:py-4">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-indigo-400 hover:text-indigo-600 mr-2 md:mr-4 text-xs md:text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-400 hover:text-red-600 text-xs md:text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        // Adjusted modal max-width and padding
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-sm md:max-w-md"> {/* Smaller max-width */}
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
              {editingProduct ? 'Editar Producto' : 'Añadir Producto'}
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              // Ensure descripion can be null based on types/index.ts
              const productData = {
                nombre: formData.get('nombre') as string,
                descripcion: (formData.get('descripcion') as string) || null, // Allow null
                precio: parseFloat(formData.get('precio') as string),
                stock: parseInt(formData.get('stock') as string),
              };
              await handleSaveProduct(productData, editingProduct?.id);
            }}>
              <div className="mb-3 md:mb-4"> {/* Smaller margins */}
                <label className="block text-gray-300 text-xs md:text-sm font-bold mb-1 md:mb-2">Nombre:</label>
                <input
                  type="text"
                  name="nombre"
                  defaultValue={editingProduct?.nombre || ''}
                  className="shadow border border-gray-700 rounded w-full py-1.5 px-2 bg-gray-800 text-gray-200 text-sm" // Smaller padding/text
                  required
                />
              </div>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-300 text-xs md:text-sm font-bold mb-1 md:mb-2">Descripción:</label>
                <textarea
                  name="descripcion"
                  defaultValue={editingProduct?.descripcion || ''}
                  className="shadow border border-gray-700 rounded w-full py-1.5 px-2 bg-gray-800 text-gray-200 text-sm" // Smaller padding/text
                  rows={2} // Reduced rows
                  required
                />
              </div>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-300 text-xs md:text-sm font-bold mb-1 md:mb-2">Precio:</label>
                <input
                  type="number"
                  name="precio"
                  step="0.01"
                  defaultValue={editingProduct?.precio || ''}
                  className="shadow border border-gray-700 rounded w-full py-1.5 px-2 bg-gray-800 text-gray-200 text-sm"
                  required
                />
              </div>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-300 text-xs md:text-sm font-bold mb-1 md:mb-2">Stock:</label>
                <input
                  type="number"
                  name="stock"
                  defaultValue={editingProduct?.stock || ''}
                  className="shadow border border-gray-700 rounded w-full py-1.5 px-2 bg-gray-800 text-gray-200 text-sm"
                  required
                />
              </div>
              <div className="mb-4 md:mb-6">
                <label className="block text-gray-300 text-xs md:text-sm font-bold mb-1 md:mb-2">Imagen (opcional):</label>
                <input
                  type="file"
                  id="image_file"
                  name="image_file"
                  accept="image/*"
                  className="shadow border border-gray-700 rounded w-full py-1.5 px-2 bg-gray-800 text-gray-200 text-sm"
                />
              </div>
              <div className="flex justify-between gap-2"> {/* Added gap */}
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-sm flex-grow"> {/* Adjusted padding/text, added flex-grow */}
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1.5 px-3 rounded text-sm flex-grow" // Adjusted padding/text, added flex-grow
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
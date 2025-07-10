// components/products/ProductManagement.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { ProductForm } from './ProductForm';

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string;
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabaseBrowser) {
        throw new Error('Supabase client is not initialized.');
      }
      const { data, error: fetchError } = await supabaseBrowser
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err.message);
      setError(`Error al cargar productos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!supabaseBrowser) {
        throw new Error('Supabase client is not initialized.');
      }
      const { error: deleteError } = await supabaseBrowser
        .from('productos')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }
      await fetchProducts(); // Recargar la lista
    } catch (err: any) {
      console.error('Error deleting product:', err.message);
      setError(`Error al eliminar producto: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingProduct(undefined);
    fetchProducts(); // Refrescar la lista después de guardar
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  if (loading) return <p className="text-gray-300">Cargando productos...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-gray-900 bg-opacity-70 p-8 rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-green-400">Gestión de Productos</h2>

      {!showForm ? (
        <>
          <button
            onClick={handleNewProduct}
            className="mb-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors duration-200 shadow-md"
          >
            Añadir Nuevo Producto
          </button>
          {products.length === 0 ? (
            <p className="text-gray-400">No hay productos registrados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col">
                  {product.imagen_url && (
                    <img src={product.imagen_url} alt={product.nombre} className="w-full h-40 object-cover rounded-md mb-4" />
                  )}
                  <h3 className="text-xl font-semibold text-white mb-2">{product.nombre}</h3>
                  <p className="text-gray-300 text-sm mb-2 flex-grow">{product.descripcion}</p>
                  <p className="text-blue-400 font-bold text-lg mb-2">${product.precio.toFixed(2)}</p>
                  <p className={`text-sm ${product.stock > 10 ? 'text-green-500' : product.stock > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                    Stock: {product.stock}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm transition-colors duration-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors duration-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <ProductForm product={editingProduct} onSave={handleFormSave} onCancel={handleFormCancel} />
      )}
    </div>
  );
}

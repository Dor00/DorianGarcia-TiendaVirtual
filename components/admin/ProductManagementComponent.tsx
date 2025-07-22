'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url?: string;
}

export function ProductManagementComponent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      } else {
        console.error('Error al obtener productos:', data.message || data.error);
      }
    } catch (err) {
      console.error('Error inesperado al obtener productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/products/edit/${id}`);
  };

  const handleCreate = () => {
    router.push(`/admin/products/create`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
      const res = await fetch(`/api/admin/products/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        console.error('Error al eliminar producto:', data.message || data.error);
      }
    } catch (err) {
      console.error('Error inesperado al eliminar producto:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-white">Cargando productos...</div>
    );
  }

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Gestión de Productos</h2>

      <button
        onClick={handleCreate}
        className="mb-6 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        Crear Producto
      </button>

      <div className="grid gap-4">
        {products.length === 0 && (
          <div>No hay productos disponibles.</div>
        )}
        {products.map((producto) => (
          <div key={producto.id} className="p-4 border border-gray-700 rounded bg-gray-900">
            <h3 className="text-xl font-semibold">{producto.nombre}</h3>
            <p className="text-gray-400">{producto.descripcion}</p>
            <p>Precio: ${producto.precio}</p>
            <p>Stock: {producto.stock}</p>
            {producto.imagen_url && (
              <img src={producto.imagen_url} alt={producto.nombre} className="w-32 mt-2 rounded" />
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleEdit(producto.id)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(producto.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface EditProductFormProps {
  product: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    imagen_url?: string;
  };
  onUpdated?: () => void; // Callback opcional para recargar lista o cerrar modal
}

export function EditProductForm({ product, onUpdated }: EditProductFormProps) {
  const [formData, setFormData] = useState({ ...product });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'precio' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/products/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando producto');
      }

      setSuccess('Producto actualizado correctamente');
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow-md">
      <h2 className="text-xl font-semibold">Editar Producto</h2>

      <input
        type="text"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        placeholder="Nombre del producto"
        className="w-full border px-3 py-2 rounded"
      />
      <textarea
        name="descripcion"
        value={formData.descripcion}
        onChange={handleChange}
        placeholder="Descripción"
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="number"
        name="precio"
        value={formData.precio}
        onChange={handleChange}
        placeholder="Precio"
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="number"
        name="stock"
        value={formData.stock}
        onChange={handleChange}
        placeholder="Stock"
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="text"
        name="imagen_url"
        value={formData.imagen_url || ''}
        onChange={handleChange}
        placeholder="URL de imagen (opcional)"
        className="w-full border px-3 py-2 rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">{success}</p>}
    </form>
  );
}

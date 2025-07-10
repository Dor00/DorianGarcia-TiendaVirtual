// components/products/ProductForm.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase'; // Asegúrate de que esta ruta sea correcta

interface Product {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string;
}

interface ProductFormProps {
  product?: Product; // Para edición
  onSave: () => void; // Callback para recargar la lista después de guardar
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagen_url: '',
    ...(product || {}), // Rellena si es una edición
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: 0,
        stock: 0,
        imagen_url: '',
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!supabaseBrowser) {
        throw new Error("Supabase client is not initialized.");
      }

      if (product?.id) {
        // Actualizar producto
        const { data, error: updateError } = await supabaseBrowser
          .from('productos')
          .update(formData)
          .eq('id', product.id)
          .select();

        if (updateError) {
          throw updateError;
        }
        console.log('Producto actualizado:', data);
      } else {
        // Crear nuevo producto
        const { data, error: insertError } = await supabaseBrowser
          .from('productos')
          .insert(formData)
          .select();

        if (insertError) {
          throw insertError;
        }
        console.log('Nuevo producto creado:', data);
      }
      onSave(); // Llama al callback para refrescar la lista o cerrar el formulario
    } catch (err: any) {
      console.error('Error al guardar producto:', err.message);
      setError(`Error al guardar producto: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-4 text-blue-300">{product ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-gray-300 text-sm font-bold mb-2">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="descripcion" className="block text-gray-300 text-sm font-bold mb-2">Descripción:</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
            rows={3}
          ></textarea>
        </div>
        <div>
          <label htmlFor="precio" className="block text-gray-300 text-sm font-bold mb-2">Precio:</label>
          <input
            type="number"
            id="precio"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-gray-300 text-sm font-bold mb-2">Stock:</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
            min="0"
            required
          />
        </div>
        <div>
          <label htmlFor="imagen_url" className="block text-gray-300 text-sm font-bold mb-2">URL de la Imagen:</label>
          <input
            type="text"
            id="imagen_url"
            name="imagen_url"
            value={formData.imagen_url}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
          />
          {formData.imagen_url && (
            <img src={formData.imagen_url} alt="Vista previa" className="mt-2 w-24 h-24 object-cover rounded" />
          )}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (product ? 'Actualizar Producto' : 'Crear Producto')}
          </button>
        </div>
      </form>
    </div>
  );
}

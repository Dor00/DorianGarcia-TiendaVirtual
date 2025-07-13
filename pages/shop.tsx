"use client";

import React, { useEffect, useState } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/shop/Navbar';
import { useRouter } from 'next/router';

function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('id, nombre, descripcion, precio, imagen_url, stock');

        if (error) throw new Error(error.message);

        setProducts(
          (data || []).map((item: any) => ({
            ...item,
            creado_en: item.creado_en ?? null,
            actualizado_en: item.actualizado_en ?? null,
          }))
        );
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(`Error al cargar los productos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
      toast.success('✅ Producto añadido al carrito!');
    } catch (err: any) {
      toast.error(`❌ Error al añadir al carrito: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p className="text-lg animate-pulse">Cargando productos...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl text-center text-indigo-400 font-bold mb-12">Nuestros Productos</h1>

          {products.length === 0 ? (
            <p className="text-center text-2xl text-gray-400">No hay productos disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Ícono flotante del carrito */}
      <div
        onClick={() => router.push('/cart')}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110"
        title="Ver Carrito"
      >
        🛒
      </div>
    </>
  );
}

export default ShopPage;

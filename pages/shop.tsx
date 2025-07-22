// pages/shop.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

import Navbar from '@/components/shop/Navbar';
import ProductGrid from '@/components/shop/ProductGrid';
import { Loader } from '@/components/ui/Loader';
import { ErrorPage } from '@/components/ui/ErrorPage';
import { fetchAllProducts } from '@/lib/services/productService';

function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await fetchAllProducts();
        setProducts(result);
      } catch (err: any) {
        setError(`Error al cargar productos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
      toast.success('✅ Producto añadido al carrito!');
    } catch (err: any) {
      toast.error(`❌ Error al añadir al carrito: ${err.message}`);
    }
  };

  if (loading) return <Loader message="Cargando productos..." />;
  if (error) return <ErrorPage message={error} />;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl text-center text-indigo-400 font-bold mb-12">Nuestros Productos</h1>
          <ProductGrid products={products} onAddToCart={handleAddToCart} />
        </div>
      </main>

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

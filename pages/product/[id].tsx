// pages/product/[id].tsx 

"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/types"; // Assuming Product interface is defined in '@/types'
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import toast from "react-hot-toast";
import Navbar from "@/components/shop/Navbar";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);      
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, descripcion, precio, imagen_url, stock, creado_en, actualizado_en") 
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error cargando producto:", error.message);
        setProduct(null);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]); // Dependencia 'id' es correcta aquí

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product, 1);
      toast.success("Producto añadido al carrito");
    } catch (err: any) {
      toast.error("Error al añadir al carrito: " + err.message);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-20">Cargando...</div>;
  }

  if (!product) {
    return <div className="text-red-400 text-center py-20">Producto no encontrado.</div>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4 flex items-center justify-center">
            <Image
              src={product.imagen_url || "/placeholder-product.png"}
              alt={product.nombre}
              width={500}
              height={500}
              className="object-contain w-full h-auto max-h-[500px]"
            />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-indigo-400">{product.nombre}</h1>
              <p className="text-lg text-gray-300 mb-4">{product.descripcion}</p>
              <p className="text-2xl font-bold text-green-400 mb-4">
                ${product.precio.toFixed(0)}
              </p>
              <p className="text-sm text-yellow-400 mb-6">{product.stock} en stock</p>
            </div>
            {product.stock > 0 ? (
              <button
                onClick={handleAddToCart}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-md text-lg transition"
              >
                Añadir al Carrito
              </button>
            ) : (
              <span className="text-red-500 font-semibold">Producto agotado</span>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// pages/success.tsx
"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";

export default function SuccessPage() {
  const router = useRouter();
  const { fetchCart } = useCart();

  useEffect(() => {
    const limpiarCarrito = () => {
      localStorage.removeItem("cart_anonymous");
      fetchCart(); // Esto recargará el carrito desde Supabase (vacío)
    };

    limpiarCarrito();

    const timer = setTimeout(() => {
      router.push("/shop");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, fetchCart]);

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400 mb-4">¡Pago exitoso!</h1>
        <p className="text-lg mb-6">Gracias por tu compra. Serás redirigido a la tienda en breve.</p>
        <button
          onClick={() => router.push("/shop")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          Ir a la Tienda
        </button>
      </div>
    </main>
  );
}

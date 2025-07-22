"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import { useRouter } from "next/router";
import { supabaseBrowser } from "@/lib/supabase";
import { Loader } from "@/components/ui/Loader";
import { ErrorPage } from "@/components/ui/ErrorPage";

export default function CartPage() {
  const [error, setError] = useState<string | null>(null);
  const { cart, updateCartItemQuantity, removeCartItem, fetchCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");

    if (status === "failure" || status === "pending") {
      localStorage.removeItem("cart_anonymous");
      fetchCart();
      router.replace("/cart");
    }
  }, [router, fetchCart]);

  const total = cart.reduce(
    (sum, item) => sum + item.cantidad * (item.productos.precio || 0),
    0
  );

  if (error) return <ErrorPage message={error} />;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Tu Carrito</h1>

        {cart.length === 0 ? (
          <p className="text-center text-gray-400">Tu carrito está vacío.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center bg-gray-800 rounded-lg p-4 gap-4"
              >
                <div className="relative w-24 h-24">
                  <Image
                    src={item.productos.imagen_url || "/placeholder-product.png"}
                    alt={item.productos.nombre}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{item.productos.nombre}</h2>
                  <p className="text-gray-400">
                    ${item.productos.precio.toFixed(2)} COP
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateCartItemQuantity(item.id, item.cantidad - 1)
                      }
                      className="bg-gray-700 px-2 py-1 rounded hover:bg-gray-600"
                    >
                      -
                    </button>
                    <span className="px-2">{item.cantidad}</span>
                    <button
                      onClick={() =>
                        updateCartItemQuantity(item.id, item.cantidad + 1)
                      }
                      className="bg-gray-700 px-2 py-1 rounded hover:bg-gray-600"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeCartItem(item.id)}
                      className="ml-4 text-red-500 hover:text-red-400"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-right mt-6">
              <p className="text-2xl font-bold mb-4">
                Total: ${total.toFixed(2)} COP
              </p>
              <button
                onClick={() => router.push("/checkout")}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Ir a Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

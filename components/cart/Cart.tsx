"use client";
import React, { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import toast from "react-hot-toast";

export default function Cart() {
  const { cart, loading, fetchCart, updateCartItemQuantity, removeCartItem } = useCart();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Cargando carrito...
      </main>
    );
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => {
      const precio = item.productos?.precio ?? 0;
      return sum + precio * item.cantidad;
    }, 0);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        

        {cart.length === 0 ? (
          <p className="text-center text-2xl text-gray-300">Se encuentra vacío.</p>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl mb-4 text-purple-400">Tu Carrito de Compras</h2>
            {cart.map((item) => (
              <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center space-x-4">
                
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={item.productos?.imagen_url || "/placeholder-product.png"}
                    alt={item.productos?.nombre || "Producto"}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg font-bold">{item.productos?.nombre || "Producto"}</h3>
                  <p className="text-gray-300">
                    Precio unitario: ${item.productos?.precio?.toFixed(2) ?? "0.00"}
                  </p>
                  <p className="text-gray-300">
                    Total: ${(item.productos?.precio ?? 0 * item.cantidad).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.cantidad - 1)}
                    className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white"
                    disabled={item.cantidad <= 1}
                  >
                    -
                  </button>
                  <span>{item.cantidad}</span>
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.cantidad + 1)}
                    className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeCartItem(item.id)}
                    className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-white ml-2"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            <h2 className="text-2xl text-right mt-8">
              Total: <span className="text-blue-400">${getTotal().toFixed(2)}</span>
            </h2>
          </div>
        )}
      </div>
    </main>
  );
}

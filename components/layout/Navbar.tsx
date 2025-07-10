"use client";
import { useCart } from "@/hooks/useCart";
import { supabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/router";
import React from "react";

export default function Navbar() {
  const { cart, loading } = useCart();
  const router = useRouter();

  const totalCartItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  const handleLogout = async () => {
    if (supabaseBrowser) {
      await supabaseBrowser.auth.signOut();
      router.push("/login");
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push("/shop")}>
        Mi Tienda
      </h1>

      <div className="flex items-center space-x-4">
        <div
          onClick={() => router.push("/cart")}
          className="relative cursor-pointer bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded"
          title="Ver Carrito"
        >
          🛒
          {totalCartItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {totalCartItems}
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Login
        </button>
      </div>
    </nav>
  );
}

// pages/checkout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/router";
import { supabaseBrowser } from "@/lib/supabase";
import Image from "next/image";
import axios from "axios";
import { Loader } from "@/components/ui/Loader";
import { ErrorPage } from "@/components/ui/ErrorPage";

export default function CheckoutPage() {
    const { cart, fetchCart } = useCart();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabaseBrowser.auth.getUser();
            if (error || !user) {
                router.push("/login");
            } else {
                setUserId(user.id);
            }
        };
        fetchUser();
        fetchCart();
    }, [router, fetchCart]);

    const total = cart.reduce(
        (sum, item) => sum + item.cantidad * (item.productos.precio || 0),
        0
    );

   // Fragmento modificado dentro de CheckoutPage
const handlePay = async () => {
    setLoading(true);
    setError(null);
  
    try {
      if (!userId) throw new Error("Usuario no autenticado.");
      if (cart.length === 0) throw new Error("El carrito está vacío.");
  
      // Obtener el token de acceso
      const { data: sessionData, error: sessionError } = await supabaseBrowser.auth.getSession();
      const access_token = sessionData?.session?.access_token;
  
      if (sessionError || !access_token) {
        throw new Error("No se pudo obtener el token de sesión.");
      }
  
      // Crear el pedido
      const { data: orderData }: { data: { order: any } } = await axios.post(
        "/api/orders/create",
        {
          total,
          items: cart,
          user_id: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
  
      const order = orderData.order;
  
      // Crear preferencia de pago
      const response = await axios.post("/api/mercadopago/create-preference", {
        items: cart,
        order_id: order.id,
      });
  
      if (
        response.data &&
        typeof response.data === "object" &&
        "init_point" in response.data &&
        typeof response.data.init_point === "string"
      ) {
        window.location.href = response.data.init_point;
      } else {
        throw new Error("No se recibió enlace de pago.");
      }
    } catch (err: any) {
      console.error("Error en checkout:", err.message);
      setError(err.message);
      setLoading(false);
    }
  };


    if (loading) return <Loader message="Redirigiendo a MercadoPago..." />;
    if (error) return <ErrorPage message={error} />;

    return (
        <main className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Resumen del Pedido</h1>

                {cart.length === 0 ? (
                    <p className="text-gray-400">Tu carrito está vacío.</p>
                ) : (
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center bg-gray-800 rounded-lg p-4 gap-4"
                            >
                                <div className="relative w-20 h-20">
                                    <Image
                                        src={item.productos.imagen_url || "/placeholder-product.png"}
                                        alt={item.productos.nombre}
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold">{item.productos.nombre}</h2>
                                    <p className="text-sm text-gray-400">
                                        {item.cantidad} × ${item.productos.precio.toFixed(2)} COP
                                    </p>
                                </div>
                                <div className="text-right font-bold">
                                    ${item.cantidad * item.productos.precio} COP
                                </div>
                            </div>
                        ))}

                        <div className="text-right mt-6">
                            <p className="text-2xl font-bold mb-4">Total: ${total.toFixed(2)} COP</p>
                            <button
                                onClick={handlePay}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
                            >
                                Confirmar y Pagar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

// pages/success.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useCart } from "@/hooks/useCart";
import { SuccessPage } from "@/components/ui/SuccessPage";

export default function PaymentSuccess() {
  const router = useRouter();
  const { fetchCart } = useCart();

  useEffect(() => {
    const limpiarCarrito = () => {
      localStorage.removeItem("cart_anonymous");
      fetchCart(); // Recarga el carrito desde Supabase (vacío)
    };

    limpiarCarrito();

    const timer = setTimeout(() => {
      router.push("/shop");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, fetchCart]);

  return (
    <SuccessPage
      title="¡Pago exitoso!"
      message="Gracias por tu compra. Serás redirigido a la tienda en breve."
      actionLabel="Ir a la Tienda"
      onAction={() => router.push("/shop")}
    />
  );
}

// pages/pending.tsx
"use client";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";

export default function PendingPage() {
  const router = useRouter();

  useEffect(() => {
    console.warn("Redirigido a la página de pago pendiente.");
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4 text-yellow-400">¡Pago pendiente!</h1>
      <p className="text-lg mb-6">Tu pago está en proceso. Te notificaremos cuando se confirme.</p>
      <div className="flex gap-4">
        <Link href="/shop" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

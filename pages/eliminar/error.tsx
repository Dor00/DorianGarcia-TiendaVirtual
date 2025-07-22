// pages/error.tsx
"use client";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage() {
  const router = useRouter();

  useEffect(() => {
    console.warn("Redirigido a la página de error de pago.");
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4 text-red-500">¡Error en el pago!</h1>
      <p className="text-lg mb-6">Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.</p>
      <div className="flex gap-4">
        <Link href="/shop" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold">
          Volver a la tienda
        </Link>
        <button
          onClick={() => router.back()}
          className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}

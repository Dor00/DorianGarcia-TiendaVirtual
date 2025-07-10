// pages/index.tsx
"use client";
import * as React from "react";
import Image from 'next/image';
import { Header } from "../components/inicial/Header";
import { ActionButtons } from "../components/inicial/ActionButtons";
import { Footer } from "../components/inicial/Footer";

export default function HomeDesktop() {
  // ¡Ahora usamos la ruta de tu imagen local!
  const backgroundImageSrc = "/fondoInicial.png"; // Ruta directa desde la carpeta 'public'

  return (
    <main className="flex overflow-hidden relative flex-col text-center min-h-screen bg-gray-900">
      <Image
        src={backgroundImageSrc}
        alt="Fondo de Tienda Virtual"
        layout="fill"
        objectFit="cover"
        quality={75}
        className="absolute inset-0 z-0 opacity-30"
        priority
      />

      <div className="relative z-10 flex flex-col flex-grow justify-between">
        <Header title="Tienda Virtual" />
        <ActionButtons />
        <Footer
          tagline="Experimenta el futuro de las compras."
          brandName="UdeA"
        />
      </div>
    </main>
  );
}
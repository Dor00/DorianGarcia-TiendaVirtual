// pages/signUp/index.tsx
"use client";

import Image from 'next/image';
import { SignUpForm } from '@/components/signUp/SignUpForm';

export default function SignUpPage() {
  const backgroundImageSrc = "/fondoInicial.png";

  return (
    <main className="relative flex justify-center items-center min-h-screen p-4 font-sans">
      <Image
        src={backgroundImageSrc}
        alt="Fondo de Tienda Virtual"
        layout="fill"
        objectFit="cover"
        quality={75}
        className="absolute inset-0 z-0 opacity-100"
        priority
      />

      <div className="relative z-10 flex flex-col self-center max-w-sm w-full px-6 py-10 text-white rounded-lg shadow-xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Tienda Virtual</h1>
          <p className="text-xl text-gray-300 mt-2">Crea una cuenta</p>
        </div>
        <SignUpForm />
      </div>
    </main>
  );
}
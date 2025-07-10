// components/inicial/ActionButtons.tsx
"use client";
import { useRouter } from 'next/router';
import React from 'react'; // Importa React

export function ActionButtons() {
  const router = useRouter();

  const baseButtonClasses = `
    w-full max-w-[396px] py-4 rounded-md font-semibold text-lg transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
  `;
  
  const primaryButtonClasses = `
    ${baseButtonClasses}
    bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500
  `;

  const secondaryButtonClasses = `
    ${baseButtonClasses}
    bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 focus:ring-gray-500
  `;

  return (
    <section className="relative flex flex-col items-center justify-center flex-grow gap-6 p-4">
      <button
        onClick={() => router.push('/login')}
        className={primaryButtonClasses}
      >
        Iniciar sesión
      </button>
      <button
        onClick={() => router.push('/signUp')}
        className={secondaryButtonClasses}
      >
        Registrarse
      </button>
    </section>
  );
}


// pages/signUp/index.tsx
"use client";

import Image from 'next/image'; // Importa el componente Image de Next.js
import { SignUpForm } from '@/components/signUp/SignUpForm';





export default function Registro() {
  // Define la ruta de tu imagen de fondo
  const backgroundImageSrc = "/fondoInicial.png"; // Asegúrate de que esta ruta sea correcta

  return (
    <main className="relative flex justify-center items-center min-h-screen p-4">
      {/* Componente Image para la imagen de fondo */}
      <Image
        src={backgroundImageSrc}
        alt="Fondo de Tienda Virtual"
        layout="fill" // Hace que la imagen ocupe todo el contenedor padre
        objectFit="cover" // Ajusta la imagen para cubrir el espacio sin distorsión
        quality={75} // Reduce la calidad para optimizar el rendimiento
        className="absolute inset-0 z-0 opacity-100" // Set opacity to 100% for the background image
        priority // Considera esto si es una de las primeras imágenes en cargar
      />

      {/* Contenedor del formulario, sobrepuesto a la imagen de fondo */}
      <div className="relative z-10 flex flex-col self-center max-w-sm w-full px-6 py-10 bg-black bg-opacity-50 text-white rounded-lg shadow-lg backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Tienda Virtual</h1>
          <p className="text-xl text-gray-300 mt-2">Crea una cuenta</p>
        </div>
        <SignUpForm
          onSignUpSuccess={() => {
            // handle successful sign up, e.g., redirect or show a message
          }}
          onError={(error) => {
            // handle error, e.g., show error message
            console.error(error);
          }}
        />
      </div>
    </main>
  );
}
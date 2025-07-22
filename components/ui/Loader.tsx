// components/ui/Loader.tsx
export const Loader = ({ message = 'Cargando...' }) => (
    <main className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <p className="text-lg animate-pulse">{message}</p>
    </main>
  );
  
  
  
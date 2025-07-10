// pages/unauthorized.tsx
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4">Acceso Denegado</h1>
      <p className="text-xl text-gray-300 mb-8">No tienes los permisos necesarios para ver esta página.</p>
      <Link href="/login" className="px-6 py-3 bg-blue-600 rounded-md text-lg hover:bg-blue-700 transition-colors">
        Ir a Iniciar Sesión
      </Link>
    </div>
  );
}
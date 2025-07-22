// pages/admin/products.tsx
"use client"; // This component will run on the client-side

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Header } from '@/components/head/Header';
import { DashboardSidebar } from '@/components/sidebar/DashboardSidebar';
import { supabaseBrowser } from '@/lib/supabase'; // Adjust path if necessary
import { User } from '@/types'; // Assuming you have your User type
import Link from 'next/link'; // For linking to create/edit pages

// Define a type for your product data
interface Product {
  id: string; // Or number, depending on your Supabase table schema
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string | null;
  // Add other fields from your 'productos' table as needed
}

export default function ProductsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarActiveContent, setSidebarActiveContent] = useState('product-management');

  // Re-use the fetchUserSession logic (or similar) from create.tsx
  const fetchUserSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(sessionError?.message || "No active session found");
      }

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select(`
          id,
          nombre,
          email,
          imagen,
          roles!inner(nombre)
        `)
        .eq('id', session.user.id)
        .single();

      if (userError || !userData || !userData.roles || !userData.roles.nombre) {
        throw new Error(userError?.message || "User data or role not found");
      }

      const formattedUser: User = {
        id: userData.id,
        nombre: userData.nombre,
        email: userData.email,
        imagen: userData.imagen,
        roles: {
          nombre: userData.roles.nombre
        }
      };

      setUser(formattedUser);
    } catch (err: any) {
      console.error("Error in fetchUserSession:", err.message);
      setError(err.message);
      setUser(null);
    } finally {
      // Keep loading true until products are fetched, or set it to false here if products fetch separately
    }
  }, []);

  // Function to fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase client not initialized.");
      }

      const { data, error: fetchError } = await supabase
        .from('productos') // Your products table name
        .select('*') // Select all columns, or specific ones you need
        .order('created_at', { ascending: false }); // Order by creation date, newest first

      if (fetchError) {
        throw fetchError;
      }

      setProducts(data || []);
    } catch (err: any) {
      console.error("Error fetching products:", err.message);
      setError("Error al cargar productos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // First, fetch user session to ensure admin access
    fetchUserSession().then(() => {
      // Only fetch products if user is authenticated and confirmed as admin
      // You might want to pass the user object to fetchProducts or make fetchProducts
      // dependent on the user state for proper access control.
      // For simplicity here, assuming fetchUserSession sets user correctly for subsequent checks.
      fetchProducts();
    });

    const supabase = supabaseBrowser();
    const { data: authListener } = supabase?.auth.onAuthStateChange(
      (event: string, session: any) => {
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          fetchUserSession();
          fetchProducts(); // Re-fetch if auth state changes
        }
      }
    ) || { subscription: null };

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserSession, fetchProducts]); // Add fetchProducts to dependencies

  const handleSidebarNavigation = (content: string) => {
    setSidebarActiveContent(content);
    if (content === 'dashboard') {
      router.push('/admin/dashboard');
    } else if (content === 'user-management') {
      router.push('/admin/users');
    } else if (content === 'product-management') {
      // Already on this page, or navigate to it
      router.push('/admin/products');
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = supabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
      setUser(null);
      router.push('/login');
    } catch (err: any) {
      console.error("Logout failed:", err.message);
      setError(err.message);
    }
  };

  if (loading && !user && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-white text-xl">
        Cargando productos...
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        Error: {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        Acceso denegado. Por favor, inicia sesión.
      </div>
    );
  }

  if (!user.roles || user.roles.nombre.toLowerCase() !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        No tienes permisos de administrador para acceder a esta sección.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-800 text-white">
      <DashboardSidebar
        user={user}
        onNavigate={handleSidebarNavigation}
        activeContent={sidebarActiveContent}
      />
      <div className="flex flex-col flex-grow">
        <Header user={user} onLogout={handleLogout} />
        <main className="p-6 pt-[90px] w-full"> {/* Use w-full for wider content */}
          <h1 className="text-3xl font-bold mb-6">Gestión de Productos</h1>

          {/* Link to create new product */}
          <div className="mb-6 flex justify-between items-center">
            <Link href="/admin/products/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Crear Nuevo Producto
            </Link>
          </div>

          {error && products.length === 0 && <p className="text-red-500 mb-4">{error}</p>}

          {loading && products.length === 0 ? (
            <p>Cargando lista de productos...</p>
          ) : products.length === 0 ? (
            <p>No hay productos para mostrar. ¡Crea uno nuevo!</p>
          ) : (
            <div className="overflow-x-auto bg-gray-700 rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-600">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Imagen
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Precio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-700 divide-y divide-gray-600">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.imagen_url ? (
                          <img
                            src={product.imagen_url}
                            alt={product.nombre}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {product.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 max-w-xs overflow-hidden text-ellipsis">
                        {product.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        ${product.precio.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/products/edit/${product.id}`} className="text-indigo-400 hover:text-indigo-600 mr-4">
                          Editar
                        </Link>
                        {/* Implement delete functionality if needed */}
                        <button
                          onClick={() => alert(`Implementar eliminar para ${product.nombre}`)}
                          className="text-red-400 hover:text-red-600"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
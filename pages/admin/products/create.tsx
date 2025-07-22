// pages/admin/products/create.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Header } from '@/components/head/Header';
import { DashboardSidebar } from '@/components/sidebar/DashboardSidebar';
import { supabaseBrowser } from '@/lib/supabase'; // Assuming this exports a function
import { User } from '@/types'; // Assuming you have this User type defined

export default function CreateProductPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    imagen_url: '', // Will be set after file upload
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State to hold the selected file

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarActiveContent, setSidebarActiveContent] = useState('product-management');

  // Function to fetch user session and data (remains the same)
  const fetchUserSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseBrowser; // Call it as a function
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserSession();

    const supabase = supabaseBrowser; // Call it as a function
    const { data: authListener } = supabase?.auth.onAuthStateChange(
      (event: string, session: any) => {
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          fetchUserSession();
        }
      }
    ) || { subscription: null };

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserSession]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    let imageUrl = formData.imagen_url;

    const supabase = supabaseBrowser; // Call it as a function
    if (!supabase) {
      setError("Supabase client not initialized.");
      setLoading(false);
      return;
    }

    // Get the Supabase session token before attempting upload or product creation
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setError("User not authenticated. Please log in again.");
      setLoading(false);
      await supabase.auth.signOut(); // Force logout if session is bad
      router.push('/login');
      return;
    }

    const accessToken = session.access_token; // This is the JWT token

    // 1. Upload image if a file is selected
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

      try {
        const { data, error: uploadError } = await supabase.storage
          .from('productos') // Replace 'product_images' with your actual Supabase bucket name
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('productos') // Use your bucket name
          .getPublicUrl(fileName);

        if (publicUrlData) {
          imageUrl = publicUrlData.publicUrl;
          console.log("Image uploaded successfully:", imageUrl);
        } else {
          throw new Error("Could not get public URL for the uploaded image.");
        }

      } catch (err: any) {
        console.error("Error uploading image:", err.message);
        setError(`Error al subir imagen: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    // 2. Submit product data to your API
    const productDataToSubmit = {
      ...formData,
      imagen_url: imageUrl,
    };

    try {
      const res = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // IMPORTANT: Add the Authorization header with the Bearer token
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productDataToSubmit),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
            setError(data.error || 'No autorizado para crear producto. Por favor, inicia sesión como administrador.');
            // Optionally force logout if the token is truly invalid
            await supabase.auth.signOut();
            router.push('/login');
        } else if (res.status === 403) {
            setError(data.error || 'No tienes permisos de administrador para realizar esta acción.');
        }
        else {
            setError(data.error || 'Error al crear producto');
        }
      } else {
        setSuccess('Producto creado exitosamente');
        // Reset form including file input
        setFormData({
          nombre: '',
          descripcion: '',
          precio: '',
          stock: '',
          imagen_url: '',
        });
        setSelectedFile(null); // Clear selected file

        setTimeout(() => router.push('/admin/dashboard'), 1500); // Redirect to products list
      }
    } catch (err: any) {
        console.error("Error submitting product data:", err.message);
        setError("Error de conexión al servidor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarNavigation = (content: string) => {
    setSidebarActiveContent(content);
    if (content === 'dashboard') {
      router.push('/admin/dashboard');
    } else if (content === 'user-management') {
      router.push('/admin/users');
    } else if (content === 'product-management') {
      router.push('/admin/products'); // Navigate to the product list page
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = supabaseBrowser; // Call it as a function
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

  if (loading && !user) { // Only show full screen loading if user data is being fetched initially
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-white text-xl">
        Cargando...
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
    // This case might be hit briefly after logout before redirect, or if session check fails silently.
    // The fetchUserSession and handleSubmit now handle redirection to login more robustly.
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-800 text-red-500 text-xl">
        Acceso denegado. Por favor, inicia sesión.
      </div>
    );
  }

  // Double-check role after user data is loaded
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
        <main className="p-6 pt-[90px] max-w-2xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-6">Crear nuevo producto</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Nombre del producto"
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Descripción"
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              placeholder="Precio"
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="Stock"
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />

            <label htmlFor="product-image" className="block text-gray-300 text-sm mb-1">
              Imagen del Producto (Max 5MB)
            </label>
            <input
              type="file"
              id="product-image"
              name="image_file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 rounded bg-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="text-sm text-gray-400 mt-1">Archivo seleccionado: {selectedFile.name}</p>
            )}


            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              {loading ? 'Creando...' : 'Crear producto'}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
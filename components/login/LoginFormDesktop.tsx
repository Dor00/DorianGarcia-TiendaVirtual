// components/login/LoginFormDesktop.tsx
"use client";

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabaseBrowser } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginFormDesktop() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const backgroundImageSrc = "/fondoInicial.png";
  const hasProcessedRegistrationParam = useRef(false);

  useEffect(() => {
    const registrationSuccess = searchParams.get('registro');

    if (registrationSuccess === 'exitoso' && !hasProcessedRegistrationParam.current) {
      setMessage('¡Registro exitoso! Por favor, inicia sesión con tus nuevas credenciales.');
      hasProcessedRegistrationParam.current = true;

      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('registro');
      router.replace(`/login?${newSearchParams.toString()}`);
    } else if (registrationSuccess !== 'exitoso') {
      setMessage(null);
      hasProcessedRegistrationParam.current = false;
    }

    setLoading(false);
    setError(null);
  }, [searchParams, router]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!supabaseBrowser) {
        setError('Error interno: No se pudo inicializar Supabase.');
        setLoading(false);
        return;
      }

      const { data, error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Error de inicio de sesión:', signInError);
        if (signInError.message === 'Invalid login credentials') {
          setError('Correo electrónico o contraseña incorrectos.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Tu cuenta no ha sido confirmada. Revisa tu correo electrónico.');
        } else {
          setError(signInError.message || 'Ocurrió un error inesperado al iniciar sesión.');
        }
        setLoading(false);
        return;
      }

      if (!data.user || !data.session) {
        setMessage('Revisa tu correo electrónico para confirmar tu cuenta.');
        setLoading(false);
        return;
      }

      const userId = data.user.id;
      const { data: userData, error: userProfileError } = await supabaseBrowser
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single();

      if (userProfileError || !userData) {
        setError('No se pudo obtener la información de tu perfil. Contacta a soporte.');
        await supabaseBrowser.auth.signOut();
        setLoading(false);
        return;
      }

      const userRole = userData.rol;
      setMessage('Inicio de sesión exitoso. Redirigiendo...');

      setTimeout(() => {
        if (userRole === 'admin') {
          router.push('/admin/dashboard');
        } else if (userRole === 'user') {
          router.push('/shop');
        } else {
          setError('Tu rol de usuario no está definido o es inválido.');
          supabaseBrowser!.auth.signOut();
        }
      }, 500);

    } catch (err: any) {
      console.error('Error inesperado:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="relative z-10 flex flex-col self-center max-w-sm w-full px-6 py-10 bg-black bg-opacity-50 text-white rounded-lg shadow-xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Tienda Virtual</h1>
          <p className="text-xl text-gray-300 mt-2">Iniciar Sesión</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm mb-2">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-gray-700 bg-opacity-70 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-base"
              disabled={loading}
              placeholder="Tu correo electrónico"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm mb-2">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 bg-gray-700 bg-opacity-70 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-base"
              disabled={loading}
              placeholder="Tu contraseña"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center mt-2">{error}</div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-700 text-white text-center rounded border border-green-800 animate-fade-in-down">
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-md font-semibold text-lg transition-colors duration-200 mt-6
              ${loading ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div className="text-center text-sm mt-4">
          <p className="text-gray-400 inline">¿Aún no tienes cuenta? </p>
          <button
            type="button"
            onClick={() => router.push('/signUp')}
            className="text-blue-500 hover:underline font-bold transition-colors duration-200"
          >
            Regístrate
          </button>
        </div>
      </div>
    </main>
  );
}
// pages/_app.tsx
"use client";

import { Toaster } from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AppProps } from 'next/app';
import { Session } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase';
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/login', '/signUp', '/shop'];

  useEffect(() => {
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | undefined;

    const checkSession = async () => {
      if (!supabaseBrowser) {
        console.error("Supabase client not initialized.");
        setLoading(false);
        return;
      }

      const { data: { session: initialSession } } = await supabaseBrowser.auth.getSession();
      setSession(initialSession);
      
      const currentPath = window.location.pathname;
      const currentPathIsPublic = publicRoutes.includes(currentPath);
      
      if (!initialSession && !currentPathIsPublic) {
        router.push('/login');
      }
      setLoading(false);
    };

    checkSession();

    if (supabaseBrowser) {
      authListener = supabaseBrowser.auth.onAuthStateChange(
        async (_event: any, currentSession: React.SetStateAction<Session | null>) => {
          setSession(currentSession);
          const currentPath = window.location.pathname;
          const currentPathIsPublic = publicRoutes.includes(currentPath);
          if (!currentSession && !currentPathIsPublic) {
            router.push('/login');
          }
        }
      );
    }

    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, [router, publicRoutes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Cargando autenticación...
      </div>
    );
  }

  if (!supabaseBrowser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">
        Error: Supabase client no inicializado.
      </div>
    );
  }

  return (
    <SessionContextProvider supabaseClient={supabaseBrowser}>
      <Toaster position="top-center" />
      <Component {...pageProps} />
    </SessionContextProvider>
  );
}

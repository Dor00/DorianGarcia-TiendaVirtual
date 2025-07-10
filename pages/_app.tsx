// pages/_app.tsx
"use client";

import { Toaster } from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import { Session } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase';
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const publicRoutes = ['/', '/login', '/signUp', '/shop'];

  useEffect(() => {
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | undefined;

    const checkSession = async () => {
      const { data: { session: initialSession } } = await supabaseBrowser.auth.getSession();
      setSession(initialSession);
      const currentPathIsPublic = publicRoutes.includes(router.pathname);
      if (!initialSession && !currentPathIsPublic) {
        router.push('/login');
      }
      setLoading(false);
    };

    checkSession();

    if (supabaseBrowser && supabaseBrowser.auth) {
      authListener = supabaseBrowser.auth.onAuthStateChange(
        async (_event, currentSession) => {
          setSession(currentSession);
          const currentPathIsPublic = publicRoutes.includes(router.pathname);
          if (!currentSession && !currentPathIsPublic) {
            router.push('/login');
          }
        }
      );
    }

    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Cargando autenticación...
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

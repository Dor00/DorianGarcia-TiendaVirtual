// pages/_app.tsx
"use client";

import { Toaster } from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import { Session } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase'; // This should be your initialized Supabase client
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signUp', '/shop'];

  useEffect(() => {
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | undefined;

    const checkSession = async () => {
      // Ensure supabaseBrowser is available before attempting to get session
      if (!supabaseBrowser) {
        console.error("Supabase client not initialized.");
        setLoading(false);
        return;
      }

      const { data: { session: initialSession } } = await supabaseBrowser.auth.getSession();
      
      setSession(initialSession);
      const currentPathIsPublic = publicRoutes.includes(router.pathname);
      
      // If no session and the current path is not public, redirect to login
      if (!initialSession && !currentPathIsPublic) {
        router.push('/login');
      }
      setLoading(false);
    };

    checkSession();

    // Set up real-time auth state change listener
    if (supabaseBrowser) {
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

    // Clean up the subscription when the component unmounts
    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, [router, publicRoutes]); // Added publicRoutes to dependency array as it's used inside useEffect

  // Display a loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Cargando autenticación...
      </div>
    );
  }

  // Only render SessionContextProvider if supabaseBrowser is defined
  // This prevents passing 'undefined' to supabaseClient prop
  if (!supabaseBrowser) {
    // Fallback if supabaseBrowser is still undefined after loading, though it should ideally be initialized.
    // You might want to show a more specific error or retry mechanism here.
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

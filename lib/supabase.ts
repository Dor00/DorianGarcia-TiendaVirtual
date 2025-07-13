// lib/supabase.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

// ----------------------------------------------------------------------
// Cliente para usar en el lado del NAVEGADOR (Client Components)
// Solo inicializa supabaseBrowser si estamos en el cliente.
// ----------------------------------------------------------------------
export const supabaseBrowser = typeof window !== 'undefined'
  ? createBrowserClient(
      supabaseUrl as string,
      supabaseAnonKey as string,
      {
        auth: {
          persistSession: true,
          // MODIFICACIÓN CLAVE AQUÍ:
          // Asegúrate de que localStorage solo se referencia cuando 'window' está disponible.
          storage: typeof window !== 'undefined' ? window.localStorage : undefined, 
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  : undefined; 


// ----------------------------------------------------------------------
// Función para crear un Cliente para el lado del SERVIDOR (Para API Routes o Server Components)
// Esta función no se está usando actualmente en tu flujo, pero la dejo para referencia.
// ----------------------------------------------------------------------
export function createSupabaseServerClient(cookieStore: ReadonlyRequestCookies) {

  return createServerClient(
    supabaseUrl as string,
    supabaseAnonKey as string,
    {
      cookies: {
        get(name: string) { // Añadido tipo para name
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) { // Añadido tipos para name, value, options
          console.warn('Attempted to set cookie from createSupabaseServerClient (server-side set in ReadonlyRequestCookies context).');
        },
        remove(name: string, options: any) { // Añadido tipos para name, options
          console.warn('Attempted to remove cookie from createSupabaseServerClient (server-side remove in ReadonlyRequestCookies context).');
        },
      },
    }
  );
}

// lib/supabaseServer.ts
// Este archivo será para inicializar el cliente de Supabase en Server-side (API Routes, getServerSideProps, etc.)
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'; // Importación correcta para Pages Router
import { NextApiRequest, NextApiResponse } from 'next';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables in lib/supabaseServer.ts.');
}

// Función para usar en API Routes, getServerSideProps, etc.
// Siempre debe recibir req y res para poder manejar las cookies.
export function getSupabaseServerClient(req: NextApiRequest, res: NextApiResponse) {
  return createPagesServerClient({ req, res });
}

// Nota: Si estuvieras en el App Router (no es tu caso actual con pages/api),
// usarías createServerClient de @supabase/ssr y la función `cookies()` de Next.js
// export function getSupabaseServerClientAppRouter(cookieStore: ReadonlyRequestCookies) {
//   return createServerClient(
//     supabaseUrl as string,
//     supabaseAnonKey as string,
//     {
//       cookies: {
//         get: (name: string) => cookieStore.get(name)?.value,
//         set: (name: string, value: string, options: object) => cookieStore.set(name, value, options),
//         remove: (name: string, options: object) => cookieStore.set(name, '', options),
//       },
//     }
//   );
// }

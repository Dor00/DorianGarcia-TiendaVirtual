// lib/services/productService.ts
import { supabaseBrowser } from '@/lib/supabase';
import { Product } from '@/types';

export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabaseBrowser
    .from('productos')
    .select('id, nombre, descripcion, precio, imagen_url, stock');

  if (error) throw new Error(error.message);

  return (data || []).map((item: any) => ({
    ...item,
    creado_en: item.creado_en ?? null,
    actualizado_en: item.actualizado_en ?? null,
  }));
}

// /services/productService.ts
import { getServiceSupabase } from '@/lib/supabaseService';

export async function getAllProducts() {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, descripcion, precio, imagen_url, stock');

  if (error) throw new Error(error.message);
  return data;
}

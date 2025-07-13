// pages/api/products/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService'; // Usa el cliente con clave de servicio

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const supabase = getServiceSupabase();
      const { data: products, error } = await supabase
        .from('productos')
        .select('id, nombre,descripcion, precio, imagen_url, stock'); // Selecciona solo los campos necesarios para la lista

      if (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ message: 'Error fetching products', error: error.message });
      }

      return res.status(200).json(products);
    } catch (error: any) {
      console.error('Unexpected error in /api/products:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
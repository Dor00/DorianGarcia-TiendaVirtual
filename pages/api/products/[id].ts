// pages/api/products/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Product ID is required and must be a string.' });
    }

    try {
      const supabase = getServiceSupabase();
      const { data: product, error } = await supabase
        .from('productos')
        .select('*') // Selecciona todos los campos para los detalles
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return res.status(404).json({ message: 'Product not found.' });
        }
        console.error(`Error fetching product with ID ${id}:`, error);
        return res.status(500).json({ message: 'Error fetching product details', error: error.message });
      }

      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      return res.status(200).json(product);
    } catch (error: any) {
      console.error('Unexpected error in /api/products/[id]:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
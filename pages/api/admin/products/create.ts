// pages/api/admin/products/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService';
import { withAuth } from '@/lib/middleware/withAuth';
import { withRole } from '@/lib/middleware/withRole';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nombre, descripcion, precio, stock, imagen_url } = req.body;

  if (!nombre || !descripcion || !precio || !stock) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase.from('productos').insert([
      {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        imagen_url: imagen_url || null,
      },
    ]);

    if (error) {
      console.error('Error al crear producto:', error.message);
      return res.status(500).json({ error: 'Error al crear el producto' });
    }

    return res.status(201).json({ message: 'Producto creado correctamente', data });
  } catch (err: any) {
    console.error('Error interno:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ✅ Aplica autenticación y restricción de rol admin
export default withRole(withAuth(handler,[]), 'admin');

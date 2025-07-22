// pages/api/admin/products/edit.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService';
import { withAuth } from '@/lib/middleware/withAuth';
import { withRole } from '@/lib/middleware/withRole';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id, nombre, descripcion, precio, stock, imagen_url } = req.body;

  if (!id || !nombre || precio == null || stock == null) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from('productos')
    .update({ nombre, descripcion, precio, stock, imagen_url })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Producto actualizado correctamente' });
}

export default withAuth(withRole(handler, 'admin'), []);

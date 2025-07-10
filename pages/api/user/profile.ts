import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabaseServer'; // Cliente de Supabase para servidor
import { getUserFromRequest } from '@/utils/auth'; // Utilidad para extraer el usuario desde la cookie o token

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseServer
        .from('usuarios')
        .select('id, nombre, email, rol, imagen')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error('Error obteniendo perfil:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  if (req.method === 'PUT') {
    const { nombre, imagen } = req.body;

    try {
      const { error } = await supabaseServer
        .from('usuarios')
        .update({ nombre, imagen })
        .eq('id', user.id);

      if (error) {
        return res.status(500).json({ error: 'Error actualizando perfil' });
      }

      return res.status(200).json({ message: 'Perfil actualizado' });
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

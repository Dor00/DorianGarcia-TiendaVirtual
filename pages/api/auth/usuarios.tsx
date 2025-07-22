// pages/api/auth/usuarios.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withAuth } from '@/lib/middleware/withAuth';
import { withRole } from '@/lib/middleware/withRole';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  switch (req.method) {
    case 'POST':
      try {
        const { nombre, email, contrasena, rol, imagen } = req.body;

        if (!email || !contrasena || !nombre || !rol) {
          return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos.' });
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: contrasena,
          email_confirm: true,
        });

        if (authError) {
          console.error('Error al crear usuario en auth:', authError);
          if (authError.status === 422) {
            return res.status(409).json({ error: 'Ya existe un usuario con este email.' });
          }
          return res.status(500).json({ error: authError.message });
        }

        const userId = authData.user?.id;
        if (!userId) return res.status(500).json({ error: 'No se pudo obtener el ID del usuario creado.' });

        const { data: profileData, error: profileError } = await supabaseAdmin.from('usuarios').insert([
          { id: userId, nombre, email, rol, imagen: imagen || null },
        ]).select();

        if (profileError) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          return res.status(500).json({ error: profileError.message });
        }

        return res.status(201).json(profileData[0]);
      } catch (error: any) {
        console.error('Error en POST /api/auth/usuarios:', error);
        return res.status(500).json({ error: error.message || 'Error al crear usuario.' });
      }

    case 'GET':
      try {
        if (id) {
          const { data, error } = await supabaseAdmin.from('usuarios').select('*').eq('id', id as string).single();
          if (error) {
            if (error.code === 'PGRST116') {
              return res.status(404).json({ error: 'Usuario no encontrado.' });
            }
            throw error;
          }
          return res.status(200).json(data);
        } else {
          const { data, error } = await supabaseAdmin.from('usuarios').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return res.status(200).json(data);
        }
      } catch (error: any) {
        console.error('Error en GET /api/auth/usuarios:', error);
        return res.status(500).json({ error: error.message || 'Error al obtener usuarios.' });
      }

    case 'PUT':
      try {
        if (!id) return res.status(400).json({ error: 'ID requerido para actualizar.' });

        const { nombre, email, rol, contrasena, imagen } = req.body;

        const profileUpdates: any = {};
        if (nombre !== undefined) profileUpdates.nombre = nombre;
        if (email !== undefined) profileUpdates.email = email;
        if (rol !== undefined) profileUpdates.rol = rol;
        if (imagen !== undefined) profileUpdates.imagen = imagen || null;

        const authUpdates: { email?: string; password?: string } = {};
        if (email !== undefined) authUpdates.email = email;
        if (contrasena && contrasena.length >= 6) authUpdates.password = contrasena;

        const promises = [];

        if (Object.keys(profileUpdates).length > 0) {
          promises.push(
            supabaseAdmin.from('usuarios').update(profileUpdates).eq('id', id as string)
          );
        }

        if (Object.keys(authUpdates).length > 0) {
          promises.push(
            supabaseAdmin.auth.admin.updateUserById(id as string, authUpdates)
          );
        }

        const results = await Promise.allSettled(promises);
        const rejected = results.filter(r => r.status === 'rejected');
        if (rejected.length > 0) {
          return res.status(500).json({
            error: 'Error al actualizar usuario.',
            details: rejected.map((r: any) => r.reason?.message || 'Error desconocido')
          });
        }

        return res.status(200).json({ message: 'Usuario actualizado exitosamente.' });
      } catch (error: any) {
        console.error('Error en PUT /api/auth/usuarios:', error);
        return res.status(500).json({ error: error.message || 'Error al actualizar usuario.' });
      }

    case 'DELETE':
      try {
        if (!id) return res.status(400).json({ error: 'ID requerido para eliminar.' });

        const { error: profileError } = await supabaseAdmin.from('usuarios').delete().eq('id', id as string);
        if (profileError) {
          return res.status(500).json({ error: profileError.message });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id as string);
        if (authError) {
          return res.status(500).json({ error: authError.message });
        }

        return res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
      } catch (error: any) {
        console.error('Error en DELETE /api/auth/usuarios:', error);
        return res.status(500).json({ error: error.message || 'Error al eliminar usuario.' });
      }

    default:
      res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Método ${req.method} no permitido.`);
  }
}

// ⛔ Protegido por autenticación + verificación de rol
export default withRole(withAuth(handler, ['admin']), 'admin');

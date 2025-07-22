// pages/api/admin/[id]/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withAuth } from '@/lib/middleware/withAuth';
import { withRole } from '@/lib/middleware/withRole';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  switch (req.method) {
    case 'GET': // This handles GET /api/admin/[id] to get a single user by ID
      try {
        if (!id) {
          return res.status(400).json({ error: 'ID de usuario requerido.' });
        }
        // Updated select statement to join with 'roles' table and get 'nombre'
        const { data, error } = await supabaseAdmin.from('usuarios')
          .select('*, roles(nombre)') // Select all from usuarios, and only the 'nombre' from the joined 'roles' table
          .eq('id', id as string)
          .single();
        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
          }
          throw error;
        }
        return res.status(200).json(data);
      } catch (error: any) {
        console.error('Error en GET /api/admin/users/[id]:', error);
        return res.status(500).json({ error: error.message || 'Error al obtener usuario.' });
      }

    case 'PUT':
      try {
        if (!id) {
          return res.status(400).json({ error: 'ID de usuario requerido para actualizar.' });
        }

        const { nombre, email, contrasena, imagen, id_rol } = req.body;

        const profileUpdates: {
          nombre?: string;
          email?: string;
          imagen?: string | null;
          id_rol?: string;
        } = {};

        if (nombre !== undefined) profileUpdates.nombre = nombre;
        if (email !== undefined) profileUpdates.email = email;
        if (imagen !== undefined) profileUpdates.imagen = imagen || null;
        if (id_rol !== undefined) profileUpdates.id_rol = id_rol;

        const authUpdates: { email?: string; password?: string } = {};
        if (email !== undefined) authUpdates.email = email;
        if (contrasena && contrasena.length >= 6) {
          authUpdates.password = contrasena;
        }

        const promises = [];

        if (Object.keys(profileUpdates).length > 0) {
          promises.push(
            supabaseAdmin.from('usuarios')
              .update(profileUpdates)
              .eq('id', id as string)
          );
        }

        if (Object.keys(authUpdates).length > 0) {
          promises.push(
            supabaseAdmin.auth.admin.updateUserById(id as string, authUpdates)
          );
        }

        const results = await Promise.allSettled(promises);

        const rejectedResults = results.filter(result => result.status === 'rejected');
        if (rejectedResults.length > 0) {
          console.error('Errores al actualizar:', rejectedResults);
          return res.status(500).json({
            error: 'Hubo un error al actualizar el usuario.',
            details: rejectedResults.map((e: any) => e.reason?.message || 'Error desconocido')
          });
        }

        return res.status(200).json({ message: 'Usuario actualizado exitosamente.' });
      } catch (error: any) {
        console.error('Error en PUT /api/admin/users/[id]:', error);
        return res.status(500).json({ error: error.message || 'Error al actualizar usuario.' });
      }

    case 'DELETE':
      try {
        if (!id) {
          return res.status(400).json({ error: 'ID de usuario requerido para eliminar.' });
        }

        const { error: profileDeleteError } = await supabaseAdmin.from('usuarios').delete().eq('id', id as string);
        if (profileDeleteError) {
          console.error('Error al eliminar perfil:', profileDeleteError);
          return res.status(500).json({ error: profileDeleteError.message || 'Error al eliminar perfil.' });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id as string);
        if (authError) {
          console.error('Error al eliminar usuario de auth:', authError);
          return res.status(500).json({ error: authError.message || 'Error al eliminar usuario de auth.' });
        }

        return res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
      } catch (error: any) {
        console.error('Error en DELETE /api/admin/users/[id]:', error);
        return res.status(500).json({ error: error.message || 'Error al eliminar usuario.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

// ✅ Protección con autenticación y rol 'admin'
export default withRole(withAuth(handler, []), 'admin');
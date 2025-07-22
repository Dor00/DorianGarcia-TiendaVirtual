// pages/api/admin/users/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withAuth } from '@/lib/middleware/withAuth';
import { withRole } from '@/lib/middleware/withRole';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'POST':
      try {
        const { nombre, email, contrasena, imagen, id_rol } = req.body;

        if (!email || !contrasena || !nombre || !id_rol) {
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
        if (!userId) {
          return res.status(500).json({ error: 'No se pudo obtener el ID del usuario creado.' });
        }

        const { data: profileData, error: profileError } = await supabaseAdmin.from('usuarios').insert([
          { id: userId, nombre, email, imagen: imagen || null, id_rol: id_rol },
        ]).select();

        if (profileError) {
          console.error('Error al insertar perfil en DB:', profileError);
          await supabaseAdmin.auth.admin.deleteUser(userId); // Rollback auth user creation
          return res.status(500).json({ error: profileError.message });
        }

        return res.status(201).json(profileData[0]);
      } catch (error: any) {
        console.error('Error en POST /api/admin/users:', error);
        return res.status(500).json({ error: error.message || 'Error al crear usuario.' });
      }

    case 'GET': // This handles GET /api/admin/users to get all users
      try {
        // Updated select statement to join with 'roles' table and get 'nombre'
        const { data, error } = await supabaseAdmin.from('usuarios')
          .select('*, roles(nombre)') // Select all from usuarios, and only the 'nombre' from the joined 'roles' table
          .order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
      } catch (error: any) {
        console.error('Error en GET /api/admin/users:', error);
        return res.status(500).json({ error: error.message || 'Error al obtener usuarios.' });
      }

    default:
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(405).end(`Método ${req.method} no permitido.`);
  }
};

export default withRole(withAuth(handler, []), 'admin');
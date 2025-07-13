// pages/api/admin/[id]/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Asegúrate de que esta ruta sea correcta

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // Para GET por ID, PUT y DELETE

  switch (req.method) {
    case 'POST': // Crear nuevo usuario (usado por el formulario de CRUD)
      try {
        const { nombre, email, contrasena, rol, imagen } = req.body;

        if (!email || !contrasena || !nombre || !rol) {
          return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos.' });
        }

        // 1. Crear usuario en la autenticación de Supabase (usando admin.createUser)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: contrasena,
          email_confirm: true, // Puedes cambiar a false si no quieres que el usuario confirme su email
        });

        if (authError) {
          console.error('Error al crear usuario en auth (admin.createUser):', authError);
          if (authError.status === 422) { // 422 Unprocessable Entity - email ya registrado
            return res.status(409).json({ error: 'Ya existe un usuario con este email.' }); // 409 Conflict
          }
          return res.status(500).json({ error: authError.message });
        }

        const userId = authData.user?.id;

        if (!userId) {
          return res.status(500).json({ error: 'No se pudo obtener el ID del usuario creado.' });
        }

        // 2. Insertar los detalles del perfil en la tabla 'usuarios'
        const { data: profileData, error: profileError } = await supabaseAdmin.from('usuarios').insert([
          {
            id: userId,
            nombre,
            email,
            rol,
            imagen: imagen || null, // Guarda la URL de la imagen o null si no hay
          },
        ]).select(); // .select() para obtener los datos insertados

        if (profileError) {
          console.error('Error al insertar perfil en DB:', profileError);
          // Si falla la inserción en la tabla de perfiles, considera eliminar el usuario de auth para limpiar
          await supabaseAdmin.auth.admin.deleteUser(userId);
          return res.status(500).json({ error: profileError.message });
        }

        return res.status(201).json(profileData[0]); // Devuelve el primer objeto insertado
      } catch (error: any) {
        console.error('Error en POST /api/admin/users:', error);
        return res.status(500).json({ error: error.message || 'Error al crear usuario.' });
      }

    case 'GET': // Obtener usuarios (todos o por ID)
      try {
        if (id) {
          // Obtener un solo usuario por ID
          const { data, error } = await supabaseAdmin.from('usuarios').select('*').eq('id', id as string).single(); // id es string
          if (error) {
            if (error.code === 'PGRST116') { // No rows found
              return res.status(404).json({ error: 'Usuario no encontrado.' });
            }
            throw error;
          }
          return res.status(200).json(data);
        } else {
          // Obtener todos los usuarios
          const { data, error } = await supabaseAdmin.from('usuarios').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return res.status(200).json(data);
        }
      } catch (error: any) {
        console.error('Error en GET /api/admin/users:', error);
        return res.status(500).json({ error: error.message || 'Error al obtener usuarios.' });
      }

    case 'PUT': // Actualizar usuario
      try {
        if (!id) {
          return res.status(400).json({ error: 'ID de usuario requerido para actualizar.' });
        }

        const { nombre, email, rol, contrasena, imagen } = req.body;

        // Objeto para actualizar en la tabla 'usuarios'
        const profileUpdates: {
          nombre?: string;
          email?: string;
          rol?: 'admin' | 'user' | 'miembro' | 'cliente';
          imagen?: string | null;
        } = {}; // ¡Inicializa el objeto correctamente!

        // Añade campos a profileUpdates solo si están definidos en el cuerpo de la solicitud
        if (nombre !== undefined) profileUpdates.nombre = nombre;
        if (email !== undefined) profileUpdates.email = email;
        if (rol !== undefined) profileUpdates.rol = rol;

        // Si 'imagen' se envía en el cuerpo, actualiza con su valor (o null si es una cadena vacía)
        if (imagen !== undefined) {
          profileUpdates.imagen = imagen || null;
        }

        // Objeto para actualizar en la autenticación de Supabase (email y/o contraseña)
        const authUpdates: { email?: string; password?: string } = {};
        if (email !== undefined) authUpdates.email = email;
        if (contrasena && contrasena.length >= 6) { // Solo actualizar si la contraseña se proporciona y es válida
          authUpdates.password = contrasena;
        }

        const promises = [];

        // Si hay campos para actualizar en la tabla 'usuarios', añade la promesa
        if (Object.keys(profileUpdates).length > 0) {
          promises.push(
            supabaseAdmin.from('usuarios')
              .update(profileUpdates)
              .eq('id', id as string)
          );
        }

        // Si hay campos para actualizar en la autenticación de Supabase, añade la promesa
        if (Object.keys(authUpdates).length > 0) {
          promises.push(
            supabaseAdmin.auth.admin.updateUserById(id as string, authUpdates)
          );
        }

        // Ejecutar todas las promesas en paralelo
        const results = await Promise.allSettled(promises); // Usar allSettled para manejar errores individuales

        // Verificar resultados y errores
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
        console.error('Error en PUT /api/admin/users:', error);
        return res.status(500).json({ error: error.message || 'Error al actualizar usuario.' });
      }

    case 'DELETE': // Eliminar usuario
      try {
        if (!id) {
          return res.status(400).json({ error: 'ID de usuario requerido para eliminar.' });
        }

        // Eliminar de la tabla 'usuarios' primero
        // Esto es importante si NO tienes un trigger en Supabase que elimine automáticamente
        // la fila en 'public.usuarios' cuando un usuario es eliminado de 'auth.users'.
        // Si tienes ese trigger, esta parte es opcional.
        const { error: profileDeleteError } = await supabaseAdmin.from('usuarios').delete().eq('id', id as string);
        if (profileDeleteError) {
          console.error('Error al eliminar perfil de la tabla usuarios:', profileDeleteError);
          return res.status(500).json({ error: profileDeleteError.message || 'Error al eliminar el perfil del usuario.' });
        }

        // Luego eliminar de la autenticación de Supabase
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id as string);

        if (authError) {
          console.error('Error al eliminar usuario de auth:', authError);
          // Considera un mecanismo de rollback si la eliminación de auth falla pero la de perfil tuvo éxito
          return res.status(500).json({ error: authError.message || 'Error al eliminar usuario de autenticación.' });
        }

        return res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
      } catch (error: any) {
        console.error('Error en DELETE /api/admin/users:', error);
        return res.status(500).json({ error: error.message || 'Error al eliminar usuario.' });
      }

    default:
      res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
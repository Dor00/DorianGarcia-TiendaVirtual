// pages/api/upload-avatar.ts
import { NextApiRequest, NextApiResponse } from 'next';
// Usaremos supabaseAdmin para tener permisos elevados para subir al storage
// Sin depender del token del usuario autenticado en el frontend para esta operación de backend
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // ¡Asegúrate de que esta ruta sea correcta!
import formidable from 'formidable';
import path from 'path';
import { promises as fs } from 'fs';

// Importante: Deshabilitar el body parser de Next.js para esta ruta
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // No necesitamos el token de autenticación ni el user.id aquí
  // porque usaremos supabaseAdmin para la subida, que tiene permisos elevados.
  // El UserCrudForm ya verifica que hay una sesión para llamar a esta API,
  // y la seguridad de la subida a Storage recae en que esta API se ejecuta en el servidor
  // y usa la Service Role Key.

  const tempUploadDir = path.join(process.cwd(), 'temp');
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

  // Asegurarse de que el directorio temporal exista
  try {
    await fs.mkdir(tempUploadDir, { recursive: true });
  } catch (mkdirError) {
    console.error('Error creando el directorio temporal:', mkdirError);
    return res.status(500).json({ error: 'Fallo al crear el directorio temporal para la subida.' });
  }

  const form = formidable({
    uploadDir: tempUploadDir,
    keepExtensions: true,
    multiples: false,
    maxFileSize: MAX_FILE_SIZE_BYTES,
  });

  try {
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Error al parsear el formulario con formidable:", err);
          // Mejorar el manejo de errores de formidable
          if (err.code === 'LIMIT_FILE_SIZE') {
            reject(new Error(`El archivo es demasiado grande (máx. ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).`, { cause: 'LIMIT_FILE_SIZE' }));
          } else {
            reject(err);
          }
          return;
        }
        resolve([fields, files]);
      });
    });

    const uploadedFileArray = files.file;
    let file: formidable.File | undefined;

    if (Array.isArray(uploadedFileArray) && uploadedFileArray.length > 0) {
      file = uploadedFileArray[0];
    } else if (uploadedFileArray && !Array.isArray(uploadedFileArray)) {
      file = uploadedFileArray as formidable.File;
    }

    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'No se encontró ningún archivo para subir o la ruta temporal es inválida.' });
    }

    const filePath = file.filepath;
    const fileContent = await fs.readFile(filePath);

    // Generar un nombre de archivo único. No necesitamos el ID de usuario aquí
    // ya que la responsabilidad de vincular la imagen al usuario recae en /api/auth/usuarios.
    // Usaremos un UUID o timestamp para el nombre del archivo en el Storage.
    const fileNameInStorage = `avatars_crud/${Date.now()}-${file.originalFilename || 'uploaded_file'}`;
    // Considera usar un UUID para evitar colisiones:
    // import { v4 as uuidv4 } from 'uuid';
    // const fileNameInStorage = `avatars_crud/${uuidv4()}-${file.originalFilename || 'uploaded_file'}`;
    // (si usas uuid, recuerda instalarlo: npm install uuid @types/uuid)


    // Subir a Supabase Storage usando el cliente de administrador (supabaseAdmin)
    const { data: uploadData, error: storageError } = await supabaseAdmin.storage
      .from('avatars') // Asegúrate de que este es el nombre correcto de tu bucket
      .upload(fileNameInStorage, fileContent, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: true, // Permitir sobrescribir si el nombre de archivo existe (aunque con Date.now() es poco probable)
      });

    // Limpiar archivo temporal
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.warn('Advertencia: Error al eliminar el archivo temporal:', unlinkError);
    }

    if (storageError) {
      console.error('Supabase Storage Error al subir:', storageError);
      return res.status(500).json({ error: storageError.message || 'Error al subir la imagen a Supabase Storage.' });
    }

    // Obtener la URL pública de la imagen subida
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileNameInStorage);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return res.status(500).json({ error: 'No se pudo obtener la URL pública de la imagen.' });
    }

    // SOLO DEVUELVE LA URL PÚBLICA. NO ACTUALICES LA BASE DE DATOS AQUÍ.
    // La API /api/auth/usuarios hará la actualización de la base de datos.
    return res.status(200).json({ publicUrl: publicUrlData.publicUrl });

  } catch (error: any) {
    console.error('Error general al procesar la subida:', error);
    if (error?.cause === 'LIMIT_FILE_SIZE') { // Usar el 'cause' de nuestro error personalizado
      return res.status(413).json({ error: error.message });
    }
    // Para otros errores de formidable, puedes verificar 'error.code' si es necesario
    return res.status(500).json({ error: error.message || 'Error interno del servidor al procesar la imagen.' });
  }
}
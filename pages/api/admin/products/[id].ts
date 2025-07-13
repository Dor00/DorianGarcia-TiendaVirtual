import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withAdminAuth } from '@/lib/middleware/withAdminAuth';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ message: 'Error processing form data' });
      }

      // **FIX START**
      const nombre = Array.isArray(fields.nombre) ? fields.nombre[0] : fields.nombre;
      const descripcion = Array.isArray(fields.descripcion) ? fields.descripcion[0] : fields.descripcion;
      const precio = Array.isArray(fields.precio) ? fields.precio[0] : fields.precio;
      const stock = Array.isArray(fields.stock) ? fields.stock[0] : fields.stock;
      // **FIX END**

      const imageFileRaw = files.image_file;
      const imageFile = Array.isArray(imageFileRaw) ? imageFileRaw[0] : imageFileRaw;

      // Ensure all fields are strings before checking for truthiness if they could be empty arrays
      if (!nombre || !descripcion || !precio || !stock) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      let imageUrl: string | undefined;

      if (imageFile) {
        const filePath = (imageFile as formidable.File).filepath;
        const fileExt = path.extname((imageFile as formidable.File).originalFilename || '');
        const fileName = `productos/${Date.now()}${fileExt}`;
        const fileBuffer = fs.readFileSync(filePath);

        const { error: uploadError } = await supabaseAdmin.storage
          .from('productos')
          .upload(fileName, fileBuffer, {
            contentType: (imageFile as formidable.File).mimetype || 'image/*',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return res.status(500).json({ message: 'Error uploading image' });
        }

        const { data: publicUrlData } = supabaseAdmin.storage
          .from('productos')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const updateData: any = {
        nombre: nombre as string, // Ensure it's treated as a string
        descripcion: descripcion as string, // Ensure it's treated as a string
        precio: parseFloat(precio as string),
        stock: parseInt(stock as string, 10),
      };

      if (imageUrl) {
        updateData.imagen_url = imageUrl;
      }

      const { data, error } = await supabaseAdmin
        .from('productos')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ message: 'Error updating product', error: error.message });
      }

      return res.status(200).json(data[0]);
    });
  } else if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ message: 'Error deleting product', error: error.message });
    }

    return res.status(200).json({ message: 'Producto eliminado' });
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withAdminAuth(handler);
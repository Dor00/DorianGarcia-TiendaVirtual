//api/admin/products/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withAuth } from '@/lib/middleware/withAuth';
import { withRole } from '@/lib/middleware/withRole';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('productos')
      .select('*');

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ message: 'Error fetching products', error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ message: 'Error processing form data' });
      }

      const nombre = Array.isArray(fields.nombre) ? fields.nombre[0] : fields.nombre;
      const descripcion = Array.isArray(fields.descripcion) ? fields.descripcion[0] : fields.descripcion;
      const precio = Array.isArray(fields.precio) ? fields.precio[0] : fields.precio;
      const stock = Array.isArray(fields.stock) ? fields.stock[0] : fields.stock;

      const imageFileRaw = files.image_file;
      const imageFile = Array.isArray(imageFileRaw) ? imageFileRaw[0] : imageFileRaw;

      if (!nombre || !descripcion || !precio || !stock || !imageFile) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const filePath = (imageFile as formidable.File).filepath;
      const fileExt = path.extname((imageFile as formidable.File).originalFilename || '');
      const fileName = `productos/${Date.now()}${fileExt}`;
      const fileBuffer = fs.readFileSync(filePath);

      const { error: uploadError } = await supabaseAdmin.storage
        .from('productos')
        .upload(fileName, fileBuffer, {
          contentType: (imageFile as formidable.File).mimetype || 'image/*',
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({ message: 'Error uploading image' });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('productos')
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;

      const { data, error } = await supabaseAdmin
        .from('productos')
        .insert([{
          nombre,
          descripcion,
          precio: parseFloat(precio as string),
          stock: parseInt(stock as string, 10),
          imagen_url: imageUrl,
        }])
        .select();

      if (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ message: 'Error creating product', error: error.message });
      }

      return res.status(201).json(data[0]);
    });

  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
export default withRole(withAuth(handler, []), 'admin');

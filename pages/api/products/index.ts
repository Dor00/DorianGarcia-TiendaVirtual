// /pages/api/products/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAllProducts } from '@/services/productService';
import type { ProductDTO } from '@/dtos/product.dto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const products: ProductDTO[] = await getAllProducts();
    return res.status(200).json(products);
  } catch (error: any) {
    console.error('Error en GET /api/products:', error.message);
    return res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
}

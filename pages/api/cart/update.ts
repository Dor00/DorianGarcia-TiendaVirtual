// pages/api/cart/update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService';
import { getSupabaseServerClient } from '@/lib/supabaseServer'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = getSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
  }

  const { cartItemId, quantity } = req.body; // cartItemId es el ID del item en la tabla cart_items

  if (!cartItemId || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ message: 'Cart item ID and a valid quantity are required.' });
  }

  try {
    const supabaseService = getServiceSupabase();

    // 1. Verificar si el item del carrito pertenece al usuario y obtener product_id
    const { data: cartItem, error: cartItemError } = await supabaseService
        .from('cart_items')
        .select(`
            id,
            product_id,
            carritos (user_id)
        `)
        .eq('id', cartItemId)
        .single();

    if (cartItemError || !cartItem) {
        return res.status(404).json({ message: 'Cart item not found or not accessible.' });
    }

    if (cartItem.carritos[0].user_id !== user.id) {
        return res.status(403).json({ message: 'Forbidden: This cart item does not belong to the authenticated user.' });
    }

    // 2. Verificar el stock del producto
    const { data: product, error: productError } = await supabaseService
      .from('productos')
      .select('stock')
      .eq('id', cartItem.product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product associated with cart item not found.' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ message: `Not enough stock for this product. Available: ${product.stock}, Requested: ${quantity}.` });
    }

    // 3. Actualizar la cantidad del item en cart_items
    const { error: updateError } = await supabaseService
      .from('cart_items')
      .update({ cantidad: quantity, actualizado_en: new Date().toISOString() })
      .eq('id', cartItemId)
      .eq('cart_id', (cartItem as any).cart_id); // Asegurarse que el cart_id sea correcto para la actualización

    if (updateError) {
      console.error('Error updating cart item quantity:', updateError);
      throw updateError;
    }

    return res.status(200).json({ message: 'Product quantity updated in cart successfully.' });

  } catch (error: any) {
    console.error('Error updating cart item:', error.message);
    return res.status(500).json({ message: 'Error updating product quantity in cart', error: error.message });
  }
}
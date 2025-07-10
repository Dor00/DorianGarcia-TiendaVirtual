// pages/api/cart/remove.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService';
import { getSupabaseServerClient } from '@/lib/supabaseServer'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = getSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
  }

  const { cartItemId } = req.body; // cartItemId es el ID del item en la tabla cart_items

  if (!cartItemId) {
    return res.status(400).json({ message: 'Cart item ID is required.' });
  }

  try {
    const supabaseService = getServiceSupabase();

    // 1. Verificar si el item del carrito pertenece al usuario
    const { data: cartItem, error: cartItemError } = await supabaseService
        .from('cart_items')
        .select(`
            id,
            carritos (user_id)
        `)
        .eq('id', cartItemId)
        .single();

    if (cartItemError || !cartItem) {
        return res.status(404).json({ message: 'Cart item not found or not accessible.' });
    }

    if (cartItem.carritos.user_id !== user.id) {
        return res.status(403).json({ message: 'Forbidden: This cart item does not belong to the authenticated user.' });
    }

    // 2. Eliminar el item del carrito
    const { error: deleteError } = await supabaseService
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (deleteError) {
      console.error('Error removing cart item:', deleteError);
      throw deleteError;
    }

    return res.status(200).json({ message: 'Product removed from cart successfully.' });

  } catch (error: any) {
    console.error('Error removing cart item:', error.message);
    return res.status(500).json({ message: 'Error removing product from cart', error: error.message });
  }
}
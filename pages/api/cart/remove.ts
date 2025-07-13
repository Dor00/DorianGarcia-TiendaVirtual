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
    // When selecting a relationship, Supabase often returns an array, even if it's a single record.
    // We need to explicitly access the first element of the 'carritos' array.
    const { data: cartItem, error: cartItemError } = await supabaseService
        .from('cart_items')
        .select(`
            id,
            carritos (user_id)
        `)
        .eq('id', cartItemId)
        .single(); // Using .single() implies it should return a single object, but the nested 'carritos' might still be an array.

    if (cartItemError || !cartItem || !cartItem.carritos || cartItem.carritos.length === 0) {
        return res.status(404).json({ message: 'Cart item not found or not accessible.' });
    }

    // Access the user_id from the first (and likely only) element of the carritos array
    if (cartItem.carritos[0].user_id !== user.id) {
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

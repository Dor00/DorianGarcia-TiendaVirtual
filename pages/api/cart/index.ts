// pages/api/cart/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService';
import { getSupabaseServerClient } from '@/lib/supabaseServer'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Asegurarse de que el usuario esté autenticado para estas operaciones
  const supabase = getSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
  }

  const supabaseService = getServiceSupabase(); // Usamos el cliente de servicio para las operaciones de DB que lo requieran

  if (req.method === 'GET') {
    try {
      // Intentar obtener el carrito existente del usuario
      // Destructure data and error separately to allow 'cart' to be mutable and 'cartError' to be const
      const { data: fetchedCart, error: cartError } = await supabaseService
        .from('carritos')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let cart = fetchedCart; // 'cart' needs to be 'let' because it might be reassigned if a new cart is created.

      if (cartError && cartError.code !== 'PGRST116') { // PGRST116 means 'No rows found'
        console.error('Error fetching cart:', cartError);
        throw cartError;
      }

      // Si no hay carrito, crear uno nuevo
      if (!cart) {
        const { data: newCart, error: newCartError } = await supabaseService
          .from('carritos')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (newCartError || !newCart) {
          console.error('Error creating new cart:', newCartError);
          throw newCartError || new Error('Failed to create new cart.');
        }
        cart = newCart; // Reassign the 'cart' variable here
      }

      // Ahora, obtener todos los items del carrito, incluyendo detalles del producto
      const { data: cartItems, error: itemsError } = await supabaseService
        .from('cart_items')
        .select(`
          id,
          cantidad,
          product_id,
          productos (
            id,
            nombre,
            precio,
            imagen_url,
            stock
          )
        `)
        .eq('cart_id', cart.id);

      if (itemsError) {
        console.error('Error fetching cart items:', itemsError);
        throw itemsError;
      }

      return res.status(200).json({ cartId: cart.id, items: cartItems || [] });

    } catch (error: any) {
      console.error('Unexpected error in /api/cart:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// pages/api/cart/add.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService';
import { getSupabaseServerClient } from '@/lib/supabaseServer'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = getSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
  }

  const { productId, quantity } = req.body;

  if (!productId || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ message: 'Product ID and a valid quantity are required.' });
  }

  try {
    const supabaseService = getServiceSupabase();

    // 1. Obtener el carrito del usuario (o crearlo si no existe)
    // Destructure the data and error from the Supabase call
    const { data: fetchedCart, error: initialCartError } = await supabaseService
      .from('carritos')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    // Declare 'cart' with 'let' because it might be reassigned if a new cart is created.
    let cart = fetchedCart;
    // Declare 'cartError' with 'const' because its value is not reassigned after initialization.
    const cartError = initialCartError;

    if (cartError && cartError.code !== 'PGRST116') { // PGRST116 means 'No rows found'
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
        throw newCartError || new Error('Failed to create new cart.');
      }
      cart = newCart; // Reassign the 'cart' variable here
    }

    const cartId = cart.id;

    // 2. Verificar el stock del producto
    const { data: product, error: productError } = await supabaseService
      .from('productos')
      .select('id, stock')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product not found or error fetching product details.' });
    }

    // 3. Verificar si el item ya existe en el carrito
    const { data: existingItem, error: existingItemError } = await supabaseService
      .from('cart_items')
      .select('id, cantidad')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .single();

    if (existingItemError && existingItemError.code !== 'PGRST116') {
      throw existingItemError;
    }

    let newQuantity = quantity;
    if (existingItem) {
      newQuantity += existingItem.cantidad;
    }

    if (newQuantity > product.stock) {
      return res.status(400).json({ message: `Not enough stock for ${product.id}. Available: ${product.stock}, Requested: ${newQuantity}.` });
    }

    // 4. Insertar o actualizar el item en cart_items
    if (existingItem) {
      const { error: updateError } = await supabaseService
        .from('cart_items')
        .update({ cantidad: newQuantity, actualizado_en: new Date().toISOString() })
        .eq('id', existingItem.id);

      if (updateError) {
        throw updateError;
      }
      return res.status(200).json({ message: 'Product quantity updated in cart.', cartId });
    } else {
      const { error: insertError } = await supabaseService
        .from('cart_items')
        .insert({ cart_id: cartId, product_id: productId, cantidad: quantity });

      if (insertError) {
        throw insertError;
      }
      return res.status(201).json({ message: 'Product added to cart.', cartId });
    }

  } catch (error: any) {
    console.error('Error adding to cart:', error.message);
    return res.status(500).json({ message: 'Error adding product to cart', error: error.message });
  }
}

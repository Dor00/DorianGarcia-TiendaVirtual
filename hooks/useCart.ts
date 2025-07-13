// hooks/useCart.ts
import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { CartItem, Product } from '@/types';

const CART_KEY = 'cart_anonymous';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveCartToStorage = (cartData: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartData));
  };

  const syncCartToSupabase = async (cartData: CartItem[]) => {
    const { data: { user } } = await supabaseBrowser!.auth.getUser();
    if (!user) return;

    const { error } = await supabaseBrowser!
      .from('carts')
      .upsert({
        user_id: user.id,
        items: cartData,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error sincronizando carrito a Supabase:', error.message);
    }
  };

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabaseBrowser!.auth.getUser();
      if (user) {
        const { data, error } = await supabaseBrowser!
          .from('carts')
          .select('items')
          .eq('user_id', user.id)
          .single();

        if (data?.items) {
          setCart(data.items);
          saveCartToStorage(data.items);
          setLoading(false);
          return;
        }
      }

      const storedCart = localStorage.getItem(CART_KEY);
      if (storedCart) setCart(JSON.parse(storedCart));
      else setCart([]);
    } catch (err: any) {
      console.error('Error cargando carrito:', err.message);
      setError('Error al cargar el carrito');
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product: Product, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      if (product.stock <= 0) {
        setError('Este producto está agotado.');
        setLoading(false);
        return;
      }

      const updatedCart = [...cart];
      const existingItem = updatedCart.find((item) => item.productos.id === product.id);

      if (existingItem) {
        if (existingItem.cantidad + quantity > product.stock) {
          setError('No hay suficiente stock disponible.');
          setLoading(false);
          return;
        }
        existingItem.cantidad += quantity;
      } else {
        updatedCart.push({
          id: crypto.randomUUID(),
          cantidad: quantity,
          product_id: product.id,
          productos: product,
        });
      }

      setCart(updatedCart);
      saveCartToStorage(updatedCart);
      await syncCartToSupabase(updatedCart);
    } catch (err: any) {
      console.error('Error añadiendo al carrito:', err.message);
      setError('Error al añadir al carrito');
    } finally {
      setLoading(false);
    }
  };

  const updateCartItemQuantity = async (cartItemId: string, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      let updatedCart = cart.map((item) => {
        if (item.id === cartItemId) {
          if (quantity > item.productos.stock) {
            setError('No hay suficiente stock disponible.');
            return item;
          }
          return { ...item, cantidad: quantity };
        }
        return item;
      }).filter((item) => item.cantidad > 0);

      setCart(updatedCart);
      saveCartToStorage(updatedCart);
      await syncCartToSupabase(updatedCart);
    } catch (err: any) {
      console.error('Error actualizando cantidad:', err.message);
      setError('Error al actualizar cantidad');
    } finally {
      setLoading(false);
    }
  };

  const removeCartItem = async (cartItemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedCart = cart.filter((item) => item.id !== cartItemId);
      setCart(updatedCart);
      saveCartToStorage(updatedCart);
      await syncCartToSupabase(updatedCart);
    } catch (err: any) {
      console.error('Error eliminando del carrito:', err.message);
      setError('Error al eliminar del carrito');
    } finally {
      setLoading(false);
    }
  };

  return {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
  };
};

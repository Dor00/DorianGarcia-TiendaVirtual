"use client";
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/router';
import { ShoppingCart } from 'lucide-react';
import React from 'react';

export function CarritoFlotante() {
  // Removed localCartCount as it's not provided by the useCart hook's type definition.
  // The totalItems calculation will now solely rely on the 'cart' object.
  const { cart } = useCart();
  const router = useRouter();

  // Calculate totalItems directly from the cart array.
  // If cart is null/undefined or empty, it defaults to 0.
  const totalItems = cart?.reduce((sum: any, item: { cantidad: any; }) => sum + item.cantidad, 0) || 0;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 cursor-pointer group"
      onClick={() => router.push('/cart')}
    >
      <div className="relative bg-blue-600 hover:bg-blue-700 p-4 rounded-full shadow-lg transition-colors duration-200">
        <ShoppingCart size={24} className="text-white" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            {totalItems}
          </span>
        )}
      </div>
    </div>
  );
}

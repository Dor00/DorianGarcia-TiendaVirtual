"use client";
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/router';
import { ShoppingCart } from 'lucide-react';
import React from 'react';

export function CarritoFlotante() {
  const { cart, localCartCount } = useCart();
  const router = useRouter();

  const totalItems = cart?.items?.reduce((sum, item) => sum + item.cantidad, 0) || localCartCount;

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

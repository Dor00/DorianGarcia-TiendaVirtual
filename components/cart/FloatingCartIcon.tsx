"use client";
import { useRouter } from 'next/router';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';

export default function FloatingCartIcon() {
  const router = useRouter();
  const { cart } = useCart();

  const totalItems = cart?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

  return (
    <button
      onClick={() => router.push('/cart')}
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center z-50 transition-transform transform hover:scale-110"
    >
      <ShoppingCart className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {totalItems}
        </span>
      )}
    </button>
  );
}

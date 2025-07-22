// components/shop/ProductGrid.tsx
import React from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';

interface Props {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductGrid = ({ products, onAddToCart }: Props) => {
  if (products.length === 0) {
    return <p className="text-center text-2xl text-gray-400">No hay productos disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={() => onAddToCart(product)} />
      ))}
    </div>
  );
};

export default ProductGrid;

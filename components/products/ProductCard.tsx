// components/products/ProductCard.tsx
"use client";
import React from 'react';

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col items-center text-center">
      <img
        src={product.imagen_url || "/placeholder-product.png"} // Añade un placeholder si no hay imagen
        alt={product.nombre}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="text-xl font-semibold text-white mb-2">{product.nombre}</h3>
      <p className="text-gray-300 text-sm mb-3 flex-grow">{product.descripcion.substring(0, 100)}{product.descripcion.length > 100 ? '...' : ''}</p>
      <p className="text-blue-400 font-bold text-2xl mb-4">${product.precio.toFixed(2)}</p>
      {product.stock > 0 ? (
        <button
          onClick={() => onAddToCart(product)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-200"
        >
          Añadir al Carrito
        </button>
      ) : (
        <span className="px-6 py-2 bg-red-700 text-white font-semibold rounded-md opacity-70 cursor-not-allowed">
          Agotado
        </span>
      )}
    </div>
  );
}

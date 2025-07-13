import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-xl flex flex-col p-4">
      
      <Link href={`/product/${product.id}`} passHref>
      <div className="w-full h-48 flex items-center justify-center bg-gray-700 rounded-md overflow-hidden mb-4 cursor-pointer">
        <Image
          src={product.imagen_url || "/placeholder-product.png"}
          alt={product.nombre}
          width={200}
          height={200}
          className="object-contain h-full w-full"
        />
    </div>
      </Link>


      <p className="text-yellow-400 text-xs mt-2 text-right">{product.stock} en stock</p>

      <div className="flex-grow flex flex-col">
        <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">{product.nombre}</h3>
        <p className="text-gray-300 text-sm mb-3 line-clamp-3 flex-grow">
          {product.descripcion || "Sin descripción disponible."}
        </p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-700">
          <p className="text-2xl font-bold text-green-400">${product.precio.toFixed(0)}</p>

          {product.stock > 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="px-4 py-2 rounded-md font-semibold transition-colors duration-200 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Añadir al Carrito
            </button>
          ) : (
            <span className="text-gray-400 text-sm">Agotado</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

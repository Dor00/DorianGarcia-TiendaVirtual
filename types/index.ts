// types/index.ts

export interface Product {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface CartItem {
  id: string; // ID del cart_item en la base de datos
  cantidad: number;
  product_id: string;
  productos: { // Esto viene de la relación 'productos' en la consulta
    id: string;
    nombre: string;
    precio: number;
    imagen_url: string | null;
    stock: number;
  };
}

export interface Cart {
  cartId: string;
  items: CartItem[];
}
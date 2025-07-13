// types/index.ts

export interface Product {
  id: string;
  nombre: string;
  descripcion: string | null; // Changed to allow null, as per ProductManagementComponent's usage
  precio: number;
  stock: number;
  imagen_url: string | null; // Allow null as per database/usage
  creado_en?: string; // Added as it's common for products
  actualizado_en?: string; // Added as it's common for products
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

// NUEVA INTERFAZ DE USUARIO - Agrega esto a tu archivo types/index.ts
export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'user' | 'admin'; // El rol debe ser estrictamente 'user' o 'admin'
  imagen: string | null; // La imagen puede ser una string o null (si no hay imagen de perfil)
}
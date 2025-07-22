// /dtos/product.dto.ts
export interface ProductDTO {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen_url: string | null;
    stock: number;
  }
  
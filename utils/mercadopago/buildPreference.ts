// utils/mercadopago/buildPreference.ts
export function buildPreference(items: any[], order_id: string, siteUrl: string) {
    return {
      items: items.map((item: any) => ({
        id: String(item.productos.id),
        title: item.productos.nombre,
        unit_price: Number(item.productos.precio),
        quantity: item.cantidad,
        currency_id: 'COP',
      })),
      back_urls: {
        success: `https://doriangarcia-tienda-virtual.vercel.app/success`,
        failure: `https://doriangarcia-tienda-virtual.vercel.app/cart?status=failure`,
        pending: `https://doriangarcia-tienda-virtual.vercel.app/cart?status=pending`,
      },
      auto_return: 'approved',
      metadata: { order_id },
    };
  }
  
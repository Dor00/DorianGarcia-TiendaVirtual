//utils/orderUtils.ts
export async function crearPedido(total: number, items: any[], userId: string | null) {
  try {
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total, items, user_id: userId }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al crear el pedido');
    }
    return data.order;
  } catch (error: any) {
    console.error('Error al crear el pedido:', error.message);
    throw error;
  }
}

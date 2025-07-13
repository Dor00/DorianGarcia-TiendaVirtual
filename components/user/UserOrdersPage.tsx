"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  user_id: string;
}

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabaseBrowser) {
        setError("Error interno: Supabase no está disponible.");
        return;
      }
      const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();

      if (authError || !user) {
        setError("No estás autenticado.");
        return;
      }

      const { data, error } = await supabaseBrowser
        .from("orders")
        .select("id, total, status, created_at, user_id")

        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data || []);
    } catch (err: any) {
      console.error("Error al obtener pedidos:", err.message);
      setError("Error al cargar tus pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return <div className="text-white p-4">Cargando pedidos...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">Mis Pedidos</h2>
      {orders.length === 0 ? (
        <p>No tienes pedidos registrados.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 bg-gray-800 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">Pedido: {order.id}</p>
                <p>Total: ${order.total.toFixed(2)}</p>
                <p>Estado: {order.status}</p>
                <p className="text-sm text-gray-400">
                  Fecha: {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

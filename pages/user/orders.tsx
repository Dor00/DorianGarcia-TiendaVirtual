"use client";
import { withAuth } from "@/utils/withAuth";
import { supabaseBrowser } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface Pedido {
  id: string;
  total: number;
  created_at: string;
  status: string;
}

function OrdersPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data: { user } } = await supabaseBrowser!.auth.getUser();
      if (!user) return;

      const { data, error } = await supabaseBrowser!
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar pedidos:", error.message);
      } else {
        setPedidos(data || []);
      }
      setLoading(false);
    };

    fetchPedidos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Mis Pedidos</h1>
      {loading ? (
        <p>Cargando...</p>
      ) : pedidos.length === 0 ? (
        <p>No tienes pedidos registrados.</p>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-gray-800 p-4 rounded">
              <p><strong>ID:</strong> {pedido.id}</p>
              <p><strong>Total:</strong> ${pedido.total} COP</p>
              <p><strong>Estado:</strong> {pedido.status}</p>
              <p><strong>Fecha:</strong> {new Date(pedido.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(OrdersPage, ["user"]);


// This page is protected and only accessible to users with the "user" role
// If a user without the required role tries to access this page, they will be redirected to the unauthorized page
// The withAuth HOC handles the authentication and authorization logic
// Ensure that the supabaseBrowser client is properly initialized in your application
// and that the "pedidos" table exists in your Supabase database with the appropriate schema
// You can customize the styling and layout as needed for your application
// This page will display the user's orders, including the order ID, total amount, status,
// and creation date, formatted in a user-friendly way
// Make sure to handle any potential errors gracefully, such as network issues or database errors
// You can also add additional features like pagination or filtering if needed
// Consider adding loading states and error handling to improve user experience
// This page is a good example of how to fetch and display user-specific data in a Next.js application
// You can extend this page to include more details about each order, such as items in the order,
// shipping information, or payment details, depending on your application's requirements
// Remember to test the page thoroughly to ensure it works as expected for different user roles
// and scenarios, including edge cases like no orders or failed data fetches
// You can also consider adding unit tests or integration tests to ensure the functionality remains stable
// This page is a great starting point for building a user dashboard in your Next.js application
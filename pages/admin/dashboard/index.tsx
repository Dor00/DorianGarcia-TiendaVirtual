// pages/admin/dashboard/index.tsx
import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin';
import { withAuth } from '@/utils/withAuth'; // Importa el HOC de autenticación


function AdminDashboardPage() {
  return <DashboardAdmin />;
}

// Envuelve el componente con un HOC para proteger la ruta y verificar el rol
// Necesitarás implementar `withAuth` si aún no lo tienes.
//export default AdminDashboardPage;
 export default withAuth(AdminDashboardPage, ['admin']); // Ejemplo con HOC de rol
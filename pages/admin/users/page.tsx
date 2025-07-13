// app/admin/users/page.tsx
import { UserManagementPage } from '@/components/admin/UserManagementPage'; // Adjust import path as needed

export const metadata = {
  title: 'Administración de Usuarios',
  description: 'Gestión de usuarios del sistema.',
};

export default function AdminUsersPage() {
  return <UserManagementPage />;
}
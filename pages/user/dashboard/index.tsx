//pages/user/dashboard/index.tsx
import { DashboardUser } from '@/components/dashboard/DashboardUser';
import { withAuth } from '@/utils/withAuth';

export default withAuth(DashboardUser, ['user']);


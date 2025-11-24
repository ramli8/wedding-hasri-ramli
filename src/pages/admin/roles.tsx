import RoleListPage from '@/modules/admin/roles/pages/RoleListPage';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';

const ProtectedRoleListPage = withAuth(RoleListPage);

(ProtectedRoleListPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedRoleListPage;

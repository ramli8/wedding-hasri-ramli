import UserListPage from '@/modules/admin/users/pages/UserListPage';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';

const ProtectedUserListPage = withAuth(UserListPage);

(ProtectedUserListPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedUserListPage;

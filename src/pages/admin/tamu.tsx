import { TamuListPage } from '@/modules/admin/tamu/pages';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';

const ProtectedTamuListPage = withAuth(TamuListPage);

// Preserve getLayout after HOC
(ProtectedTamuListPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedTamuListPage;

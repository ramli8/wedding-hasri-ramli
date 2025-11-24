import { HubunganTamuListPage } from '@/modules/admin/hubungan_tamu';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';

const ProtectedHubunganTamuListPage = withAuth(HubunganTamuListPage);

(ProtectedHubunganTamuListPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedHubunganTamuListPage;

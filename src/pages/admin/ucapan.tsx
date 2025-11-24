import UcapanListPage from '@/modules/admin/ucapan/pages/UcapanListPage';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';

const ProtectedUcapanListPage = withAuth(UcapanListPage);

(ProtectedUcapanListPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedUcapanListPage;

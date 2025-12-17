import { PengaturanPernikahanPage } from '@/modules/admin/pengaturan_pernikahan';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';

const ProtectedPengaturanPernikahanPage = withAuth(PengaturanPernikahanPage);

(ProtectedPengaturanPernikahanPage as any).getLayout = function getLayout(
  page: React.ReactElement
) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedPengaturanPernikahanPage;

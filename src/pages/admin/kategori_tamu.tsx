import { KategoriTamuListPage } from '@/modules/admin/kategori_tamu';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';

const ProtectedKategoriTamuListPage = withAuth(KategoriTamuListPage);

(ProtectedKategoriTamuListPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedKategoriTamuListPage;

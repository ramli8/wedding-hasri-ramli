import { MainLayout } from '@/src/presentation/components/layout/main-layout'
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route'
import { VendorManagementPage } from '@/src/presentation/components/pages/vendor-management-page'

export default function VendorsPage() {
    return (
        <ProtectedRoute>
            <MainLayout>
                <VendorManagementPage />
            </MainLayout>
        </ProtectedRoute>
    );
}

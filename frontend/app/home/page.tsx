import { MainLayout } from '@/src/presentation/components/layout/main-layout'
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route'
import { HomePage } from '@/src/presentation/components/pages/home-page'

export default function Home() {
    return (
        <ProtectedRoute>
            <MainLayout>
                <HomePage />
            </MainLayout>
        </ProtectedRoute>
    );
}

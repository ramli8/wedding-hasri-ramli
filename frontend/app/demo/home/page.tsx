'use client'

import { DemoMainLayout } from '@/src/lib/demo/demo-main-layout'
import { HomePage } from '@/src/presentation/components/pages/home-page'

export default function DemoHomePage() {
    return (
        <DemoMainLayout>
            <HomePage />
        </DemoMainLayout>
    )
}

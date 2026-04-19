import type { Metadata } from "next";
import { DemoProvider } from '@/src/lib/demo/demo-context';

export const metadata: Metadata = {
    title: "GNS Demo - Mock Data Mode",
    description: "Demo mode - semua data adalah mock data tanpa koneksi backend",
};

export default function DemoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DemoProvider>
            {/* Demo Banner */}
            {children}
            <div className="sticky bottom-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-0.5 text-[10px] font-medium text-amber-950">
                <span>Demo Mode — The data is mock data, not connected to the backend</span>
            </div>
        </DemoProvider>
    );
}

"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { ChevronLeft, Inbox } from "lucide-react";
import { Button } from "@/src/presentation/components/ui/button";
import { useWedding } from "@/src/application/hooks/use-wedding-query";
import type { WeddingResponse } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";

interface UndanganSubPageProps {
  title: string;
  children: (data: WeddingResponse | undefined) => ReactNode;
}

export function UndanganSubPage({ title, children }: UndanganSubPageProps) {
  const { data, isLoading, isError, error, refetch } = useWedding();
  const [createMode, setCreateMode] = useState(false);

  const isNotFound = isAxiosError(error) && error.response?.status === 404;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between mb-8 transition-all">
        <Link
          href="/admin/undangan"
          aria-label="Kembali ke menu undangan"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[18px] font-extrabold tracking-tight absolute left-1/2 -translate-x-1/2 text-foreground">
          {title}
        </h1>
        <div className="w-10 shrink-0" /> {/* Spacer untuk menyeimbangkan ChevronLeft */}
      </div>

      <main className="mx-auto max-w-2xl px-5">
        {isLoading ? (
          <TabLoading />
        ) : isError && !createMode ? (
          isNotFound ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="h-16 w-16 opacity-20" />
              <p className="text-[13px] text-muted-foreground">
                Data undangan belum ada. Isi formulir untuk memulai.
              </p>
              <Button
                variant="soft-accent"
                onClick={() => setCreateMode(true)}
                className="active:scale-95 transition-all"
              >
                Isi Data Undangan
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="h-16 w-16 opacity-20" />
              <p className="text-[13px] text-muted-foreground">
                Gagal memuat data undangan. Periksa koneksi lalu coba lagi.
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="active:scale-95 transition-all"
              >
                Coba Lagi
              </Button>
            </div>
          )
        ) : (
          children(data)
        )}
      </main>
    </div>
  );
}

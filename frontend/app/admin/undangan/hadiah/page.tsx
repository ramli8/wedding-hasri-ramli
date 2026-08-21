"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { GiftsTab } from "@/src/presentation/components/admin/undangan/gifts-tab";

export default function HadiahUndanganPage() {
  return (
    <UndanganSubPage title="Hadiah">
      {() => <GiftsTab />}
    </UndanganSubPage>
  );
}

"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { UcapanTab } from "@/src/presentation/components/admin/undangan/ucapan-tab";

export default function UcapanUndanganPage() {
  return (
    <UndanganSubPage title="Ucapan">
      {() => <UcapanTab />}
    </UndanganSubPage>
  );
}

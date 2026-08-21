"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { CouplesTab } from "@/src/presentation/components/admin/undangan/couples-tab";

export default function MempelaiUndanganPage() {
  return (
    <UndanganSubPage title="Mempelai">
      {() => <CouplesTab />}
    </UndanganSubPage>
  );
}

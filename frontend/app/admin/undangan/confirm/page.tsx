"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { ConfirmTab } from "@/src/presentation/components/admin/undangan/confirm-tab";

export default function ConfirmUndanganPage() {
  return (
    <UndanganSubPage title="Konfirmasi">
      {() => <ConfirmTab />}
    </UndanganSubPage>
  );
}

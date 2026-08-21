"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { IdentityForm } from "@/src/presentation/components/admin/undangan/forms/identity-form";

export default function IdentitasUndanganPage() {
  return (
    <UndanganSubPage title="Identitas">
      {(data) => <IdentityForm data={data} />}
    </UndanganSubPage>
  );
}

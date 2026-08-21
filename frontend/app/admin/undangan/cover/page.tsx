"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { CoverForm } from "@/src/presentation/components/admin/undangan/forms/cover-form";

export default function CoverUndanganPage() {
  return (
    <UndanganSubPage title="Cover">
      {(data) => <CoverForm data={data} />}
    </UndanganSubPage>
  );
}

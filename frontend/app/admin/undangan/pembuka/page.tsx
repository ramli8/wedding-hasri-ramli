"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { OpeningForm } from "@/src/presentation/components/admin/undangan/forms/opening-form";

export default function PembukaUndanganPage() {
  return (
    <UndanganSubPage title="Pembuka">
      {(data) => <OpeningForm data={data} />}
    </UndanganSubPage>
  );
}

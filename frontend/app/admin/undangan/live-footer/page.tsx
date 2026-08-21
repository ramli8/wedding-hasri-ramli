"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { LivestreamFooterForm } from "@/src/presentation/components/admin/undangan/forms/livestream-footer-form";

export default function LiveFooterUndanganPage() {
  return (
    <UndanganSubPage title="Live & Penutup">
      {(data) => <LivestreamFooterForm data={data} />}
    </UndanganSubPage>
  );
}

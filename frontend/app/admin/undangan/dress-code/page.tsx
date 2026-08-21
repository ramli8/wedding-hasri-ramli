"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { DressCodeForm } from "@/src/presentation/components/admin/undangan/forms/dresscode-form";

export default function DressCodeUndanganPage() {
  return (
    <UndanganSubPage title="Dress Code">
      {(data) => <DressCodeForm data={data} />}
    </UndanganSubPage>
  );
}

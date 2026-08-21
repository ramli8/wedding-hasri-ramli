"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { MusicForm } from "@/src/presentation/components/admin/undangan/forms/music-form";

export default function MusikUndanganPage() {
  return (
    <UndanganSubPage title="Musik">
      {(data) => <MusicForm data={data} />}
    </UndanganSubPage>
  );
}

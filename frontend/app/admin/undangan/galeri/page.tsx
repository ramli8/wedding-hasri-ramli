"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { GalleryTab } from "@/src/presentation/components/admin/undangan/gallery-tab";

export default function GaleriUndanganPage() {
  return (
    <UndanganSubPage title="Galeri">
      {() => <GalleryTab />}
    </UndanganSubPage>
  );
}

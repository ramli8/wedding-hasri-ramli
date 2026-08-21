"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { SectionsTab } from "@/src/presentation/components/admin/undangan/sections-tab";

export default function SectionUndanganPage() {
  return (
    <UndanganSubPage title="Section">
      {() => <SectionsTab />}
    </UndanganSubPage>
  );
}

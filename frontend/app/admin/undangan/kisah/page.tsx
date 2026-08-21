"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { StoryTab } from "@/src/presentation/components/admin/undangan/story-tab";

export default function KisahUndanganPage() {
  return (
    <UndanganSubPage title="Kisah">
      {() => <StoryTab />}
    </UndanganSubPage>
  );
}

"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { FaqTab } from "@/src/presentation/components/admin/undangan/faq-tab";

export default function FaqUndanganPage() {
  return (
    <UndanganSubPage title="FAQ">
      {() => <FaqTab />}
    </UndanganSubPage>
  );
}

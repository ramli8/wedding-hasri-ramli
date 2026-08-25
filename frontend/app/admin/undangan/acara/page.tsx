"use client";

import { UndanganSubPage } from "@/src/presentation/components/admin/undangan/undangan-sub-page";
import { EventsTab } from "@/src/presentation/components/admin/undangan/events-tab";

export default function AcaraUndanganPage() {
  return (
    <UndanganSubPage title="Acara">
      {(data) => <EventsTab data={data} />}
    </UndanganSubPage>
  );
}

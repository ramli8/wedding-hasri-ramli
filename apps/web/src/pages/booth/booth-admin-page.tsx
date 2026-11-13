import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BOOTH_FRAME_LABELS, BOOTH_FRAMES, type BoothFrame } from "@wedding/shared";
import { Alert } from "@/components/kit/alert";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { adminApi } from "../../lib/admin-api.js";
import { boothConfigQuery, useRefresh } from "../../lib/queries.js";
import { FrameThumb } from "./frame-thumb.js";

export function BoothAdminPage() {
  return (
    <>
      <PageHeader
        title="Bingkai photobooth"
        description="Pilih bingkai yang boleh dipakai tamu dan siapkan laptop booth. Foto yang masuk ada di Photobooth → Foto."
      />
      <FramesCard />
      <SetupCard />
    </>
  );
}

function FramesCard() {
  const refresh = useRefresh();
  const config = useQuery(boothConfigQuery);
  const save = useMutation({
    mutationFn: (frames: BoothFrame[]) => adminApi.booth.saveConfig({ frames }),
    onSuccess: () => refresh("booth"),
  });
  const active = config.data?.config.frames ?? [];

  function toggle(frame: BoothFrame, on: boolean) {
    const next = on ? [...active, frame] : active.filter((f) => f !== frame);
    if (next.length > 0) save.mutate(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bingkai aktif</CardTitle>
        <CardDescription>
          Hasil cetak 4R mendatar (152×102 mm), bertema bunga, tanpa filter warna. Bila lebih dari
          satu bingkai aktif, tamu memilih sendiri di layar booth. Booth mengambil pilihan ini saat
          tersambung internet. QR di pojok kanan bawah berbeda di setiap foto dan membuka halaman
          berisi foto itu saja (dengan tombol Unduh) di situs ini, memakai alamat situs di
          Pengaturan → Situs.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {config.isError && <Alert tone="error">{config.error.message}</Alert>}
        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        <ul className="grid gap-4 md:grid-cols-3">
          {BOOTH_FRAMES.map((frame) => {
            const on = active.includes(frame);
            const id = `booth-frame-${frame}`;
            return (
              <li key={frame} className="flex flex-col gap-3 rounded-lg border p-3">
                <FrameThumb frame={frame} />
                <div className="flex min-h-11 items-center justify-between gap-3">
                  <label htmlFor={id} className="font-medium">
                    {BOOTH_FRAME_LABELS[frame]}
                  </label>
                  <Switch
                    id={id}
                    checked={on}
                    // Minimal satu bingkai harus aktif.
                    disabled={!config.data || save.isPending || (on && active.length === 1)}
                    onCheckedChange={(checked) => toggle(frame, checked)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function SetupCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Memasang booth</CardTitle>
        <CardDescription>Cukup sekali, saat laptop booth tersambung internet.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid list-decimal gap-2 ps-5 text-sm">
          <li>
            Di menu{" "}
            <Link to="/admin/perangkat" className="underline">
              Perangkat
            </Link>
            , tambah perangkat berjenis <b>Photobooth</b> bernama mis. “Laptop Booth”.
          </li>
          <li>
            Di laptop booth, buka <code>/booth/pasang</code> lalu ketik kode pairing-nya (atau
            pindai QR-nya). Kode photobooth hanya bisa dipasang di halaman ini, dan perangkat booth
            tidak bisa membuka data tamu.
          </li>
          <li>
            Sambungkan kamera (mode USB WEBCAM) dan printer, lalu jalankan Chrome mode kiosk.
            Langkah lengkapnya ada di <code>docs/photobooth.md</code>.
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}

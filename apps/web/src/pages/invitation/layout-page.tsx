import { useMutation, useQuery } from "@tanstack/react-query";
import { type Live, type MediaRef, SECTION_LABEL, type Section } from "@wedding/shared";
import { type FormEvent, useState } from "react";
import { ImageField } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { ReorderButtons } from "@/components/kit/reorder-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../../lib/admin-api.js";
import { layoutQuery, useRefresh } from "../../lib/queries.js";

export function LayoutPage() {
  const layout = useQuery(layoutQuery);

  return (
    <>
      {layout.isError && <Alert tone="error">{layout.error.message}</Alert>}
      {layout.data && (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <CoverForm greeting={layout.data.cover.greeting} photo={layout.data.cover.photo} />
            <LiveForm live={layout.data.live} />
          </div>
          <SectionList sections={layout.data.sections} />
        </>
      )}
    </>
  );
}

function CoverForm({
  greeting: initial,
  photo: initialPhoto,
}: {
  greeting: string | null;
  photo: MediaRef | null;
}) {
  const refresh = useRefresh();
  const [greeting, setGreeting] = useState(initial ?? "");
  const [photo, setPhoto] = useState<MediaRef | null>(initialPhoto);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => adminApi.invitation.saveCover({ greeting, photoMediaId: photo?.id ?? null }),
    onSuccess: async () => {
      await refresh("invitation");
      setSaved(true);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    save.mutate();
  }

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Sampul</CardTitle>
        <CardDescription>
          Nama mempelai dan tanggal acara diambil otomatis dari Pengaturan dan Acara.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6">
        <ImageField
          label="Foto sampul"
          value={photo}
          onChange={(value) => {
            setSaved(false);
            setPhoto(value);
          }}
          recommendation="potret 4:5, 1600 × 2000 px, atau lanskap 3:2, 2400 × 1600 px (minimal 1200 px lebar). Foto tampil utuh selebar layar tanpa dipotong."
        />
        <Field
          label="Kalimat pembuka"
          hint="Opsional, maksimal 400 karakter. Mis. basmalah atau ajakan singkat."
        >
          {(id) => (
            <Textarea
              id={id}
              className="min-h-24"
              maxLength={400}
              value={greeting}
              onChange={(e) => {
                setSaved(false);
                setGreeting(e.target.value);
              }}
            />
          )}
        </Field>
        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm font-medium text-success">Tersimpan</span>}
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan sampul"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SectionList({ sections }: { sections: Section[] }) {
  const refresh = useRefresh();
  const save = useMutation({
    mutationFn: (items: Section[]) => adminApi.invitation.saveSections(items),
    onSuccess: () => refresh("invitation"),
  });

  const move = (index: number, delta: -1 | 1) => {
    const items = [...sections];
    const a = items[index];
    const b = items[index + delta];
    if (!a || !b) return;
    items[index] = b;
    items[index + delta] = a;
    save.mutate(items);
  };
  const toggle = (index: number, visible: boolean) =>
    save.mutate(sections.map((s, i) => (i === index ? { ...s, visible } : s)));

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Urutan bagian</CardTitle>
        <CardDescription>
          Atur urutan bagian di halaman undangan dan sembunyikan yang tidak dipakai. Bagian yang
          belum Anda isi tidak tampil walau dicentang.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        <ol className="grid gap-2">
          {sections.map((section, index) => (
            <li
              key={section.key}
              className="flex items-center gap-3 rounded-lg border p-3 data-[hidden=true]:opacity-60"
              data-hidden={!section.visible}
            >
              <ReorderButtons
                index={index}
                count={sections.length}
                busy={save.isPending}
                onMove={move}
              />
              <span className="grid size-7 place-items-center rounded-md bg-muted text-xs font-medium">
                {index + 1}
              </span>
              <p className="flex-1 font-medium">{SECTION_LABEL[section.key]}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {section.visible ? "Tampil" : "Disembunyikan"}
                <Switch
                  checked={section.visible}
                  disabled={save.isPending}
                  onCheckedChange={(checked) => toggle(index, checked)}
                  aria-label={`Tampilkan ${SECTION_LABEL[section.key]}`}
                />
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function LiveForm({ live }: { live: Live | null }) {
  const refresh = useRefresh();
  const [url, setUrl] = useState(live?.url ?? "");
  const [note, setNote] = useState(live?.note ?? "");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => adminApi.invitation.saveLive({ url, note }),
    onSuccess: async () => {
      await refresh("invitation");
      setSaved(true);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    save.mutate();
  }

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Siaran langsung</CardTitle>
        <CardDescription>
          Untuk tamu yang tidak bisa hadir. Isi tautan YouTube, Instagram Live, atau Zoom bila sudah
          ada; kosongkan untuk menyembunyikan bagian ini.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6">
        <Field label="Tautan siaran" hint="Harus diawali https://">
          {(id) => (
            <Input
              id={id}
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => {
                setSaved(false);
                setUrl(e.target.value);
              }}
            />
          )}
        </Field>
        <Field label="Keterangan" hint="Opsional, mis. jam mulai siaran.">
          {(id) => (
            <Input
              id={id}
              maxLength={300}
              value={note}
              onChange={(e) => {
                setSaved(false);
                setNote(e.target.value);
              }}
            />
          )}
        </Field>
        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm font-medium text-success">Tersimpan</span>}
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan siaran"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

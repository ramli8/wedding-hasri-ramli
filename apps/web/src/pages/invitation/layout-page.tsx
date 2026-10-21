import { useMutation, useQuery } from "@tanstack/react-query";
import { type Live, type MediaRef, SECTION_LABEL, type Section } from "@wedding/shared";
import { ArrowDown, ArrowUp } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ImageField } from "../../components/image-field.js";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { Field } from "../../components/ui/field.js";
import { Input } from "../../components/ui/input.js";
import { Textarea } from "../../components/ui/textarea.js";
import { adminApi } from "../../lib/admin-api.js";
import { layoutQuery, useRefresh } from "../../lib/queries.js";

export function LayoutPage() {
  const layout = useQuery(layoutQuery);

  return (
    <>
      <p className="max-w-prose text-ink-soft">
        Atur sampul di bagian atas halaman undangan, lalu urutan dan tampil/sembunyi tiap bagian.
        Bagian yang belum Anda isi tidak tampil di halaman tamu walau dicentang.
      </p>
      {layout.isError && <Alert tone="error">{layout.error.message}</Alert>}
      {layout.data && (
        <>
          <CoverForm greeting={layout.data.cover.greeting} photo={layout.data.cover.photo} />
          <LiveForm live={layout.data.live} />
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
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Sampul</h2>
        <p className="text-sm text-ink-soft">
          Nama mempelai dan tanggal acara diambil otomatis dari Pengaturan dan Acara.
        </p>
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
          {saved && <span className="text-sm font-semibold text-ok">Tersimpan</span>}
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
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Urutan bagian</h2>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <ol className="flex flex-col gap-3">
        {sections.map((section, index) => (
          <li key={section.key}>
            <Card className="flex items-center gap-4 p-3">
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Naikkan"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || save.isPending}
                >
                  <ArrowUp className="size-4" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Turunkan"
                  onClick={() => move(index, 1)}
                  disabled={index === sections.length - 1 || save.isPending}
                >
                  <ArrowDown className="size-4" aria-hidden />
                </Button>
              </div>
              <p className="flex-1 font-display text-lg font-bold">{SECTION_LABEL[section.key]}</p>
              <Checkbox
                checked={section.visible}
                disabled={save.isPending}
                onChange={(e) => toggle(index, e.target.checked)}
              >
                Tampil
              </Checkbox>
            </Card>
          </li>
        ))}
      </ol>
    </div>
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
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Siaran langsung</h2>
        <p className="text-sm text-ink-soft">
          Untuk tamu yang tidak bisa hadir. Isi tautan YouTube, Instagram Live, atau Zoom bila sudah
          ada; kosongkan untuk menyembunyikan bagian ini.
        </p>
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
          {saved && <span className="text-sm font-semibold text-ok">Tersimpan</span>}
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan siaran"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  type MediaRef,
  renderSeoText,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  SEO_VARIABLES,
} from "@wedding/shared";
import { Link2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ImageField } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../../lib/admin-api.js";
import { seoQuery, settingsQuery, useRefresh } from "../../lib/queries.js";
import { ContentSection } from "./settings-layout.js";

const SAMPLE_GUEST = "Bpk. Budi & Keluarga";

/** Kartu pratinjau tautan seperti yang tampil di WhatsApp, Instagram, dan Telegram. */
function LinkCard({
  title,
  description,
  image,
  host,
}: {
  title: string;
  description: string;
  image: string | null;
  host: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/40">
      {image ? (
        <img src={image} alt="" className="aspect-[1.91/1] w-full object-cover" />
      ) : (
        <div className="grid aspect-[1.91/1] w-full place-items-center bg-muted text-sm text-muted-foreground">
          Belum ada gambar
        </div>
      )}
      <div className="grid gap-0.5 p-3">
        <p className="text-xs text-muted-foreground uppercase">{host}</p>
        <p className="line-clamp-2 text-sm font-semibold">{title}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function SeoSettings() {
  const seo = useQuery(seoQuery);
  const settings = useQuery(settingsQuery);

  return (
    <ContentSection
      title="Pratinjau tautan"
      desc="Judul, deskripsi, dan gambar yang muncul saat link undangan dibagikan ke WhatsApp, Instagram, atau Telegram."
    >
      {seo.isError && <Alert tone="error">{seo.error.message}</Alert>}
      {seo.isPending || settings.isPending ? (
        <p className="text-muted-foreground">Memuat…</p>
      ) : settings.data ? (
        <SeoForm
          initial={seo.data}
          mempelai={`${settings.data.brideName} & ${settings.data.groomName}`}
          host={new URL(settings.data.publicBaseUrl).host}
        />
      ) : (
        <Alert>Isi dulu data pernikahan di Pengaturan → Pernikahan, lalu kembali ke sini.</Alert>
      )}
    </ContentSection>
  );
}

function SeoForm({
  initial,
  mempelai,
  host,
}: {
  initial: { title: string; description: string; image: MediaRef | null } | undefined;
  mempelai: string;
  host: string;
}) {
  const refresh = useRefresh();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState<MediaRef | null>(initial?.image ?? null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => adminApi.seo.save({ title, description, imageMediaId: image?.id ?? null }),
    onSuccess: async ({ seo }) => {
      setImage(seo.image);
      setSaved(true);
      await refresh("seo");
    },
  });

  const touch =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setSaved(false);
      set(value);
    };

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    save.mutate();
  }

  const values = { panggilan: SAMPLE_GUEST, mempelai };
  const shownTitle = renderSeoText(title.trim() || DEFAULT_SEO_TITLE, values);
  const shownDescription = renderSeoText(description.trim() || DEFAULT_SEO_DESCRIPTION, values);

  const addVariable = (setter: (value: (text: string) => string) => void, name: string) =>
    setter((text) => `${text}${name}`);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="size-4" aria-hidden />
          Pratinjau untuk tamu contoh “{SAMPLE_GUEST}”
        </p>
        <LinkCard
          title={shownTitle}
          description={shownDescription}
          image={image?.thumb ?? null}
          host={host}
        />
        <p className="text-sm text-muted-foreground">
          WhatsApp dan Instagram menyimpan pratinjau sebuah link. Kalau sudah terlanjur dikirim,
          perubahan di sini baru terlihat pada link yang belum pernah dibagikan.
        </p>
      </div>

      <Field
        label="Judul"
        hint={`${title.length}/${SEO_TITLE_MAX}. Kosong = “${DEFAULT_SEO_TITLE}”.`}
      >
        {(id) => (
          <Input
            id={id}
            maxLength={SEO_TITLE_MAX}
            value={title}
            placeholder={DEFAULT_SEO_TITLE}
            onChange={(e) => touch(setTitle)(e.target.value)}
          />
        )}
      </Field>

      <Field
        label="Deskripsi"
        hint={`${description.length}/${SEO_DESCRIPTION_MAX}. Kosong = teks bawaan. Tampil dua baris di pratinjau.`}
      >
        {(id) => (
          <Textarea
            id={id}
            maxLength={SEO_DESCRIPTION_MAX}
            value={description}
            placeholder={DEFAULT_SEO_DESCRIPTION}
            onChange={(e) => touch(setDescription)(e.target.value)}
          />
        )}
      </Field>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Variabel</p>
        <p className="text-sm text-muted-foreground">
          Klik untuk menambahkan ke judul atau deskripsi. Diganti otomatis per tamu saat tautannya
          dibuka.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SEO_VARIABLES.map((variable) => (
            <span key={variable.name} className="inline-flex gap-1">
              <button
                type="button"
                title={`${variable.description} (ke judul)`}
                onClick={() => addVariable((fn) => touch(setTitle)(fn(title)), variable.name)}
              >
                <Badge variant="outline" className="font-mono hover:bg-accent">
                  {variable.name} → judul
                </Badge>
              </button>
              <button
                type="button"
                title={`${variable.description} (ke deskripsi)`}
                onClick={() =>
                  addVariable((fn) => touch(setDescription)(fn(description)), variable.name)
                }
              >
                <Badge variant="outline" className="font-mono hover:bg-accent">
                  {variable.name} → deskripsi
                </Badge>
              </button>
            </span>
          ))}
        </div>
      </div>

      <ImageField
        label="Gambar pratinjau"
        value={image}
        onChange={touch(setImage)}
        recommendation="lanskap 1,91:1, 1200 × 630 px. Pratinjau memakai versi 480 px agar ringan di WhatsApp; wajah dan teks penting di tengah."
      />

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      {saved && !save.error && <Alert>Tersimpan.</Alert>}
      <div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

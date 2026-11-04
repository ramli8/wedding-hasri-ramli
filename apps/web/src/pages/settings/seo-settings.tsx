import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  type MediaRef,
  renderSeoText,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  SEO_VARIABLES,
} from "@wedding/shared";
import { ArrowRight, Link2 } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { ImageField } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
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
        <div className="flex flex-col items-start gap-3">
          <Alert>Isi dulu data pernikahan di Pengaturan → Pernikahan, lalu kembali ke sini.</Alert>
          <Link to="/admin/pengaturan" className={buttonVariants({ variant: "outline" })}>
            Isi data pernikahan
            <ArrowRight aria-hidden />
          </Link>
        </div>
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
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // "Tersimpan" ditampilkan toast global (MutationCache di main.tsx).
  const save = useMutation({
    mutationFn: () => adminApi.seo.save({ title, description, imageMediaId: image?.id ?? null }),
    onSuccess: async ({ seo }) => {
      setImage(seo.image);
      await refresh("seo");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const values = { panggilan: SAMPLE_GUEST, mempelai };
  const shownTitle = renderSeoText(title.trim() || DEFAULT_SEO_TITLE, values);
  const shownDescription = renderSeoText(description.trim() || DEFAULT_SEO_DESCRIPTION, values);

  /** Sisipkan variabel di posisi kursor terakhir kolom itu (di akhir bila belum pernah diketuk). */
  function insertVariable(
    field: HTMLInputElement | HTMLTextAreaElement | null,
    text: string,
    set: (value: string) => void,
    max: number,
    name: string,
  ) {
    const start = field?.selectionStart ?? text.length;
    const end = field?.selectionEnd ?? start;
    const next = `${text.slice(0, start)}${name}${text.slice(end)}`;
    if (next.length > max) return;
    set(next);
    const caret = start + name.length;
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(caret, caret);
    });
  }

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
            ref={titleRef}
            onChange={(e) => setTitle(e.target.value)}
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
            ref={descriptionRef}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Variabel</p>
        <p className="text-sm text-muted-foreground">
          Ketuk untuk menyisipkan di posisi kursor pada judul atau deskripsi. Diganti otomatis per
          tamu saat tautannya dibuka.
        </p>
        <div className="flex flex-wrap gap-2">
          {SEO_VARIABLES.map((variable) => (
            <span key={variable.name} className="inline-flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="font-mono"
                title={`${variable.description} (ke judul)`}
                onClick={() =>
                  insertVariable(titleRef.current, title, setTitle, SEO_TITLE_MAX, variable.name)
                }
              >
                {variable.name} → judul
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="font-mono"
                title={`${variable.description} (ke deskripsi)`}
                onClick={() =>
                  insertVariable(
                    descriptionRef.current,
                    description,
                    setDescription,
                    SEO_DESCRIPTION_MAX,
                    variable.name,
                  )
                }
              >
                {variable.name} → deskripsi
              </Button>
            </span>
          ))}
        </div>
      </div>

      <ImageField
        label="Gambar pratinjau"
        value={image}
        onChange={setImage}
        recommendation="lanskap 1,91:1, 1200 × 630 px. Pratinjau memakai versi 480 px agar ringan di WhatsApp; wajah dan teks penting di tengah."
      />

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

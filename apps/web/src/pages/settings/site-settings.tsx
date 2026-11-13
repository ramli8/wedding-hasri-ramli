import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_SEO_TITLE,
  DEFAULT_SITE_NAME,
  MAX_UPLOAD_MB,
  type MediaRef,
  renderSeoText,
  SEO_TITLE_MAX,
  SEO_VARIABLES,
  type Seo,
  type Settings,
  SITE_NAME_MAX,
} from "@wedding/shared";
import { type FormEvent, useRef, useState } from "react";
import { ImageField } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { VariableChips } from "@/components/kit/variable-chips";
import { Input } from "@/components/ui/input";
import { adminApi } from "../../lib/admin-api.js";
import { isoToWibInput, wibInputToIso } from "../../lib/datetime.js";
import { seoQuery, settingsQuery, useRefresh } from "../../lib/queries.js";
import { ContentSection } from "./settings-layout.js";

const SAMPLE_GUEST = "Bpk. Budi & Keluarga";
const INPUT = "h-11 text-base md:h-9 md:text-sm";

const LOGO_SPECS = [
  "PNG, latar transparan boleh (JPEG/WebP juga diterima; SVG tidak)",
  "Persegi 1:1, 1024 × 1024 px (minimal 512 × 512)",
  "Logo di tengah, sisakan ruang kosong 10% di tiap sisi",
  "Hindari teks kecil: di tab browser logo hanya 32 px",
  `Maksimal ${MAX_UPLOAD_MB} MB`,
  "Otomatis jadi favicon 32/48 px, ikon iPhone 180 px, ikon Android 192/512 px (latar putih)",
] as const;

const CARD_SPECS = [
  "JPEG, PNG, atau WebP; dikirim ke WhatsApp sebagai JPEG",
  "Lanskap 1200 × 630 px (rasio 1,91:1), minimal 600 × 315",
  "Wajah atau objek penting di tengah (630 × 630), karena bisa terpotong jadi persegi",
  "Hindari teks kecil; ukuran lain dipotong di bagian tengah",
  `Maksimal ${MAX_UPLOAD_MB} MB`,
] as const;

/** Kartu tautan seperti di WhatsApp; gambar dipotong tengah 1,91:1 persis seperti di server. */
function LinkCard(props: { title: string; image: string | null; host: string }) {
  return (
    <div className="overflow-hidden rounded-lg bg-[#d9fdd3] p-1 text-[#111b21] shadow-sm">
      <div className="overflow-hidden rounded-md bg-[#c8ecc0]">
        {props.image ? (
          <img src={props.image} alt="" className="aspect-[1.91/1] w-full object-cover" />
        ) : (
          <div className="grid aspect-[1.91/1] w-full place-items-center text-sm text-black/50">
            Belum ada gambar
          </div>
        )}
        <div className="grid gap-0.5 px-2.5 py-2">
          <p className="line-clamp-2 text-[13px] leading-snug font-semibold">{props.title}</p>
          <p className="text-xs text-black/50">{props.host}</p>
        </div>
      </div>
    </div>
  );
}

export function SiteSettings() {
  const settings = useQuery(settingsQuery);
  const seo = useQuery(seoQuery);
  const error = settings.error ?? seo.error;
  return (
    <ContentSection title="Situs" desc="Nama, alamat, logo, dan tampilan link saat dibagikan.">
      {error ? (
        <Alert tone="error">{error.message}</Alert>
      ) : settings.isSuccess && seo.isSuccess ? (
        <SiteForm settings={settings.data ?? null} seo={seo.data} />
      ) : (
        <p className="text-muted-foreground">Memuat…</p>
      )}
    </ContentSection>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "situs-anda.com";
  }
}

function SiteForm({ settings, seo }: { settings: Settings | null; seo: Seo }) {
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  const [siteName, setSiteName] = useState(settings?.siteName ?? "");
  const [brideName, setBrideName] = useState(settings?.brideName ?? "");
  const [groomName, setGroomName] = useState(settings?.groomName ?? "");
  const [publicBaseUrl, setPublicBaseUrl] = useState(settings?.publicBaseUrl ?? "");
  const [countdownAt, setCountdownAt] = useState(isoToWibInput(settings?.countdownAt));
  const [logo, setLogo] = useState<MediaRef | null>(seo.logo);
  const [image, setImage] = useState<MediaRef | null>(seo.image);
  const [title, setTitle] = useState(seo.title);
  const [submitted, setSubmitted] = useState(false);

  // Variabel disisipkan di posisi kursor terakhir pada kolom judul.
  const titleRef = useRef<HTMLInputElement>(null);

  const errors = {
    bride: !brideName.trim() ? "Nama mempelai wanita wajib diisi" : null,
    groom: !groomName.trim() ? "Nama mempelai pria wajib diisi" : null,
    url: !/^https?:\/\/[^\s/]+\.[^\s]+$/.test(publicBaseUrl.trim())
      ? "Isi alamat lengkap, mis. https://hasriramli.com"
      : null,
  };
  const valid = !errors.bride && !errors.groom && !errors.url;
  const shown = (error: string | null) => (submitted ? error : null);

  const save = useMutation({
    // Data pernikahan dulu: pengaturan kartu link ditolak server selama data itu belum ada.
    mutationFn: async () => {
      await adminApi.settings.save({
        siteName,
        brideName,
        groomName,
        publicBaseUrl: publicBaseUrl.trim(),
        countdownAt: wibInputToIso(countdownAt),
      });
      return adminApi.seo.save({
        title,
        // Isi pesan diatur di Pesan WhatsApp; kartu link cukup gambar, judul, dan alamat.
        description: "",
        imageMediaId: image?.id ?? null,
        logoMediaId: logo?.id ?? null,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        refresh("settings"),
        refresh("seo"),
        queryClient.invalidateQueries({ queryKey: ["site"] }),
      ]);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (valid) save.mutate();
  }

  function insertVariable(name: string) {
    const field = titleRef.current;
    const start = field?.selectionStart ?? title.length;
    const end = field?.selectionEnd ?? start;
    const next = `${title.slice(0, start)}${name}${title.slice(end)}`;
    if (next.length > SEO_TITLE_MAX) return;
    setTitle(next);
    const caret = start + name.length;
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(caret, caret);
    });
  }

  const values = {
    panggilan: SAMPLE_GUEST,
    mempelai: `${brideName.trim() || "Hasri"} & ${groomName.trim() || "Ramli"}`,
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <section className="grid gap-4">
        <h4 className="text-sm font-semibold">Pernikahan</h4>
        <Field label={`Nama situs (${siteName.length}/${SITE_NAME_MAX})`}>
          {(id) => (
            <Input
              id={id}
              maxLength={SITE_NAME_MAX}
              placeholder={DEFAULT_SITE_NAME}
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className={INPUT}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mempelai wanita" required error={shown(errors.bride)}>
            {(id) => (
              <Input
                id={id}
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                className={INPUT}
              />
            )}
          </Field>
          <Field label="Mempelai pria" required error={shown(errors.groom)}>
            {(id) => (
              <Input
                id={id}
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                className={INPUT}
              />
            )}
          </Field>
        </div>
        <Field label="Alamat situs" required error={shown(errors.url)}>
          {(id) => (
            <Input
              id={id}
              type="url"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="https://"
              value={publicBaseUrl}
              onChange={(e) => setPublicBaseUrl(e.target.value)}
              className={INPUT}
            />
          )}
        </Field>
        <Field label="Hitung mundur ke (WIB)">
          {(id) => (
            <Input
              id={id}
              type="datetime-local"
              value={countdownAt}
              onChange={(e) => setCountdownAt(e.target.value)}
              className={INPUT}
            />
          )}
        </Field>
      </section>

      <section className="grid gap-4">
        <h4 className="text-sm font-semibold">Logo</h4>
        <ImageField label="Logo / ikon situs" value={logo} onChange={setLogo} specs={LOGO_SPECS} />
      </section>

      <section className="grid gap-4">
        <h4 className="text-sm font-semibold">Saat link dibagikan</h4>
        <div className="rounded-lg bg-[#efeae2] p-3">
          <div className="ms-auto max-w-80">
            <LinkCard
              title={renderSeoText(title.trim() || DEFAULT_SEO_TITLE, values)}
              image={image?.thumb ?? null}
              host={hostOf(publicBaseUrl)}
            />
          </div>
        </div>
        <ImageField label="Gambar kartu" value={image} onChange={setImage} specs={CARD_SPECS} />
        <Field label={`Judul (${title.length}/${SEO_TITLE_MAX})`}>
          {(id) => (
            <Input
              id={id}
              ref={titleRef}
              maxLength={SEO_TITLE_MAX}
              placeholder={DEFAULT_SEO_TITLE}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT}
            />
          )}
        </Field>
        <VariableChips variables={SEO_VARIABLES} onInsert={insertVariable} />
      </section>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div>
        <Button type="submit" disabled={save.isPending} className="h-11 md:h-9">
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

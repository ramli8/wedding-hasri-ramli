import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  DEFAULT_MESSAGE_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE,
  type Event,
  formatEventDate,
  MESSAGE_TEMPLATE_VARIABLES,
  renderTemplate,
  type Settings,
} from "@wedding/shared";
import { ArrowRight, RotateCcw } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { useCaretInsert, VariableChips } from "@/components/kit/variable-chips";
import { MessagePreview } from "@/components/message-preview";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../../lib/admin-api.js";
import { coupleNames } from "../../lib/message.js";
import { eventsQuery, settingsQuery, useRefresh } from "../../lib/queries.js";
import { ContentSection } from "./settings-layout.js";

const SAMPLE_GUEST = "Bpk. Budi & Keluarga";

type Kind = "undangan" | "pengingat";

const KINDS: Record<
  Kind,
  { label: string; defaultText: string; saved: (e: Event) => string; desc: string }
> = {
  undangan: {
    label: "Undangan",
    defaultText: DEFAULT_MESSAGE_TEMPLATE,
    saved: (e) => e.messageTemplate,
    desc: "Terkirim saat Anda menekan Kirim di daftar tamu.",
  },
  pengingat: {
    label: "Pengingat RSVP",
    defaultText: DEFAULT_REMINDER_TEMPLATE,
    saved: (e) => e.reminderTemplate,
    desc: "Terkirim dari menu RSVP → Kirim pengingat, untuk tamu yang belum menjawab.",
  },
};

/**
 * Pesan WhatsApp/Instagram per acara: pesan undangan dan pengingat RSVP. Setiap acara otomatis
 * memakai pesan bawaan sampai diubah di sini, dan pesannya ikut terhapus bersama acaranya.
 */
export function MessageSettings() {
  const events = useQuery(eventsQuery);
  const settings = useQuery(settingsQuery);
  const search = useSearch({ strict: false }) as { acara?: string; jenis?: "pengingat" };
  const navigate = useNavigate();
  const kind: Kind = search.jenis ?? "undangan";
  const all = events.data ?? [];
  // Pengingat hanya untuk acara yang memakai RSVP.
  const list = kind === "pengingat" ? all.filter((e) => e.hasRsvp) : all;
  const selected = list.find((e) => e.id === search.acara) ?? list[0];

  const go = (next: { acara?: string; jenis?: Kind }) =>
    void navigate({
      to: "/admin/pengaturan/pesan",
      search: {
        acara: next.acara,
        jenis: (next.jenis ?? kind) === "pengingat" ? "pengingat" : undefined,
      },
    });

  return (
    <ContentSection
      title="Pesan WhatsApp"
      desc="Pesan yang terkirim ke tamu lewat WhatsApp/Instagram. Setiap acara punya pesannya sendiri dan otomatis memakai contoh bawaan sampai Anda mengubahnya."
    >
      <div className="grid gap-4">
        <div role="tablist" aria-label="Jenis pesan" className="flex gap-1 rounded-lg bg-muted p-1">
          {(Object.keys(KINDS) as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === kind}
              onClick={() => go({ acara: selected?.id, jenis: k })}
              className={`min-h-11 flex-1 rounded-md px-3 text-sm font-medium ${
                k === kind ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              {KINDS[k].label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{KINDS[kind].desc}</p>

        {events.isError && <Alert tone="error">{events.error.message}</Alert>}
        {events.isPending ? (
          <p className="text-muted-foreground">Memuat…</p>
        ) : !selected ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              {kind === "pengingat"
                ? "Belum ada acara dengan RSVP. Nyalakan RSVP pada acara di menu Acara."
                : "Belum ada acara. Pesan undangan dibuat otomatis setiap kali Anda menambah acara."}
            </p>
            <Link to="/admin/acara" className={buttonVariants({ variant: "outline" })}>
              Ke menu Acara <ArrowRight aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            {list.length > 1 && (
              <div role="tablist" aria-label="Acara" className="flex flex-wrap gap-2">
                {list.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    role="tab"
                    aria-selected={event.id === selected.id}
                    onClick={() => go({ acara: event.id })}
                    className={buttonVariants({
                      variant: event.id === selected.id ? "default" : "outline",
                      size: "sm",
                    })}
                  >
                    {event.name}
                  </button>
                ))}
              </div>
            )}
            {/* key: ganti acara/jenis = formulir baru, isian sebelumnya tidak terbawa. */}
            <MessageForm
              key={`${kind}:${selected.id}`}
              kind={kind}
              event={selected}
              settings={settings.data}
            />
          </>
        )}
      </div>
    </ContentSection>
  );
}

function MessageForm({
  kind,
  event,
  settings,
}: {
  kind: Kind;
  event: Event;
  settings: Settings | null | undefined;
}) {
  const refresh = useRefresh();
  const { defaultText } = KINDS[kind];
  const saved = KINDS[kind].saved(event) || defaultText;
  const [text, setText] = useState(saved);
  const template = useCaretInsert(text, setText);

  const save = useMutation({
    mutationFn: () =>
      kind === "pengingat"
        ? adminApi.events.saveReminder(event.id, text)
        : adminApi.events.saveMessage(event.id, text),
    onSuccess: () => refresh("events"),
  });

  function onSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    save.mutate();
  }

  const preview = renderTemplate(text, {
    panggilan: SAMPLE_GUEST,
    link: `${settings?.publicBaseUrl ?? "https://situs-anda.com"}/u/ABC234`,
    acara: event.name,
    tanggal: formatEventDate(event.startsAt),
    // Contoh tamu dari kelompok berjam tertentu; jam asli diambil dari kelompok tiap tamu.
    jam_sesi: "10.00–12.00 WIB",
    tempat: event.venueName ?? "",
    mempelai: coupleNames(settings) || "Hasri & Ramli",
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label={`Isi pesan ${KINDS[kind].label.toLowerCase()} untuk ${event.name}`}>
        {(id) => (
          <Textarea
            id={id}
            ref={template.ref}
            value={text}
            spellCheck={false}
            className={`${kind === "pengingat" ? "min-h-48" : "min-h-96"} text-sm leading-relaxed`}
            onChange={(e) => setText(e.target.value)}
            onSelect={template.trackCaret}
          />
        )}
      </Field>
      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">
          Ketuk untuk menyisipkan di posisi kursor; diganti otomatis per tamu. Format WhatsApp:{" "}
          <code>*tebal*</code>, <code>_miring_</code>, <code>~coret~</code>.
        </p>
        <VariableChips variables={MESSAGE_TEMPLATE_VARIABLES} onInsert={template.insert} />
      </div>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={save.isPending || text === saved}>
          Simpan
        </Button>
        {text !== defaultText && (
          <Button variant="outline" onClick={() => setText(defaultText)}>
            <RotateCcw aria-hidden />
            Kembalikan ke contoh bawaan
          </Button>
        )}
      </div>

      <div className="grid gap-1.5 border-t pt-4">
        <p className="text-sm font-medium">
          Pratinjau untuk tamu <span className="text-muted-foreground">({SAMPLE_GUEST})</span>
        </p>
        <MessagePreview text={preview} guestName={SAMPLE_GUEST} />
      </div>
    </form>
  );
}

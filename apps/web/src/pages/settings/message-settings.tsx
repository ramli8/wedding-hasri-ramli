import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  DEFAULT_MESSAGE_TEMPLATE,
  type Event,
  formatEventDate,
  formatTimeRange,
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

/**
 * Pesan undangan per acara. Setiap acara otomatis memakai pesan bawaan sampai diubah di sini, dan
 * pesannya ikut terhapus bersama acaranya.
 */
export function MessageSettings() {
  const events = useQuery(eventsQuery);
  const settings = useQuery(settingsQuery);
  const search = useSearch({ strict: false }) as { acara?: string };
  const navigate = useNavigate();
  const list = events.data ?? [];
  const selected = list.find((e) => e.id === search.acara) ?? list[0];

  return (
    <ContentSection
      title="Pesan undangan"
      desc="Pesan WhatsApp/Instagram yang terkirim saat Anda menekan Kirim di daftar tamu. Setiap acara punya pesannya sendiri dan otomatis memakai contoh bawaan sampai Anda mengubahnya."
    >
      {events.isError && <Alert tone="error">{events.error.message}</Alert>}
      {events.isPending ? (
        <p className="text-muted-foreground">Memuat…</p>
      ) : !selected ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Belum ada acara. Pesan undangan dibuat otomatis setiap kali Anda menambah acara.
          </p>
          <Link to="/admin/acara" className={buttonVariants({ variant: "outline" })}>
            Ke menu Acara <ArrowRight aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.length > 1 && (
            <div role="tablist" aria-label="Acara" className="flex flex-wrap gap-2">
              {list.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  role="tab"
                  aria-selected={event.id === selected.id}
                  onClick={() =>
                    void navigate({ to: "/admin/pengaturan/pesan", search: { acara: event.id } })
                  }
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
          {/* key: ganti acara = formulir baru, isian acara sebelumnya tidak terbawa. */}
          <MessageForm key={selected.id} event={selected} settings={settings.data} />
        </div>
      )}
    </ContentSection>
  );
}

function MessageForm({ event, settings }: { event: Event; settings: Settings | null | undefined }) {
  const refresh = useRefresh();
  const [text, setText] = useState(event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE);
  const template = useCaretInsert(text, setText);
  const saved = event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE;

  const save = useMutation({
    mutationFn: () => adminApi.events.saveMessage(event.id, text),
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
    jam_sesi: event.startsAt && event.endsAt ? formatTimeRange(event.startsAt, event.endsAt) : "",
    tempat: event.venueName ?? "",
    mempelai: coupleNames(settings) || "Hasri & Ramli",
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label={`Isi pesan untuk ${event.name}`}>
        {(id) => (
          <Textarea
            id={id}
            ref={template.ref}
            value={text}
            spellCheck={false}
            className="min-h-96 text-sm leading-relaxed"
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
        {text !== DEFAULT_MESSAGE_TEMPLATE && (
          <Button variant="outline" onClick={() => setText(DEFAULT_MESSAGE_TEMPLATE)}>
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

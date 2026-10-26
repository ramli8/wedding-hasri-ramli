import { useNavigate } from "@tanstack/react-router";
import { guestCodeSchema } from "@wedding/shared";
import { SearchX, ShieldAlert, WifiOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Badge } from "../../components/guest-ui/badge.js";
import { Button } from "../../components/guest-ui/button.js";
import { Card } from "../../components/guest-ui/card.js";
import { ApiError } from "../../lib/api.js";

type Kind = "not-found" | "rate-limited" | "offline" | "other";

function kindOf(error: Error): Kind {
  if (error instanceof ApiError) {
    if (error.code === "NETWORK") return "offline";
    if (error.status === 429) return "rate-limited";
    // 400: bentuk kode salah (mis. kurang karakter); bagi tamu sama saja dengan tidak ditemukan.
    if (error.status === 404 || error.status === 400) return "not-found";
  }
  return "other";
}

const COPY: Record<Kind, { tag: string; title: string; body: string; icon: typeof SearchX }> = {
  "not-found": {
    tag: "Kode tidak dikenali",
    title: "Undangan tidak ditemukan",
    body: "Kami tidak menemukan undangan dengan kode ini. Periksa lagi tautan dari pesan WhatsApp atau Instagram Anda, atau ketik ulang kodenya di bawah.",
    icon: SearchX,
  },
  "rate-limited": {
    tag: "Terlalu banyak percobaan",
    title: "Tunggu sebentar",
    body: "Terlalu banyak kode yang dicoba dari perangkat ini. Coba lagi dalam beberapa menit, atau gunakan tautan asli dari pesan undangan Anda.",
    icon: ShieldAlert,
  },
  offline: {
    tag: "Tidak ada koneksi",
    title: "Undangan belum bisa dibuka",
    body: "Perangkat Anda sedang offline dan belum ada salinan undangan ini. Sambungkan ke internet, lalu coba lagi.",
    icon: WifiOff,
  },
  other: {
    tag: "Terjadi kesalahan",
    title: "Undangan belum bisa dimuat",
    body: "Ada gangguan di server kami. Coba lagi sebentar lagi.",
    icon: ShieldAlert,
  },
};

/** Kode yang diketik tamu: huruf besar, hanya huruf dan angka, maksimal 6 karakter. */
const cleanCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

export function TicketProblem({
  error,
  code,
  onRetry,
}: {
  error: Error;
  code: string;
  onRetry: () => void;
}) {
  const kind = kindOf(error);
  const { tag, title, body, icon: Icon } = COPY[kind];
  const navigate = useNavigate();
  const [typed, setTyped] = useState("");
  const valid = guestCodeSchema.safeParse(typed).success;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (valid) void navigate({ to: "/u/$code", params: { code: typed } });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card tone="ink" shadow="lg" className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center border-2 border-bone bg-acid text-ink">
            <Icon className="size-6" aria-hidden />
          </span>
          <Badge variant="tag" className="text-ink">
            {tag}
          </Badge>
        </div>
        <h2 className="font-display text-3xl leading-tight font-bold tracking-h1 uppercase">
          {title}
        </h2>
        {kind === "not-found" && code && (
          <p className="w-fit border-2 border-dashed border-bone px-3 py-2 font-mono text-2xl tracking-widest break-all line-through decoration-2">
            {code.toUpperCase()}
          </p>
        )}
        <p className="text-bone/90">{body}</p>
        {(kind === "offline" || kind === "other") && (
          <Button variant="secondary" onClick={onRetry} className="w-fit">
            Coba lagi
          </Button>
        )}
      </Card>

      {kind === "not-found" && (
        <Card className="flex flex-col gap-3">
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label htmlFor="kode-undangan" className="tag">
              Ketik ulang kode undangan
            </label>
            <div className="flex gap-2">
              <input
                id="kode-undangan"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={6}
                placeholder="ABC234"
                value={typed}
                onChange={(e) => setTyped(cleanCode(e.target.value))}
                className="h-11 min-w-0 flex-1 border-2 border-ink bg-paper px-3 font-mono text-xl tracking-widest text-ink uppercase placeholder:text-placeholder focus:bg-bone"
              />
              <Button type="submit" disabled={!valid}>
                Buka
              </Button>
            </div>
            <p className="text-xs text-ink-soft">
              Kode terdiri dari 6 huruf dan angka, tanpa huruf I dan O serta angka 0 dan 1.
            </p>
          </form>
        </Card>
      )}

      <p className="text-center text-sm text-ink-soft">
        Masih bermasalah? Hubungi mempelai yang mengirim undangan ini.
      </p>
    </div>
  );
}

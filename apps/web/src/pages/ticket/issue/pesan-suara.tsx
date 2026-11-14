import { VOICE_MAX_MS } from "@wedding/shared";
import { useEffect, useRef, useState } from "react";
import { publicApi } from "../../../lib/public-api.js";
import { OUTLINE, PRIMARY } from "./parts.js";

type State =
  | { kind: "idle" }
  | { kind: "recording"; startedAt: number }
  | { kind: "recorded"; blob: Blob; url: string; durationMs: number }
  | { kind: "sending"; blob: Blob; url: string; durationMs: number }
  | { kind: "sent"; remaining: number };

/** Format rekaman yang dipilih: Opus di WebM (Chrome/Firefox), AAC di MP4 (Safari iPhone). */
function pickMime(): string | undefined {
  for (const type of [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ]) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return undefined;
}

const seconds = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Pesan suara untuk pengantin (maks. 60 detik), direkam langsung di halaman undangan. Kode tamu di
 * alamat halaman menjadi kredensialnya; tamu lain tidak bisa mendengarkan.
 */
export function PesanSuara({ code }: { code: string }) {
  const supported =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;
  const [state, setState] = useState<State>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const stopTracks = () => {
    for (const track of stream.current?.getTracks() ?? []) track.stop();
    stream.current = null;
  };

  // Hitung mundur dan berhenti sendiri di 60 detik.
  useEffect(() => {
    if (state.kind !== "recording") return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() - state.startedAt >= VOICE_MAX_MS) recorder.current?.stop();
    }, 250);
    return () => clearInterval(timer);
  }, [state]);

  // Bersihkan mikrofon dan URL rekaman saat halaman ditinggal.
  const url = state.kind === "recorded" || state.kind === "sending" ? state.url : null;
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      for (const track of stream.current?.getTracks() ?? []) track.stop();
    },
    [],
  );

  async function start() {
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "Mikrofon tidak bisa dipakai. Izinkan akses mikrofon untuk halaman ini, lalu coba lagi.",
      );
      return;
    }
    const mimeType = pickMime();
    const rec = new MediaRecorder(stream.current, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 48_000,
    });
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    rec.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    rec.onstop = () => {
      stopTracks();
      const durationMs = Math.min(Date.now() - startedAt, VOICE_MAX_MS);
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
      if (durationMs < 1_000 || blob.size === 0) {
        setError("Rekaman terlalu pendek. Tekan Rekam lalu bicara beberapa detik.");
        setState({ kind: "idle" });
        return;
      }
      setState({ kind: "recorded", blob, url: URL.createObjectURL(blob), durationMs });
    };
    recorder.current = rec;
    rec.start();
    setNow(startedAt);
    setState({ kind: "recording", startedAt });
  }

  async function send() {
    if (state.kind !== "recorded") return;
    setError(null);
    setState({ ...state, kind: "sending" });
    try {
      const result = await publicApi.sendVoice(code, state.blob, state.durationMs);
      setState({ kind: "sent", remaining: result.remaining });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan suara");
      setState({ ...state, kind: "recorded" });
    }
  }

  if (!code) return null;

  return (
    <div className="flex flex-col gap-4 border-t border-umber/25 pt-8">
      <div className="flex flex-col gap-1">
        <p className="tag text-dim">Pesan suara</p>
        <p className="text-lg">
          Rekam ucapan untuk kami, paling lama 1 menit. Hanya kami berdua yang mendengarnya.
        </p>
      </div>

      {!supported ? (
        <p className="text-lg text-dim italic">Peramban ini belum bisa merekam suara.</p>
      ) : state.kind === "sent" ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="text-xl text-ember italic">
            Terima kasih, pesan suara Anda sudah kami terima.
          </p>
          {state.remaining > 0 && (
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className={`${OUTLINE} self-start`}
            >
              Rekam lagi
            </button>
          )}
        </div>
      ) : state.kind === "recording" ? (
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-xl tabular-nums" aria-live="polite">
            <span className="size-3 animate-pulse rounded-full bg-red-600" aria-hidden />
            {seconds(now - state.startedAt)} / {seconds(VOICE_MAX_MS)}
          </span>
          <button type="button" onClick={() => recorder.current?.stop()} className={PRIMARY}>
            Berhenti
          </button>
        </div>
      ) : state.kind === "recorded" || state.kind === "sending" ? (
        <div className="flex flex-col gap-3">
          {/* biome-ignore lint/a11y/useMediaCaption: rekaman suara tamu sendiri, tanpa teks */}
          <audio controls src={state.url} className="w-full" />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void send()}
              disabled={state.kind === "sending"}
              className={PRIMARY}
            >
              {state.kind === "sending" ? "Mengirim…" : `Kirim (${seconds(state.durationMs)})`}
            </button>
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              disabled={state.kind === "sending"}
              className={OUTLINE}
            >
              Rekam ulang
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => void start()} className={`${PRIMARY} self-start`}>
          Rekam pesan suara
        </button>
      )}
      {error && (
        <p role="alert" className="text-lg text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

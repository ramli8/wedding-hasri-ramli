import { useNavigate } from "@tanstack/react-router";
import { BOOTH_FRAME_LABELS, type BoothFrame, uuid7 } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { Camera, Check, Printer, RotateCcw, Settings2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ThemeProvider } from "@/context/theme-provider";
import { useDocumentTitle } from "@/lib/document-title";
import { cn } from "@/lib/utils";
import { useBoothCamera } from "../../lib/booth/camera.js";
import {
  activeFrames,
  type BoothPhotoRow,
  countPending,
  getBoothMeta,
  markPrinted,
  photoLink,
  requestPersistentStorage,
  savePhoto,
  setBoothMeta,
} from "../../lib/booth/db.js";
import {
  canvasToJpeg,
  composePhoto,
  drawFrame,
  FRAME_SPECS,
  formatPhotoNumber,
  loadFrameFonts,
  PHOTO_SIZE,
} from "../../lib/booth/frames.js";
import { startBoothSync } from "../../lib/booth/uploader.js";
import { FrameThumb, SAMPLE_PHOTO_ID } from "./frame-thumb.js";
import { StaffPanel } from "./staff-panel.js";

const COUNTDOWN_FROM = 3;
/** Tanpa pilihan di layar tinjau, booth kembali ke siaga (foto tetap disimpan, tidak dicetak). */
const REVIEW_TIMEOUT_S = 20;
/** Lama layar "Sedang dicetak" sebelum kembali ke siaga. */
const PRINTING_SCREEN_MS = 9_000;

type Shot = { row: BoothPhotoRow; url: string };
type Stage =
  | { kind: "idle" }
  | { kind: "countdown"; n: number }
  | { kind: "review"; shot: Shot; left: number }
  | { kind: "printing"; shot: Shot };

/** Bunyi rana singkat dari derau (tanpa berkas audio, jadi tetap jalan offline). */
function shutterSound() {
  try {
    const audio = new AudioContext();
    const length = Math.floor(audio.sampleRate * 0.09);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(audio.destination);
    source.onended = () => void audio.close();
    source.start();
  } catch {
    // Tanpa suara pun tidak apa-apa.
  }
}

/**
 * Ukuran kertas cetak: 4R mendatar tanpa tepi. Hanya dipasang selama halaman booth terbuka. Gambar
 * cetak dipasang langsung di bawah <body> (portal) dan semua elemen lain disembunyikan dengan
 * `display: none`, jadi tinggi dokumen saat cetak tepat satu lembar (tidak ada halaman kosong).
 */
const PRINT_CSS = `
@page { size: 152mm 102mm; margin: 0; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body > :not(.booth-print) { display: none !important; }
  .booth-print { display: block !important; width: 152mm; height: 102mm; overflow: hidden; }
  .booth-print img { width: 152mm; height: 102mm; display: block; }
}
`;

export function BoothPage() {
  useDocumentTitle("Photobooth");
  return (
    <ThemeProvider>
      <Booth />
    </ThemeProvider>
  );
}

function Booth() {
  const navigate = useNavigate();
  const camera = useBoothCamera();
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [flash, setFlash] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const printImgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const syncRef = useRef<ReturnType<typeof startBoothSync> | null>(null);
  /** Aksi yang sedang berjalan di layar tinjau; mencegah CETAK ganda dan balapan dengan timeout. */
  const actionRef = useRef<"print" | "timeout" | null>(null);
  const printingRef = useRef(false);
  /** Peringatan untuk petugas (foto gagal disimpan/diambil); tampil di baris status. */
  const [notice, setNotice] = useState<string | null>(null);

  const frames = useLiveQuery(() => activeFrames(), [], null);
  const auth = useLiveQuery(() => getBoothMeta("auth"), [], null);
  // QR pratinjau: contoh tautan halaman foto; setiap foto mendapat QR-nya sendiri saat dipotret.
  const previewQr = useLiveQuery(() => photoLink(SAMPLE_PHOTO_ID), [], null);
  const authError = useLiveQuery(() => getBoothMeta("authError"), [], null);
  // undefined = belum pernah sinkron; null = alamat situs belum diisi di Pengaturan. Keduanya membuat
  // QR memakai alamat laptop ini (mis. localhost), yang mungkin tidak bisa dibuka HP tamu.
  const photoBaseUrl = useLiveQuery(
    async () => (await getBoothMeta("photoBaseUrl")) ?? "none",
    [],
    "",
  );
  const pending = useLiveQuery(() => countPending(), [], 0);
  const [frame, setFrame] = useState<BoothFrame>("poster");
  const [online, setOnline] = useState(() => navigator.onLine);

  // Bingkai pilihan harus termasuk yang aktif.
  useEffect(() => {
    if (frames && frames.length > 0 && !frames.includes(frame)) setFrame(frames[0] as BoothFrame);
  }, [frames, frame]);

  useEffect(() => {
    // Foto offline adalah satu-satunya salinan: minta agar browser tidak menghapusnya.
    void requestPersistentStorage();
    syncRef.current = startBoothSync();
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      syncRef.current?.stop();
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Lapisan bingkai pratinjau digambar ulang saat bingkai berganti (setelah font siap).
  useEffect(() => {
    let cancelled = false;
    void loadFrameFonts().then(() => {
      const canvas = overlayRef.current;
      const ctx = canvas?.getContext("2d");
      if (cancelled || !canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawFrame(ctx, frame, previewQr);
    });
    return () => {
      cancelled = true;
    };
  }, [frame, previewQr]);

  const capture = useCallback(async () => {
    const video = camera.videoRef.current;
    const stream = video?.srcObject;
    const live =
      stream instanceof MediaStream &&
      stream.getVideoTracks().some((track) => track.readyState === "live");
    // Tanpa gambar kamera jangan sampai menyimpan foto hitam; pemanggil kembali ke siaga.
    if (!video || video.videoWidth === 0 || !live) throw new Error("Kamera tidak mengirim gambar");
    await loadFrameFonts();
    const source = document.createElement("canvas");
    source.width = video.videoWidth;
    source.height = video.videoHeight;
    source.getContext("2d")?.drawImage(video, 0, 0);

    const number = ((await getBoothMeta("counter")) ?? 0) + 1;
    // Id foto dibuat di sini agar QR di cetakan langsung menunjuk halaman foto ini (/foto/<id>),
    // walau fotonya baru terunggah nanti saat laptop online.
    const id = uuid7();
    const out = document.createElement("canvas");
    composePhoto(
      out,
      source,
      { width: source.width, height: source.height },
      frame,
      await photoLink(id),
    );
    const blob = await canvasToJpeg(out);
    const row: BoothPhotoRow = {
      id,
      blob,
      frame,
      takenAt: new Date().toISOString(),
      number,
      printCount: 0,
    };
    setStage({
      kind: "review",
      shot: { row, url: URL.createObjectURL(blob) },
      left: REVIEW_TIMEOUT_S,
    });
  }, [camera.videoRef, frame]);

  const start = useCallback(() => {
    if (stage.kind !== "idle" || camera.error || !camera.size) return;
    setStage({ kind: "countdown", n: COUNTDOWN_FROM });
  }, [stage.kind, camera.error, camera.size]);

  // Hitung mundur: 3, 2, 1, lalu kilat dan foto.
  useEffect(() => {
    if (stage.kind !== "countdown") return;
    const timer = setTimeout(() => {
      if (stage.n > 1) {
        setStage({ kind: "countdown", n: stage.n - 1 });
        return;
      }
      setFlash(true);
      shutterSound();
      setTimeout(() => setFlash(false), 350);
      void capture().catch((err: unknown) => {
        setNotice(`Foto gagal diambil: ${err instanceof Error ? err.message : "galat kamera"}.`);
        setStage({ kind: "idle" });
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [stage, capture]);

  // Kamera mati saat hitung mundur: batalkan, jangan memotret layar hitam.
  useEffect(() => {
    if (stage.kind === "countdown" && camera.error) setStage({ kind: "idle" });
  }, [stage.kind, camera.error]);

  /**
   * Menyimpan foto ke perangkat (lalu diunggah saat online) dan memakai nomornya. Mengembalikan
   * false bila gagal (mis. penyimpanan penuh); petugas diberi tahu lewat baris status.
   */
  const keep = useCallback(async (shot: Shot): Promise<boolean> => {
    try {
      await savePhoto(shot.row);
      const counter = (await getBoothMeta("counter")) ?? 0;
      if (shot.row.number > counter) await setBoothMeta("counter", shot.row.number);
      syncRef.current?.now();
      return true;
    } catch (err) {
      setNotice(
        `Foto no. ${formatPhotoNumber(shot.row.number)} GAGAL disimpan di laptop: ${
          err instanceof Error ? err.message : "galat penyimpanan"
        }. Periksa ruang disk.`,
      );
      return false;
    }
  }, []);

  /** Kembali ke siaga, hanya bila layar masih menampilkan foto ini di tahap `from`. */
  const leave = useCallback((shot: Shot, from: "review" | "printing") => {
    setStage((current) => {
      if (current.kind !== from || current.shot !== shot) return current;
      URL.revokeObjectURL(shot.url);
      return { kind: "idle" };
    });
  }, []);

  /** ULANGI: foto dibuang tanpa disimpan. Diabaikan bila CETAK sudah diproses. */
  const discard = useCallback(
    (shot: Shot) => {
      if (actionRef.current === "print") return;
      leave(shot, "review");
    },
    [leave],
  );

  // Tinjau: hitung mundur waktu; habis = simpan tanpa mencetak.
  useEffect(() => {
    if (stage.kind !== "review") return;
    const { shot } = stage;
    const timer = setTimeout(() => {
      if (stage.left > 1) {
        setStage((current) =>
          current.kind === "review" && current.shot === shot
            ? { ...current, left: current.left - 1 }
            : current,
        );
        return;
      }
      if (actionRef.current) return;
      actionRef.current = "timeout";
      void keep(shot).finally(() => {
        if (actionRef.current === "timeout") actionRef.current = null;
        // Bila CETAK ditekan di detik terakhir, layar sudah pindah ke "printing" dan tidak diubah.
        leave(shot, "review");
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [stage, keep, leave]);

  const print = useCallback(async (row: BoothPhotoRow) => {
    // Satu cetakan dalam satu waktu: klik ganda atau remote yang mengirim tombol dua kali tidak
    // boleh menghasilkan dua lembar.
    if (printingRef.current) return;
    printingRef.current = true;
    const url = URL.createObjectURL(row.blob);
    try {
      flushSync(() => setPrintUrl(url));
      // Tunggu gambar cetak siap sebelum memanggil print (dengan --kiosk-printing langsung tercetak).
      const img = printImgRef.current;
      if (img) await img.decode().catch(() => {});
      window.print();
      await markPrinted(row.id).catch(() => {});
    } finally {
      printingRef.current = false;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  }, []);

  const confirmPrint = useCallback(async () => {
    if (stage.kind !== "review" || actionRef.current === "print") return;
    actionRef.current = "print";
    const { shot } = stage;
    try {
      // Gagal disimpan tetap dicetak: tamu tetap mendapat fotonya, petugas melihat peringatan.
      await keep(shot);
      setStage((current) =>
        current.kind === "review" && current.shot === shot ? { kind: "printing", shot } : current,
      );
      await print(shot.row);
    } finally {
      actionRef.current = null;
    }
  }, [stage, keep, print]);

  useEffect(() => {
    if (stage.kind !== "printing") return;
    const { shot } = stage;
    const timer = setTimeout(() => leave(shot, "printing"), PRINTING_SCREEN_MS);
    return () => clearTimeout(timer);
  }, [stage, leave]);

  // Tombol keyboard dan remote presenter (yang mengirim PageDown/PageUp atau panah).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (staffOpen || event.repeat) return;
      const next = [" ", "Enter", "PageDown", "ArrowRight", "ArrowDown"].includes(event.key);
      const prev = ["PageUp", "ArrowLeft", "ArrowUp", "Backspace"].includes(event.key);
      if (!next && !prev) return;
      event.preventDefault();
      if (stage.kind === "idle") {
        if (next) start();
        else if (frames && frames.length > 1) {
          const i = frames.indexOf(frame);
          setFrame(frames[(i + 1) % frames.length] as BoothFrame);
        }
      } else if (stage.kind === "review") {
        if (next) void confirmPrint();
        else discard(stage.shot);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, start, confirmPrint, discard, frames, frame, staffOpen]);

  const spec = FRAME_SPECS[frame];
  const win = spec.window;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const showPreview = stage.kind === "idle" || stage.kind === "countdown";

  return (
    <div className="booth flex h-dvh flex-col overflow-hidden bg-background text-foreground select-none">
      <style>{PRINT_CSS}</style>

      {/* Bilah atas sepola scanner: identitas di kiri, status unggah dan tombol petugas di kanan. */}
      <header className="border-b bg-background/95">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-6">
          <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            H&amp;R
          </div>
          <div className="grid min-w-0 flex-1 text-sm leading-tight">
            <span className="truncate font-semibold">Photobooth</span>
            <span className="truncate text-xs text-muted-foreground">
              {auth?.deviceName ?? "Laptop booth"}
            </span>
          </div>
          <Badge variant="outline" className="h-8 gap-2 px-3 text-sm">
            <span
              aria-hidden
              className={cn("size-2 rounded-full", online ? "bg-success" : "bg-warning")}
            />
            {online ? "Online" : "Offline"}
            <span className="text-muted-foreground">
              · {pending > 0 ? `${pending} foto menunggu unggah` : "semua terunggah"}
            </span>
          </Badge>
          <Button variant="ghost" onClick={() => setStaffOpen(true)}>
            <Settings2 aria-hidden />
            Petugas
          </Button>
        </div>
      </header>

      {(authError || notice || photoBaseUrl === "none") && (
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-6 pt-4">
          {photoBaseUrl === "none" && (
            <Alert>
              Alamat situs belum diterima dari server (laptop belum tersambung, atau alamat situs
              belum diisi di Pengaturan → Situs). QR di cetakan memakai alamat laptop ini dan
              mungkin tidak bisa dibuka tamu.
            </Alert>
          )}
          {authError && <Alert tone="error">{authError} Foto tetap tersimpan di laptop ini.</Alert>}
          {notice && (
            <Alert tone="error">
              <span className="flex items-start justify-between gap-3">
                {notice}
                <button type="button" onClick={() => setNotice(null)} className="underline">
                  Tutup
                </button>
              </span>
            </Alert>
          )}
        </div>
      )}

      <main className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 items-center gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Panggung: pratinjau langsung (dicerminkan) atau hasil (tidak dicerminkan). */}
        <Card
          className={cn(
            "relative mx-auto aspect-[3/2] w-full max-w-[calc((100dvh-10rem)*1.5)] gap-0 overflow-hidden p-0",
            stage.kind === "printing" && "hidden",
          )}
          style={{ background: spec.ground }}
        >
          <video
            ref={camera.videoRef}
            muted
            playsInline
            className="absolute object-cover"
            style={{
              left: pct(win.x, PHOTO_SIZE.width),
              top: pct(win.y, PHOTO_SIZE.height),
              width: pct(win.w, PHOTO_SIZE.width),
              height: pct(win.h, PHOTO_SIZE.height),
              transform: "scaleX(-1)",
              visibility: showPreview ? "visible" : "hidden",
            }}
          />
          <canvas
            ref={overlayRef}
            width={PHOTO_SIZE.width}
            height={PHOTO_SIZE.height}
            className="absolute inset-0 size-full"
            style={{ visibility: showPreview ? "visible" : "hidden" }}
            aria-hidden
          />
          {stage.kind === "review" && (
            <img src={stage.shot.url} alt="Hasil foto" className="absolute inset-0 size-full" />
          )}
          {camera.error && showPreview && (
            <div className="absolute inset-0 grid place-items-center bg-background/90 p-8 text-center">
              <div className="flex max-w-md flex-col items-center gap-4">
                <span className="grid size-14 place-items-center rounded-full bg-muted">
                  <Camera className="size-7 text-muted-foreground" aria-hidden />
                </span>
                <p className="text-lg">{camera.error}</p>
                <Button onClick={() => void camera.retry()}>Coba lagi</Button>
              </div>
            </div>
          )}
          {stage.kind === "countdown" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/10">
              <span
                key={stage.n}
                className="booth-count text-[34vh] leading-[.85] font-bold text-white [text-shadow:0_8px_40px_rgba(0,0,0,.45)]"
              >
                {stage.n}
              </span>
              <span className="rounded-full bg-background/90 px-6 py-2 text-[3vh] font-semibold">
                Senyum!
              </span>
            </div>
          )}
        </Card>

        {stage.kind !== "printing" && (
          <Card className="gap-5 p-6">
            {stage.kind === "review" ? (
              <ReviewPanel
                left={stage.left}
                onPrint={() => void confirmPrint()}
                onRetake={() => discard(stage.shot)}
              />
            ) : (
              <IdlePanel
                frames={frames ?? []}
                frame={frame}
                onFrame={setFrame}
                onStart={start}
                counting={stage.kind === "countdown"}
                disabled={!!camera.error || !camera.size || stage.kind === "countdown"}
                previewQr={previewQr}
              />
            )}
          </Card>
        )}

        {stage.kind === "printing" && (
          <PrintingScreen number={formatPhotoNumber(stage.shot.row.number)} online={online} />
        )}
      </main>

      {flash && <div className="booth-flash pointer-events-none fixed inset-0 z-40 bg-white" />}

      {staffOpen && (
        <StaffPanel
          camera={camera}
          onClose={() => setStaffOpen(false)}
          onReprint={(row) => void print(row)}
          onSyncNow={() => syncRef.current?.now()}
          onUnpaired={() => void navigate({ to: "/booth/pasang" })}
        />
      )}

      {createPortal(
        <div className="booth-print hidden" aria-hidden>
          {printUrl && <img ref={printImgRef} src={printUrl} alt="" />}
        </div>,
        document.body,
      )}
    </div>
  );
}

function IdlePanel({
  frames,
  frame,
  onFrame,
  onStart,
  counting,
  disabled,
  previewQr,
}: {
  frames: BoothFrame[];
  frame: BoothFrame;
  onFrame: (frame: BoothFrame) => void;
  onStart: () => void;
  counting: boolean;
  disabled: boolean;
  previewQr: string | null;
}) {
  return (
    <>
      <div className="grid gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">
          {counting ? "Bersiap…" : "Siap berfoto?"}
        </h1>
        <p className="text-muted-foreground">
          Berdiri di tanda, tekan tombol, lalu tersenyum. Fotomu langsung dicetak, dan QR di
          cetakannya membuka versi digitalnya.
        </p>
      </div>
      {frames.length > 1 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Pilih bingkai</legend>
          <div className="grid grid-cols-3 gap-2">
            {frames.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={f === frame}
                disabled={counting}
                onClick={() => onFrame(f)}
                className={cn(
                  "grid gap-1.5 rounded-lg border p-1.5 text-xs font-medium transition-colors hover:bg-accent/50 disabled:opacity-60",
                  f === frame && "border-primary ring-2 ring-primary/30",
                )}
              >
                <FrameThumb frame={f} qr={previewQr} className="rounded-sm border-0" />
                <span className="flex items-center justify-center gap-1">
                  {f === frame && <Check className="size-3.5" aria-hidden />}
                  {BOOTH_FRAME_LABELS[f]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <Button onClick={onStart} disabled={disabled} className="h-16 text-lg">
        <Camera className="size-6" aria-hidden />
        Ambil foto
      </Button>
      <p className="text-center text-sm text-muted-foreground">atau tekan Spasi / tombol remote</p>
    </>
  );
}

function ReviewPanel({
  left,
  onPrint,
  onRetake,
}: {
  left: number;
  onPrint: () => void;
  onRetake: () => void;
}) {
  return (
    <>
      <div className="grid gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Cetak foto ini?</h1>
        <p className="text-muted-foreground">
          Kalau belum pas, ulangi saja. Foto yang dicetak juga bisa diunduh lewat QR di cetakannya.
        </p>
      </div>
      <Button onClick={onPrint} className="h-16 text-lg">
        <Printer className="size-6" aria-hidden />
        Cetak
      </Button>
      <Button variant="outline" onClick={onRetake} className="h-14 text-base">
        <RotateCcw className="size-5" aria-hidden />
        Ulangi
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Kembali ke layar awal dalam {left} detik tanpa mencetak.
      </p>
    </>
  );
}

function PrintingScreen({ number, online }: { number: string; online: boolean }) {
  return (
    <div className="col-span-full grid place-items-center">
      <Card className="max-w-lg items-center gap-4 px-10 py-12 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-success text-white ring-[10px] ring-success/15">
          <Printer className="size-10" aria-hidden />
        </span>
        <h1 className="text-4xl font-bold tracking-tight">Sedang dicetak</h1>
        <p className="text-lg text-muted-foreground">
          Ambil fotomu di printer, kira-kira satu menit. Pindai QR di cetakannya untuk mengunduh
          versi digitalnya.
        </p>
        <p className="text-sm text-muted-foreground">
          Foto no. {number} · {online ? "tersimpan" : "tersimpan, diunggah saat online"}
        </p>
      </Card>
    </div>
  );
}

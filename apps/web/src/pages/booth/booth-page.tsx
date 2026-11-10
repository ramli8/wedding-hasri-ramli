import { useNavigate } from "@tanstack/react-router";
import { BOOTH_FRAME_LABELS, type BoothFrame, uuid7 } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useBoothCamera } from "../../lib/booth/camera.js";
import {
  activeFrames,
  type BoothPhotoRow,
  countPending,
  getBoothMeta,
  markPrinted,
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
  const authError = useLiveQuery(() => getBoothMeta("authError"), [], null);
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
      drawFrame(ctx, frame, "····");
    });
    return () => {
      cancelled = true;
    };
  }, [frame]);

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
    const out = document.createElement("canvas");
    composePhoto(
      out,
      source,
      { width: source.width, height: source.height },
      frame,
      formatPhotoNumber(number),
    );
    const blob = await canvasToJpeg(out);
    const row: BoothPhotoRow = {
      id: uuid7(),
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
    <main className="booth fixed inset-0 overflow-hidden bg-[#0e0c0a] text-[#efe6d6] select-none">
      <style>{PRINT_CSS}</style>

      <div className="flex h-full items-center gap-[3vw] px-[3vw] py-[4vh]">
        {/* Panggung: pratinjau langsung (dicerminkan) atau hasil (tidak dicerminkan). */}
        <div
          className={`relative aspect-[3/2] shrink-0 shadow-[0_0_0_1px_#3a322b] ${
            stage.kind === "countdown" ? "mx-auto w-[min(88vw,132vh)]" : "w-[min(60vw,88vh)]"
          } ${stage.kind === "printing" ? "hidden" : ""}`}
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
              filter: spec.photoFilter,
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
            <img
              src={stage.shot.url}
              alt="Hasil foto"
              className="absolute inset-0 size-full shadow-[0_24px_60px_rgba(0,0,0,.6)]"
            />
          )}
          {camera.error && showPreview && (
            <div className="absolute inset-0 grid place-items-center bg-[#0e0c0a]/85 p-8 text-center">
              <div className="flex max-w-md flex-col items-center gap-4">
                <p className="font-[Courier_Prime] text-lg">{camera.error}</p>
                <button
                  type="button"
                  onClick={() => void camera.retry()}
                  className="min-h-11 border-2 border-[#efe6d6] px-6 font-[Bebas_Neue] text-2xl tracking-wider"
                >
                  COBA LAGI
                </button>
              </div>
            </div>
          )}
          {stage.kind === "countdown" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span
                key={stage.n}
                className="booth-count font-[Bebas_Neue] text-[42vh] leading-[.8] text-[#fff6ea] [text-shadow:0_8px_40px_rgba(0,0,0,.6)]"
              >
                {stage.n}
              </span>
              <span className="bg-[#0e0c0a] px-5 py-2 font-[Courier_Prime] text-[3vh] tracking-[.3em] text-[#fff6ea]">
                SENYUM!
              </span>
            </div>
          )}
        </div>

        {stage.kind === "idle" && (
          <IdlePanel
            frames={frames ?? []}
            frame={frame}
            onFrame={setFrame}
            onStart={start}
            disabled={!!camera.error || !camera.size}
          />
        )}

        {stage.kind === "review" && (
          <div className="flex min-w-0 flex-1 flex-col gap-[2.4vh]">
            <span className="font-[Courier_Prime] text-[1.7vh] tracking-[.2em] text-[#a89a8a]">
              ADEGAN SELESAI DIREKAM
            </span>
            <h1 className="font-[Bebas_Neue] text-[10vh] leading-[.9] font-normal">
              CETAK
              <br />
              FOTO INI?
            </h1>
            <button
              type="button"
              onClick={() => void confirmPrint()}
              className="mt-2 min-h-[13vh] bg-[#a5532f] font-[Bebas_Neue] text-[6.5vh] tracking-[.06em] text-[#fff6ea] active:brightness-90"
            >
              CETAK
            </button>
            <button
              type="button"
              onClick={() => discard(stage.shot)}
              className="min-h-[10vh] border-2 border-[#efe6d6] font-[Bebas_Neue] text-[4.6vh] tracking-[.06em] active:bg-white/10"
            >
              ULANGI
            </button>
            <span className="font-[Courier_Prime] text-[1.7vh] text-[#a89a8a]">
              Kembali ke layar awal dalam {stage.left} detik tanpa mencetak.
            </span>
          </div>
        )}

        {stage.kind === "printing" && (
          <PrintingScreen number={formatPhotoNumber(stage.shot.row.number)} online={online} />
        )}
      </div>

      {/* Baris status untuk petugas. */}
      {stage.kind === "idle" && (
        <div className="absolute top-[2vh] left-[3vw] flex flex-wrap gap-3 font-[Courier_Prime] text-[13px] tracking-[.08em] text-[#d8cfc2]">
          <span className="border border-[#3a322b] px-3 py-1.5">
            {online ? "● ONLINE" : "● OFFLINE"}
            {pending > 0 ? ` · ${pending} FOTO MENUNGGU UNGGAH` : " · SEMUA TERUNGGAH"}
          </span>
          {authError && (
            <span className="border border-[#c9784f] px-3 py-1.5 text-[#f0b08f]">
              {authError.toUpperCase()} · FOTO TETAP TERSIMPAN DI LAPTOP INI
            </span>
          )}
          {notice && (
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="border border-[#c9784f] px-3 py-1.5 text-left text-[#f0b08f]"
              title="Tutup pesan"
            >
              {notice} ✕
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setStaffOpen(true)}
        className="absolute right-[2vw] bottom-[2vh] min-h-11 px-3 font-[Courier_Prime] text-[13px] tracking-[.12em] text-[#6f6458] hover:text-[#d8cfc2]"
      >
        PETUGAS
      </button>

      {flash && <div className="booth-flash pointer-events-none absolute inset-0 bg-white" />}

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
    </main>
  );
}

function IdlePanel({
  frames,
  frame,
  onFrame,
  onStart,
  disabled,
}: {
  frames: BoothFrame[];
  frame: BoothFrame;
  onFrame: (frame: BoothFrame) => void;
  onStart: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[2.6vh]">
      <span className="font-[Courier_Prime] text-[1.6vh] tracking-[.2em] text-[#a89a8a]">
        PHOTOBOOTH · PEMUTARAN PERDANA
      </span>
      <h1 className="font-[Bebas_Neue] text-[11vh] leading-[.9] font-normal tracking-[.01em]">
        JADILAH
        <br />
        PEMERAN
        <br />
        MALAM INI
      </h1>
      <p className="font-[Cormorant_Garamond] text-[2.9vh] leading-snug text-[#d8cfc2]">
        Berdiri di tanda, tekan tombol, lalu tersenyum. Fotomu langsung dicetak 4R.
      </p>
      {frames.length > 1 && (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 font-[Courier_Prime] text-[13px] tracking-[.16em] text-[#a89a8a]">
            PILIH BINGKAI
          </legend>
          {frames.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={f === frame}
              onClick={() => onFrame(f)}
              className={`min-h-11 border px-4 font-[Courier_Prime] text-[15px] tracking-[.08em] ${
                f === frame
                  ? "border-[#efe6d6] bg-[#efe6d6] text-[#0e0c0a]"
                  : "border-[#3a322b] text-[#d8cfc2] hover:border-[#a89a8a]"
              }`}
            >
              {BOOTH_FRAME_LABELS[f]}
            </button>
          ))}
        </fieldset>
      )}
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="min-h-[14vh] bg-[#a5532f] font-[Bebas_Neue] text-[6.6vh] tracking-[.06em] text-[#fff6ea] active:brightness-90 disabled:opacity-40"
      >
        AMBIL FOTO
      </button>
      <span className="font-[Courier_Prime] text-[1.7vh] text-[#a89a8a]">
        atau tekan Spasi / tombol remote
      </span>
    </div>
  );
}

function PrintingScreen({ number, online }: { number: string; online: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh] bg-[#ebe3d5] text-center text-[#221c17]">
      <div className="booth-holes absolute inset-x-0 top-0 h-[7vh] bg-[#0e0c0a]" />
      <span className="font-[Courier_Prime] text-[2vh] tracking-[.24em] text-[#6f6458]">
        TERIMA KASIH SUDAH HADIR
      </span>
      <h1 className="font-[Bebas_Neue] text-[19vh] leading-[.85] font-normal">
        SEDANG
        <br />
        DICETAK
      </h1>
      <p className="font-[Cormorant_Garamond] text-[4vh] leading-tight">
        Ambil fotomu di printer.
        <br />
        Kira-kira satu menit.
      </p>
      <p className="font-[Courier_Prime] text-[1.8vh] tracking-[.1em] text-[#6f6458]">
        FOTO NO. {number} · {online ? "TERSIMPAN" : "TERSIMPAN, DIUNGGAH SAAT ONLINE"}
      </p>
      <div className="booth-holes absolute inset-x-0 bottom-0 h-[7vh] bg-[#0e0c0a]" />
    </div>
  );
}

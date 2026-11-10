import { ISSUE } from "./content.js";
import { picSrc } from "./parts.js";

/**
 * Pembuka: poster film hitam putih selebar dan setinggi layar. Persembahan dari kedua keluarga di
 * atas, judul nama mempelai, blok kredit, dan tanggal tayang di bawah, ditambah nama tamu.
 */
export function IssueCover() {
  const { bride, groom } = ISSUE;
  const billing = [
    `Dibintangi ${bride.full}`,
    groom.full,
    "Dengan doa restu kedua orang tua",
    `Lokasi ${ISSUE.city}`,
    "Disutradarai oleh takdir",
  ];
  return (
    <header
      id="poster"
      className="reel relative isolate flex min-h-[max(40rem,100svh)] flex-col overflow-hidden"
    >
      <div className="grain absolute inset-0 -z-10">
        <img
          src={picSrc(ISSUE.cover.pic)}
          alt={`${bride.short} dan ${groom.short}`}
          className="bw poster-img size-full object-cover object-[50%_40%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(14_12_10/0.7)_0%,rgb(14_12_10/0)_22%,rgb(14_12_10/0)_45%,rgb(14_12_10/0.92)_80%)]"
        />
      </div>

      <p className="tag mx-auto max-w-xs px-5 pt-[max(1.5rem,env(safe-area-inset-top))] text-center leading-relaxed text-screen/85">
        Keluarga Bpk. Buasan &amp; Keluarga Bpk. Ngatmari mempersembahkan
      </p>

      <div className="mt-auto flex flex-col items-center gap-5 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
        <p className="poster-rise text-2xl text-ember italic md:text-3xl">sebuah kisah</p>
        <h1 className="poster-rise poster-font text-[clamp(5.5rem,27vw,13rem)] leading-[0.8]">
          {bride.short}
          <br />
          <span className="text-[0.55em]">&amp;</span> {groom.short}
        </h1>
        <div className="poster-rise-late flex w-full max-w-md flex-col items-center gap-5">
          <p className="billing text-[13px] text-screen/70 uppercase">{billing.join(" · ")}</p>
          <p className="poster-font text-2xl tracking-[0.3em]">
            Tayang {ISSUE.dateParts.join(" · ")}
          </p>
          <p className="tag text-screen/75">Undangan khusus untuk {ISSUE.guest.name}</p>
          <a
            href="#tiket"
            className="tag inline-flex min-h-11 items-center border-b border-screen/50 text-screen hover:border-screen"
          >
            Ambil tiket Anda
          </a>
        </div>
      </div>
    </header>
  );
}

import { type CSSProperties, useState } from "react";
import type { Pic } from "./content.js";
import { picSrc } from "./parts.js";

/** Cetakan meleset: foto hitam putih dengan lapisan merah bergeser, tanda potong, tanda registrasi, dan bilah warna. Ketuk untuk meluruskan. */
export function MisprintPhoto({ pic, alt = "" }: { pic: Pic; alt?: string }) {
  const [aligned, setAligned] = useState(false);
  const mark = "absolute size-4 border-ink";
  return (
    <div className="relative mx-5 my-8 md:mx-8">
      <span aria-hidden className={`${mark} -top-5 -left-5 border-r border-b`} />
      <span aria-hidden className={`${mark} -top-5 -right-5 border-b border-l`} />
      <span aria-hidden className={`${mark} -bottom-5 -left-5 border-t border-r`} />
      <span aria-hidden className={`${mark} -right-5 -bottom-5 border-t border-l`} />
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="absolute -top-9 left-1/2 size-6 -translate-x-1/2 text-ink"
      >
        <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M12 1v22M1 12h22" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <button
        type="button"
        aria-pressed={aligned}
        aria-label={`${alt} (ketuk untuk ${aligned ? "menggeser" : "meluruskan"} cetakan)`}
        onClick={() => setAligned((value) => !value)}
        className="relative block aspect-[4/5] w-full cursor-pointer overflow-hidden bg-bone-2"
      >
        <img
          src={picSrc(pic)}
          alt={alt}
          className="absolute inset-0 size-full object-cover [filter:grayscale(1)_contrast(1.12)]"
        />
        <img
          src={picSrc(pic)}
          alt=""
          aria-hidden
          className={`absolute inset-0 size-full object-cover opacity-60 mix-blend-multiply transition-transform duration-700 [filter:grayscale(1)_sepia(1)_hue-rotate(-35deg)_saturate(6)] ${
            aligned ? "" : "translate-x-[9px] translate-y-[6px]"
          }`}
        />
      </button>
      <div aria-hidden className="tag mt-3 flex items-center gap-1 text-ink-soft">
        {["#1a1612", "#2a8fa6", "#c0307a", "#e3c534"].map((color) => (
          <span key={color} className="size-3.5" style={{ background: color }} />
        ))}
        <span className="ml-2">Uji cetak · 4 warna</span>
      </div>
    </div>
  );
}

/** Foto berbentuk prangko: tepi bergerigi dari lubang perforasi, dengan stempel pos di sudutnya. */
export function StampPhoto({
  pic,
  alt = "",
  postmark,
  className = "",
}: {
  pic: Pic;
  alt?: string;
  postmark?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="[filter:drop-shadow(0_5px_6px_rgba(30,20,8,0.4))]">
        <div
          className="p-[7px]"
          style={{
            backgroundColor: "#fbf8ef",
            backgroundImage: "radial-gradient(circle at 0 0, transparent 4.5px, #fbf8ef 5px)",
            backgroundSize: "14px 14px",
            backgroundPosition: "-7px -7px",
          }}
        >
          <div className="bg-[#fbf8ef] p-2.5">
            <div className="aspect-[4/5] overflow-hidden bg-bone-2">
              <img
                src={picSrc(pic)}
                alt={alt}
                className="size-full object-cover [filter:saturate(0.72)_sepia(0.2)_contrast(1.04)]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
      {postmark && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-5 -bottom-6 flex items-center gap-1 text-ink/70"
        >
          <svg
            viewBox="0 0 80 30"
            className="h-8 w-20"
            role="img"
            aria-label="Garis pembatal prangko"
          >
            {[6, 14, 22].map((y) => (
              <path
                key={y}
                d={`M0 ${y} q10 -6 20 0 t20 0 t20 0 t20 0`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            ))}
          </svg>
          <span className="tag grid size-20 -rotate-12 place-items-center rounded-full border-2 border-current text-center text-[9px] leading-tight">
            {postmark}
          </span>
        </div>
      )}
    </div>
  );
}

/** Tepi bawah sobek yang tetap sama untuk benih yang sama. */
function tornClip(seed: number) {
  const points: string[] = ["0 0", "100% 0"];
  let x = 100;
  let state = seed * 9301 + 49297;
  while (x > 0) {
    state = (state * 9301 + 49297) % 233280;
    const y = 94 + (state / 233280) * 5.5;
    points.push(`${x}% ${y.toFixed(1)}%`);
    x -= 3.5;
  }
  points.push("0 97%");
  return `polygon(${points.join(",")})`;
}

/** Foto dengan tepi bawah sobek seperti guntingan kertas; bayangan mengikuti bentuk sobekan. */
export function TornPhoto({
  pic,
  alt = "",
  ratio = "aspect-[3/4]",
  seed = 1,
  className = "",
}: {
  pic: Pic;
  alt?: string;
  ratio?: string;
  seed?: number;
  className?: string;
}) {
  return (
    <div className={`[filter:drop-shadow(0_10px_10px_rgba(30,20,8,0.38))] ${className}`}>
      <div className={`${ratio} overflow-hidden bg-bone-2`} style={{ clipPath: tornClip(seed) }}>
        <img
          src={picSrc(pic)}
          alt={alt}
          className="size-full object-cover [filter:saturate(0.72)_sepia(0.2)_contrast(1.04)]"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

/** Angka raksasa yang isinya foto: gambar terlihat hanya lewat bentuk hurufnya. */
export function PhotoNumeral({ pic, children }: { pic: Pic; children: string }) {
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(rgba(245,241,232,0.18), rgba(245,241,232,0.18)), url("${picSrc(pic)}")`,
    backgroundSize: "cover",
    backgroundPosition: "center 30%",
    WebkitTextStroke: "2px var(--color-ink)",
  };
  return (
    <span
      aria-hidden
      className="block bg-clip-text font-display text-[clamp(9rem,24vw,24rem)] leading-[0.74] font-black tracking-[-0.06em] text-transparent select-none"
      style={style}
    >
      {children}
    </span>
  );
}

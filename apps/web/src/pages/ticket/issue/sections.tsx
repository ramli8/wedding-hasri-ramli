import { useEffect, useState } from "react";
import { buildIcs, downloadIcs, icsFilename } from "../../../lib/ics.js";
import { ISSUE } from "./content.js";
import { OUTLINE, Photo, Scene } from "./parts.js";

/** Sinopsis: surat pembuka dari mempelai, serif besar di kertas terang. */
export function Sinopsis() {
  return (
    <Scene id="sinopsis" label="Sinopsis" title="Sebuah kisah tentang dua orang" tone="sand">
      <div className="grid gap-10 md:grid-cols-[1fr_18rem] md:items-end md:gap-16">
        <div className="flex max-w-2xl flex-col gap-6 text-2xl leading-snug md:text-3xl">
          <p className="tag text-dim">Bismillahirrahmanirrahim</p>
          {ISSUE.letter.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="text-3xl text-ember italic">
            {ISSUE.bride.short} &amp; {ISSUE.groom.short}
          </p>
        </div>
        <Photo pic={3} alt="Hasri dan Ramli" />
      </div>
    </Scene>
  );
}

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  return [
    ["Hari", Math.floor(left / 86400)],
    ["Jam", Math.floor((left % 86400) / 3600)],
    ["Menit", Math.floor((left % 3600) / 60)],
    ["Detik", left % 60],
  ] as const;
}

/** Jadwal tayang: hitung mundur huruf poster, lalu tiap acara sebagai satu penayangan. */
export function Jadwal() {
  const left = useCountdown(ISSUE.target);
  return (
    <Scene id="jadwal" label="Jadwal tayang" title={ISSUE.dateLabel} tone="reel">
      <dl className="grid grid-cols-4 gap-3 border-y border-screen/20 py-6 md:max-w-2xl">
        {left.map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse items-center gap-1">
            <dt className="tag text-screen/60">{label}</dt>
            <dd className="poster-font text-6xl leading-none tabular-nums md:text-7xl">
              {String(value).padStart(2, "0")}
            </dd>
          </div>
        ))}
      </dl>

      <ol className="mt-14 grid gap-12 md:grid-cols-2 md:gap-10">
        {ISSUE.events.map((event, index) => (
          <li key={event.id} className="flex flex-col gap-4 border-t border-screen/20 pt-6">
            <p className="tag text-ember">Penayangan {index + 1}</p>
            <h3 className="poster-font text-6xl leading-none">{event.name}</h3>
            <p className="poster-font text-3xl tracking-[0.12em] text-screen/90">{event.range}</p>
            <div className="text-xl">
              <p>{event.venue}</p>
              <p className="text-screen/65">{event.address}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={event.maps} target="_blank" rel="noreferrer" className={OUTLINE}>
                Buka peta
              </a>
              <button
                type="button"
                className={OUTLINE}
                onClick={() =>
                  downloadIcs(
                    icsFilename(event.name),
                    buildIcs({
                      uid: `${event.id}@hasri-ramli`,
                      title: event.name,
                      startsAt: event.startsAt,
                      endsAt: event.endsAt,
                      location: `${event.venue}, ${event.address}`,
                      description: `Peta: ${event.maps}`,
                      url: event.maps,
                    }),
                  )
                }
              >
                Simpan ke kalender
              </button>
            </div>
          </li>
        ))}
      </ol>
    </Scene>
  );
}

/** Pemeran utama: potret hitam putih seperti poster karakter, nama huruf poster, keluarga ala kredit. */
export function Pemeran() {
  const people = [
    { ...ISSUE.bride, role: "sebagai mempelai wanita" },
    { ...ISSUE.groom, role: "sebagai mempelai pria" },
  ];
  return (
    <Scene id="pemeran" label="Pemeran utama" title="Dibintangi" tone="reel">
      <div className="grid gap-16 md:grid-cols-2 md:gap-10">
        {people.map((person, index) => (
          <article
            key={person.short}
            className={`flex flex-col gap-5 ${index === 1 ? "md:mt-24" : ""}`}
          >
            <div className="relative">
              <Photo pic={person.pic} alt={person.full} look="bw" />
              <p className="poster-font absolute inset-x-0 bottom-4 text-center text-[clamp(4rem,18vw,7rem)] leading-none text-screen/90">
                {person.short}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="poster-font text-4xl leading-none">{person.full}</h3>
              <p className="text-xl text-ember italic">{person.role}</p>
              <p className="tag leading-relaxed text-screen/70">{person.parents}</p>
              <a
                href={`https://instagram.com/${person.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="tag w-fit border-b border-screen/40 py-2 hover:border-screen"
              >
                @{person.instagram}
              </a>
            </div>
          </article>
        ))}
      </div>
    </Scene>
  );
}

/** Kisah sebagai adegan naskah film: judul adegan bergaya slugline, foto letterbox, dan subtitle. */
export function Adegan() {
  return (
    <Scene id="adegan" label="Kisah kami" title="Empat adegan" tone="sand">
      <ol className="flex flex-col gap-20 md:gap-28">
        {ISSUE.story.map((scene, index) => (
          <li key={scene.year} className="flex flex-col gap-5">
            <p className="tag flex flex-wrap justify-between gap-2 border-b border-umber/25 pb-3 text-umber">
              <span>
                Adegan {String(index + 1).padStart(2, "0")} · Int. {scene.place}
              </span>
              <span className="text-ember">{scene.year}</span>
            </p>
            <div className="bg-reel px-0 py-5 md:py-8">
              <Photo pic={scene.pic} alt={scene.title} ratio="aspect-[2.39/1]" />
              <p className="mx-auto mt-4 max-w-xl px-5 text-center font-sans text-lg text-[#f3e9b9]">
                “{scene.quote}”
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-[16rem_1fr] md:gap-10">
              <h3 className="poster-font text-5xl leading-none">{scene.title}</h3>
              <div className="flex max-w-2xl flex-col gap-4 text-xl leading-relaxed">
                {scene.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Scene>
  );
}

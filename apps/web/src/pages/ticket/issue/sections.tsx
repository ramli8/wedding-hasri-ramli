import { CalendarPlus, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { buildIcs, downloadIcs, icsFilename } from "../../../lib/ics.js";
import { ISSUE, pageOf } from "./content.js";
import { PhotoNumeral, StampPhoto, TornPhoto } from "./frames.js";
import { IssueHead, Sheet, Stamp } from "./parts.js";

/** Surat pengantar dari mempelai: kolom koran dengan huruf awal besar dan kutipan. */
export function Redaksi() {
  return (
    <Sheet id="redaksi" page={pageOf("redaksi")}>
      <IssueHead eyebrow="Rubrik 01 · Dari redaksi" title="Selamat datang di edisi kami" />
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <StampPhoto
            pic={ISSUE.cover.pic}
            alt="Kami berdua, 2026"
            postmark="JAKARTA 2027"
            className="max-w-sm"
          />
          <p className="tag mt-10 max-w-sm text-ink-soft">Kami berdua, 2026</p>
        </div>
        <div className="lg:col-span-8">
          <div className="text-justify text-lg leading-[1.7] hyphens-auto md:columns-2 md:gap-10">
            {ISSUE.letter.map((paragraph, index) => (
              <p
                key={paragraph}
                className={`mb-5 break-inside-avoid-column ${index === 0 ? "drop" : ""}`}
              >
                {paragraph}
              </p>
            ))}
          </div>
          <blockquote className="relative my-8 border-y-[3px] border-double border-ink/60 py-6 text-center font-display text-3xl leading-tight italic md:text-5xl">
            <span
              aria-hidden
              className="absolute -top-6 left-1/2 -translate-x-1/2 bg-paper px-3 text-6xl text-stamp not-italic"
            >
              “
            </span>
            Pelan-pelan, kami sampai di sini. Dan kami ingin Anda ada di sini juga.
          </blockquote>
          <p className="font-display text-4xl italic md:text-5xl">Hasri &amp; Ramli</p>
          <p className="tag mt-1 text-ink-soft">Jakarta, Mei 2027</p>
        </div>
      </div>
    </Sheet>
  );
}

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  return {
    hari: Math.floor(left / 86400),
    jam: Math.floor((left % 86400) / 3600),
    menit: Math.floor((left % 3600) / 60),
    detik: left % 60,
  };
}

/** Agenda ala jadwal siaran: jam besar, tempat, dan hitung mundur dalam kotak bergaris ganda. */
export function Agenda() {
  const left = useCountdown(ISSUE.target);
  return (
    <Sheet id="agenda" page={pageOf("agenda")}>
      <IssueHead
        eyebrow="Rubrik 02 · Agenda"
        title="Agenda hari bahagia"
        deck="Dua acara, satu hari. Simpan ke kalender agar tidak terlewat."
      />
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="relative lg:col-span-5">
          <div className="border-[3px] border-double border-ink/70 p-6 md:p-8">
            <p className="tag mb-4 text-ink-soft">Waktu tersisa menuju hari-H</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
              {Object.entries(left).map(([label, value]) => (
                <div key={label} className="flex flex-col border-b border-ink/30 pb-3">
                  <dd className="font-display text-7xl leading-[0.85] font-black tabular-nums md:text-8xl">
                    {String(value).padStart(2, "0")}
                  </dd>
                  <dt className="tag text-ink-soft uppercase">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <Stamp className="absolute -top-5 -right-2 rotate-[7deg] bg-paper/80">Segera tiba</Stamp>
        </div>

        <ul className="flex flex-col border-t-[3px] border-double border-ink/60 lg:col-span-7">
          {ISSUE.events.map((event) => (
            <li
              key={event.id}
              className="grid gap-4 border-b border-ink/40 py-7 md:grid-cols-[auto_1fr]"
            >
              <p className="font-display text-7xl leading-[0.85] font-black tracking-[-0.04em] md:text-8xl">
                {event.time}
              </p>
              <div className="flex flex-col gap-2">
                <p className="tag text-stamp">
                  {event.day} · {event.range}
                </p>
                <h3 className="font-display text-3xl leading-none font-semibold uppercase md:text-4xl">
                  {event.name}
                </h3>
                <p className="flex items-baseline gap-2">
                  <span className="font-semibold">{event.venue}</span>
                  <span className="leader" />
                  <span className="text-ink-soft">{event.address}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  <button
                    type="button"
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
                    className="tag inline-flex items-center gap-2 underline underline-offset-4 max-md:min-h-11"
                  >
                    <CalendarPlus className="size-4" aria-hidden /> Tambah ke kalender
                  </button>
                  <a
                    href={event.maps}
                    target="_blank"
                    rel="noreferrer"
                    className="tag inline-flex items-center gap-2 underline underline-offset-4 max-md:min-h-11"
                  >
                    <MapPin className="size-4" aria-hidden /> Buka peta
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}

/** Profil: dua potret bertepi sobek, miring berlawanan, dengan nama besar dan biodata berpenuntun titik. */
export function Profil() {
  const people = [
    { ...ISSUE.bride, role: "Mempelai wanita", tilt: "-rotate-2", offset: "", seed: 3 },
    { ...ISSUE.groom, role: "Mempelai pria", tilt: "rotate-2", offset: "md:mt-28", seed: 7 },
  ];
  return (
    <Sheet id="profil" page={pageOf("profil")}>
      <IssueHead
        eyebrow="Rubrik 04 · Profil"
        title="Dua mempelai"
        deck="Mengenal kami dan keluarga yang membesarkan kami."
      />
      <div className="grid gap-20 md:grid-cols-2 md:gap-14">
        {people.map((person) => (
          <article key={person.short} className={`flex flex-col gap-8 ${person.offset}`}>
            <TornPhoto
              pic={person.pic}
              alt={person.full}
              seed={person.seed}
              ratio="aspect-[4/5]"
              className={`mx-auto w-full max-w-md ${person.tilt}`}
            />
            <div>
              <p className="tag text-stamp">{person.role}</p>
              <h3 className="mt-2 font-display text-5xl leading-[0.9] font-black tracking-[-0.03em] md:text-6xl">
                {person.full}
              </h3>
              <dl className="mt-6 flex flex-col gap-3 text-lg">
                {[
                  ["Panggilan", person.short],
                  ["Orang tua", person.parents.replace(/^Put(ra|ri) dari /, "")],
                  ["Instagram", `@${person.instagram}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <dt className="tag text-ink-soft">{label}</dt>
                    <span className="leader" />
                    <dd className="text-right font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
      </div>
    </Sheet>
  );
}

/** Kisah: tiap bab diberi angka raksasa yang isinya foto, dan foto utuhnya sebagai prangko kecil. */
export function Kisah() {
  return (
    <Sheet id="kisah" page={pageOf("kisah")}>
      <IssueHead
        eyebrow="Rubrik 05 · Kisah"
        title="Kisah kami"
        deck="Empat bab, dari tugas kelompok sampai meja makan dua keluarga."
      />
      <div className="flex flex-col gap-20 md:gap-28">
        {ISSUE.story.map((chapter, index) => {
          const number = String(index + 1).padStart(2, "0");
          const flip = index % 2 === 1;
          return (
            <article
              key={chapter.year}
              className="grid gap-8 border-t-[3px] border-double border-ink/60 pt-8 lg:grid-cols-12 lg:items-center"
            >
              <div className={`relative lg:col-span-5 ${flip ? "lg:order-2" : ""}`}>
                <PhotoNumeral pic={chapter.pic}>{number}</PhotoNumeral>
                <StampPhoto
                  pic={chapter.pic}
                  alt={chapter.title}
                  className={`absolute bottom-2 w-32 md:w-40 ${flip ? "left-0 -rotate-6" : "right-0 rotate-6"}`}
                />
              </div>
              <div className={`flex flex-col gap-6 lg:col-span-7 ${flip ? "lg:order-1" : ""}`}>
                <div className="flex flex-col gap-2">
                  <p className="tag text-stamp">
                    Bab {number} · {chapter.year}
                  </p>
                  <h3 className="font-display text-5xl leading-[0.88] font-black tracking-[-0.035em] text-balance md:text-7xl">
                    {chapter.title}
                  </h3>
                </div>
                <div className="text-justify text-lg leading-[1.7] hyphens-auto md:columns-2 md:gap-10">
                  {chapter.body.map((paragraph, i) => (
                    <p
                      key={paragraph}
                      className={`mb-5 break-inside-avoid-column ${i === 0 ? "drop" : ""}`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                <blockquote className="border-l-[6px] border-stamp pl-5 font-display text-2xl leading-snug italic md:text-3xl">
                  {chapter.quote}
                </blockquote>
              </div>
            </article>
          );
        })}
      </div>
    </Sheet>
  );
}

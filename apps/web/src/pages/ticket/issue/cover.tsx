import { Barcode } from "../mag.js";
import { ISSUE, pageOf, TOC } from "./content.js";
import { MisprintPhoto } from "./frames.js";
import { SHEET_INNER, Stamp } from "./parts.js";

/** Sampul edisi: masthead nama, foto utama, daftar isi sebagai coverlines, dan label alamat tamu. */
export function IssueCover({ code }: { code: string }) {
  return (
    <section id="sampul" className="sheet w-full pt-5 pb-12 md:pb-16">
      <div className={SHEET_INNER}>
        <div className="tag grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-y-[3px] border-double border-ink/60 py-2 text-ink-soft">
          <span className="truncate">Edisi pernikahan · No. 1</span>
          <span className="hidden border-x border-ink/40 px-4 text-center sm:block">
            Gratis untuk tamu undangan
          </span>
          <span className="col-start-3 text-right">{ISSUE.dateLabel}</span>
        </div>

        <h1 className="my-6 flex flex-col items-center font-display font-black uppercase leading-[0.78] tracking-[-0.05em] md:my-8 md:flex-row md:justify-center md:gap-[0.12em] md:text-[min(10.4vw,16rem)] text-[clamp(4.5rem,24vw,8rem)]">
          <span>{ISSUE.bride.short}</span>
          <span className="font-normal text-stamp italic normal-case">&amp;</span>
          <span>{ISSUE.groom.short}</span>
        </h1>

        <div className="grid gap-10 border-t border-ink/50 pt-8 lg:grid-cols-12">
          <nav aria-label="Daftar isi" className="order-2 lg:order-1 lg:col-span-3">
            <p className="tag mb-3 border-b border-ink/50 pb-2">Di dalam edisi ini</p>
            <ol className="flex flex-col">
              {TOC.map((item) => (
                <li key={item.id} className="border-b border-ink/20">
                  <a href={`#${item.id}`} className="group flex items-baseline gap-3 py-2.5">
                    <span className="font-display text-3xl leading-none font-black tabular-nums">
                      {pageOf(item.id)}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-display text-lg leading-tight font-semibold group-hover:italic">
                        {item.title}
                      </span>
                      <span className="text-sm text-ink-soft">{item.blurb}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <figure className="relative order-1 lg:order-2 lg:col-span-6">
            <MisprintPhoto pic={ISSUE.cover.pic} alt="Sampul: Hasri dan Ramli" />
            <figcaption className="tag mt-3 flex justify-between gap-4 text-ink-soft">
              <span>Sampul: Hasri &amp; Ramli, 2027</span>
              <span>Ketuk untuk meluruskan cetakan</span>
            </figcaption>
          </figure>

          <aside className="order-3 flex flex-col gap-8 lg:col-span-3">
            <div className="wobble -rotate-1 border border-dashed border-ink/60 bg-[#fbf6e6] p-4 shadow-[0_8px_18px_-12px_rgba(50,30,5,0.6)]">
              <p className="tag text-ink-soft">Kepada Yth.</p>
              <p className="mt-1 font-display text-2xl leading-tight font-semibold">
                {ISSUE.guest.name}
              </p>
              <p className="tag mt-2 text-ink-soft">
                {ISSUE.guest.group} · Tiket {code}
              </p>
              <Barcode value={code} className="mt-3 h-8" />
            </div>

            <div className="relative">
              <p className="font-display text-[clamp(5.5rem,10vw,9rem)] leading-[0.8] font-black tracking-[-0.05em]">
                {ISSUE.dateParts.map((part, index) => (
                  <span key={["hari", "bulan", "tahun"][index]} className="block">
                    {part}
                  </span>
                ))}
              </p>
              <Stamp className="absolute right-0 bottom-0 rotate-[-6deg] bg-paper/80">
                Simpan tanggalnya
              </Stamp>
            </div>

            <ul className="border-t border-ink/50">
              {ISSUE.events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-baseline justify-between gap-3 border-b border-ink/20 py-2"
                >
                  <span className="font-display text-lg font-semibold">{event.name}</span>
                  <span className="tag text-ink-soft">{event.time} WIB</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}

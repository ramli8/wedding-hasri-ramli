import { ArrowUp, Check, Copy, Scissors } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Barcode } from "../mag.js";
import { ISSUE, pageOf } from "./content.js";
import { IssueHead, SHEET_INNER, Sheet, Stamp } from "./parts.js";

function GiftRow({ gift }: { gift: (typeof ISSUE.gifts)[number] }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(gift.number.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Tanpa izin clipboard, nomor tetap terbaca dan bisa disalin manual.
    }
  }
  return (
    <li className="grid gap-x-6 gap-y-1 border-b border-ink/40 py-5 md:grid-cols-[9rem_1fr_auto] md:items-baseline">
      <p className="font-display text-3xl italic">{gift.provider}</p>
      <div>
        <p className="font-display text-4xl leading-none font-black tracking-tight tabular-nums select-all md:text-6xl">
          {gift.number}
        </p>
        <p className="tag mt-1 text-ink-soft">a.n. {gift.holder}</p>
      </div>
      <button type="button" onClick={() => void copy()} className="stamp w-fit max-md:min-h-11">
        {copied ? (
          <Check className="mr-1 inline size-4" aria-hidden />
        ) : (
          <Copy className="mr-1 inline size-4" aria-hidden />
        )}
        {copied ? "Tersalin" : "Salin"}
      </button>
    </li>
  );
}

/** Amplop digital sebagai kupon iklan bergaris putus-putus dengan gunting. */
export function Kupon() {
  return (
    <Sheet id="kupon" page={pageOf("kupon")}>
      <IssueHead
        eyebrow="Rubrik 07 · Kupon"
        title="Kupon amplop digital"
        deck="Doa restu sudah sangat berarti. Bila ingin berbagi kebahagiaan, gunting kupon ini."
      />
      <div className="relative border-[3px] border-dashed border-ink/70 p-6 md:p-10">
        <Scissors
          aria-hidden
          className="absolute -top-3.5 left-8 size-6 rotate-90 bg-paper text-ink"
        />
        <Stamp className="absolute -top-4 right-8 rotate-[5deg] bg-paper">Berlaku selamanya</Stamp>
        <ul className="flex flex-col border-t border-ink/40">
          {ISSUE.gifts.map((gift) => (
            <GiftRow key={gift.provider} gift={gift} />
          ))}
        </ul>
        <p className="tag mt-4 text-center text-ink-soft">
          Hanya satu kupon per tamu · Terima kasih sudah berbagi
        </p>
      </div>
    </Sheet>
  );
}

/** Wishlist sebagai iklan baris koran: kolom rapat, judul kapital, tanpa kotak. */
export function Iklan() {
  const [mine, setMine] = useState<Record<string, boolean>>({});
  return (
    <Sheet id="iklan" page={pageOf("iklan")}>
      <IssueHead
        eyebrow="Rubrik 08 · Iklan baris"
        title="Iklan baris hadiah"
        deck="Bila ingin memberi barang, pilih satu agar tidak ada yang kembar. Bisa dibatalkan kapan saja."
      />
      <ul className="gap-x-10 md:columns-2 lg:columns-3 [&>li]:break-inside-avoid">
        {ISSUE.wishes.map((wish) => {
          const taken = mine[wish.id] ?? false;
          const left = wish.quantity - wish.claimed - (taken ? 1 : 0);
          const full = left <= 0 && !taken;
          return (
            <li key={wish.id} className="mb-8 border-t-[3px] border-double border-ink/60 pt-3">
              <h3
                className={`font-display text-2xl leading-tight font-black uppercase ${full ? "line-through opacity-60" : ""}`}
              >
                {wish.name}
              </h3>
              <p className="mt-1 text-justify">{wish.note}</p>
              <p className="tag mt-2 text-ink-soft">
                {full
                  ? "Sudah terpenuhi"
                  : `Masih dibutuhkan ${Math.max(left, 0)} dari ${wish.quantity}`}
              </p>
              {!full && (
                <button
                  type="button"
                  onClick={() => setMine((state) => ({ ...state, [wish.id]: !taken }))}
                  aria-pressed={taken}
                  className="tag mt-3 underline underline-offset-4 max-md:min-h-11"
                >
                  {taken ? "✓ Pilihan Anda · batalkan" : "Saya yang berikan →"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/** Tanya redaksi: pertanyaan bertanda T, jawaban bertanda J, dalam daftar yang bisa dibuka. */
export function Tanya() {
  return (
    <Sheet id="tanya" page={pageOf("tanya")}>
      <IssueHead
        eyebrow="Rubrik 09 · Tanya redaksi"
        title="Tanya redaksi"
        deck="Pertanyaan yang paling sering datang."
      />
      <div className="flex flex-col border-t-[3px] border-double border-ink/60">
        {ISSUE.faqs.map((faq) => (
          <details key={faq.q} className="group border-b border-ink/40">
            <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5 marker:hidden">
              <span className="font-display text-4xl leading-none font-black text-stamp">T.</span>
              <span className="flex-1 font-display text-2xl leading-snug font-semibold md:text-3xl">
                {faq.q}
              </span>
              <span aria-hidden className="tag transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="flex gap-4 pb-6 text-lg leading-relaxed">
              <span className="font-display text-4xl leading-none font-black">J.</span>
              <span className="max-w-2xl">{faq.a}</span>
            </p>
          </details>
        ))}
      </div>
    </Sheet>
  );
}

function Postage({ n }: { n: number }) {
  return (
    <div
      aria-hidden
      className="relative grid size-20 shrink-0 rotate-3 place-items-center border-2 border-dashed border-ink/60 bg-[#ede2c4] p-1.5"
    >
      <div className="grid size-full place-items-center border border-ink/50 text-center">
        <span className="font-display text-2xl leading-none font-black">{n}</span>
        <span className="tag text-[9px]">POS 2027</span>
      </div>
      <span className="absolute -bottom-3 -left-5 grid size-12 -rotate-12 place-items-center rounded-full border-2 border-ink/50 text-[8px] leading-tight tag text-ink/60">
        JKT
      </span>
    </div>
  );
}

/** Ucapan sebagai surat pembaca berperangko; tulisan baru langsung tampil di atas daftar. */
export function Surat() {
  const [letters, setLetters] = useState<
    { id: string; name: string; when: string; text: string }[]
  >(ISSUE.letters.map((letter) => ({ ...letter, id: letter.name })));
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    setLetters((list) => [
      {
        id: crypto.randomUUID(),
        name: name.trim() || ISSUE.guest.name,
        when: "baru saja",
        text: text.trim(),
      },
      ...list,
    ]);
    setText("");
    setSent(true);
  }

  return (
    <Sheet id="surat" page={pageOf("surat")}>
      <IssueHead
        eyebrow="Rubrik 10 · Surat pembaca"
        title="Surat pembaca"
        deck="Tulis doa dan harapan Anda. Kami simpan di halaman ini."
      />
      <div className="grid gap-12 lg:grid-cols-12">
        <form onSubmit={submit} className="flex flex-col gap-5 lg:col-span-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="surat-nama" className="tag">
              Nama
            </label>
            <input
              id="surat-nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder={ISSUE.guest.name}
              className="h-11 w-full text-base"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="surat-isi" className="tag">
              Isi surat
            </label>
            <textarea
              id="surat-isi"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setSent(false);
              }}
              rows={5}
              maxLength={400}
              required
              className="w-full resize-none text-base"
            />
            <p className="tag text-ink-soft">{text.length}/400</p>
          </div>
          {sent && (
            <p role="status" className="font-display text-xl italic text-stamp">
              Terima kasih, surat Anda sudah kami simpan.
            </p>
          )}
          <button
            type="submit"
            disabled={!text.trim()}
            className="tag h-12 bg-ink px-6 text-paper disabled:opacity-50"
          >
            Kirim surat
          </button>
        </form>
        <ul className="flex flex-col lg:col-span-8">
          {letters.map((letter, index) => (
            <li
              key={letter.id}
              className="grid gap-4 border-t border-ink/40 py-6 first:border-t-[3px] first:border-double sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-display text-2xl leading-snug italic md:text-3xl">
                  “{letter.text}”
                </p>
                <p className="tag mt-3 text-ink-soft">
                  — {letter.name} · {letter.when}
                </p>
              </div>
              <Postage n={letters.length - index} />
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}

/** Kolofon penutup edisi. */
export function Kolofon({ code }: { code: string }) {
  return (
    <footer className={`${SHEET_INNER} pb-8 text-center`}>
      <div className="flex flex-col items-center gap-3 border-t-[3px] border-double border-paper/50 pt-6 text-paper">
        <Barcode value={code} className="max-w-48" />
        <p className="tag text-ink-soft">
          Dicetak dengan penuh cinta · Edisi pernikahan No. 1 · {ISSUE.dateLabel}
        </p>
        <a
          href="#sampul"
          className="tag inline-flex items-center gap-2 underline underline-offset-4 max-md:min-h-11"
        >
          <ArrowUp className="size-4" aria-hidden /> Kembali ke sampul
        </a>
      </div>
    </footer>
  );
}

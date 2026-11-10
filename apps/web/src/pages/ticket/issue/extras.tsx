import { type FormEvent, useState } from "react";
import { ISSUE } from "./content.js";
import { OUTLINE, Photo, PRIMARY, Scene, WRAP } from "./parts.js";

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
    <li className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-umber/25 py-5">
      <div className="flex flex-col gap-1">
        <p className="poster-font text-3xl leading-none">{gift.provider}</p>
        <p className="font-script text-2xl tracking-wide tabular-nums select-all">{gift.number}</p>
        <p className="text-lg text-dim">a.n. {gift.holder}</p>
      </div>
      <button type="button" onClick={() => void copy()} className={OUTLINE}>
        {copied ? "Tersalin" : "Salin"}
      </button>
    </li>
  );
}

/** Tanda kasih: rekening dan daftar hadiah, dengan kalimat pembuka yang lembut. */
export function TandaKasih() {
  const [mine, setMine] = useState<Record<string, boolean>>({});
  return (
    <Scene id="tanda-kasih" label="Tanda kasih" title="Doa restu Anda sudah cukup" tone="sand">
      <p className="-mt-4 mb-12 max-w-xl text-2xl leading-snug">
        Bila ingin berbagi kebahagiaan, Anda dapat mengirim lewat rekening berikut atau memilih satu
        barang dari daftar kami.
      </p>
      <div className="grid gap-16 md:grid-cols-2 md:gap-12">
        <ul className="flex flex-col border-t border-umber/25">
          {ISSUE.gifts.map((gift) => (
            <GiftRow key={gift.provider} gift={gift} />
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <p className="tag text-ember">Daftar hadiah</p>
          <ul className="flex flex-col border-t border-umber/25">
            {ISSUE.wishes.map((wish) => {
              const taken = mine[wish.id] ?? false;
              const left = wish.quantity - wish.claimed - (taken ? 1 : 0);
              const full = left <= 0 && !taken;
              return (
                <li
                  key={wish.id}
                  className="flex items-start justify-between gap-4 border-b border-umber/25 py-4"
                >
                  <div className={full ? "opacity-45" : ""}>
                    <p className="text-2xl leading-tight font-medium">{wish.name}</p>
                    <p className="text-lg text-dim">{wish.note}</p>
                    <p className="tag mt-1 text-dim">
                      {full
                        ? "Sudah terpenuhi"
                        : `Tersisa ${Math.max(left, 0)} dari ${wish.quantity}`}
                    </p>
                  </div>
                  {!full && (
                    <button
                      type="button"
                      aria-pressed={taken}
                      onClick={() => setMine((state) => ({ ...state, [wish.id]: !taken }))}
                      className={`${OUTLINE} shrink-0 ${taken ? "bg-umber text-sand" : ""}`}
                    >
                      {taken ? "Batalkan" : "Saya berikan"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Scene>
  );
}

/** Info penonton: tanya jawab yang bisa dibuka-tutup. */
export function InfoPenonton() {
  return (
    <Scene id="info" label="Info penonton" title="Sebelum Anda datang" tone="reel">
      <div className="flex max-w-3xl flex-col border-t border-screen/20">
        {ISSUE.faqs.map((faq) => (
          <details key={faq.q} className="group border-b border-screen/20">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 marker:hidden">
              <span className="text-2xl leading-snug font-medium">{faq.q}</span>
              <span
                aria-hidden
                className="poster-font text-3xl text-ember transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-6 text-xl leading-relaxed text-screen/80">{faq.a}</p>
          </details>
        ))}
      </div>
    </Scene>
  );
}

/** Ulasan penonton: buku ucapan. Pesan tampil sebagai kutipan ulasan dengan nama bergaya kredit. */
export function Ulasan() {
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
    <Scene id="ulasan" label="Ucapan & doa" title="Kata para penonton" tone="sand">
      <div className="grid gap-14 md:grid-cols-[20rem_1fr] md:gap-16">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label htmlFor="ulasan-nama" className="tag text-dim">
              Nama
            </label>
            <input
              id="ulasan-nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder={ISSUE.guest.name}
              className="h-11 w-full text-base"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="ulasan-isi" className="tag text-dim">
              Ucapan
            </label>
            <textarea
              id="ulasan-isi"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setSent(false);
              }}
              rows={4}
              maxLength={400}
              required
              className="w-full resize-none text-base"
            />
            <p className="tag text-dim">{text.length}/400</p>
          </div>
          {sent && (
            <p role="status" className="text-xl text-ember italic">
              Terima kasih, ucapan Anda sudah kami simpan.
            </p>
          )}
          <button type="submit" disabled={!text.trim()} className={`${PRIMARY} self-start`}>
            Kirim ucapan
          </button>
        </form>
        <ul className="flex flex-col border-t border-umber/25">
          {letters.map((letter) => (
            <li key={letter.id} className="flex flex-col gap-3 border-b border-umber/25 py-6">
              <p className="text-2xl leading-snug italic md:text-3xl">“{letter.text}”</p>
              <p className="tag text-dim">
                — {letter.name} · {letter.when}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Scene>
  );
}

/** Kredit akhir: foto penutup, lalu daftar peran dan nama seperti credit roll, ditutup "Tamat". */
export function Kredit() {
  const last = ISSUE.gallery[ISSUE.gallery.length - 1];
  return (
    <footer className="reel pb-[max(4rem,env(safe-area-inset-bottom))]">
      {last && (
        <Photo pic={last.pic} alt={last.cap} ratio="aspect-[4/5] md:aspect-[2.39/1]" look="bw" />
      )}
      <div className={`${WRAP} flex flex-col items-center gap-14 py-20 text-center md:py-28`}>
        <p className="tag text-ember">Kredit akhir</p>
        <dl className="flex w-full max-w-xl flex-col gap-8">
          {ISSUE.credits.map((credit) => (
            <div key={credit.role} className="flex flex-col gap-1">
              <dt className="tag text-screen/55">{credit.role}</dt>
              {credit.names.map((name) => (
                <dd key={name} className="m-0 poster-font text-3xl leading-tight tracking-[0.06em]">
                  {name}
                </dd>
              ))}
            </div>
          ))}
        </dl>
        <p className="max-w-md text-2xl leading-snug text-screen/85 italic">
          Terima kasih telah menjadi bagian dari kisah kami.
        </p>
        <p className="poster-font text-8xl leading-none">Tamat</p>
        <a href="#poster" className="tag border-b border-screen/40 py-2 hover:border-screen">
          Kembali ke poster
        </a>
      </div>
    </footer>
  );
}

import { randomUUID } from "node:crypto";
import {
  type GuestData,
  guestInputSchema,
  type ImportCommitResponse,
  type ImportPreview,
} from "@wedding/shared";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { asc, inArray, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { events, guestEvents, guestGroups, guests } from "../db/schema.js";
import { generateUniqueCodes } from "../domain/guest-code.js";
import { AppError } from "../http/errors.js";
import { lockGuestRev } from "./checkin-log.js";
import { getSettings } from "./settings.js";

const MAX_ROWS = 2000;
const INSERT_CHUNK = 500;

const HEADER_ALIASES: Record<string, string> = {
  nama: "nama_undangan",
  nama_panggilan: "nama_undangan",
  phone: "hp",
  no_hp: "hp",
  nomor_hp: "hp",
  ig: "instagram",
  group: "kelompok",
  events: "acara",
};

const ROMBONGAN_YES = new Set(["ya", "y", "yes", "1", "true", "rombongan"]);
const ROMBONGAN_NO = new Set(["tidak", "t", "no", "n", "0", "false"]);

const normalizeHeader = (raw: string) => {
  const name = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return HEADER_ALIASES[name] ?? name;
};

type Candidate = {
  line: number;
  status: "ok" | "duplicate" | "error";
  messages: string[];
  displayName: string;
  groupName: string | null;
  data: GuestData | null;
};

/**
 * Teks yang ditempel dari Excel/Google Sheets dipisah tab; berkas CSV memakai koma atau titik koma.
 * Pemisah ditentukan dari baris header, agar koma di dalam nama tidak memecah kolom pada teks bertab.
 */
function isTabSeparated(csv: string) {
  const firstLine = csv.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.includes("\t");
}

function readRecords(csv: string): Record<string, string>[] {
  let header: string[] = [];
  let records: Record<string, string>[];
  const tabbed = isTabSeparated(csv);
  try {
    records = parse(csv, {
      columns: (raw: string[]) => {
        header = raw.map(normalizeHeader);
        return header;
      },
      bom: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: tabbed ? "\t" : [",", ";"],
      // Sel tempelan spreadsheet boleh berisi tanda kutip di tengah teks.
      relax_quotes: tabbed,
      relax_column_count: true,
    });
  } catch (err) {
    throw new AppError(400, "VALIDATION_ERROR", `CSV tidak bisa dibaca: ${(err as Error).message}`);
  }
  if (!header.includes("nama_undangan")) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      'Kolom "nama_undangan" tidak ditemukan. Pakai template CSV.',
    );
  }
  if (records.length === 0) throw new AppError(400, "VALIDATION_ERROR", "Tidak ada baris data");
  if (records.length > MAX_ROWS) {
    throw new AppError(400, "VALIDATION_ERROR", `Maksimal ${MAX_ROWS} baris per impor`);
  }
  return records;
}

type EventRef = { id: string; slug: string; name: string };

/** Kolom acara boleh berisi slug atau nama acara, tanpa memedulikan huruf besar/kecil. */
function eventLookup(rows: EventRef[]) {
  const bySlug = new Map(rows.map((e) => [e.slug.toLowerCase(), e.id]));
  const byName = new Map<string, string[]>();
  for (const e of rows) {
    const key = e.name.trim().toLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), e.id]);
  }
  return (value: string): { id: string } | { error: string } => {
    const key = value.toLowerCase();
    const slugId = bySlug.get(key);
    if (slugId) return { id: slugId };
    const named = byName.get(key) ?? [];
    if (named.length === 1 && named[0]) return { id: named[0] };
    if (named.length > 1) {
      return { error: `Nama acara "${value}" dipakai beberapa acara; tulis slug-nya` };
    }
    return { error: `Acara "${key}" tidak dikenal` };
  };
}

async function analyze(db: Db, csv: string) {
  const records = readRecords(csv);

  const groupRows = await db.select({ name: guestGroups.name }).from(guestGroups);
  const knownGroups = new Set(groupRows.map((g) => g.name.toLowerCase()));
  const eventRows = await db
    .select({ id: events.id, slug: events.slug, name: events.name })
    .from(events);
  const findEvent = eventLookup(eventRows);
  const existing = await db
    .select({ displayName: guests.displayName, phone: guests.phone, instagram: guests.instagram })
    .from(guests)
    .where(isNull(guests.deletedAt));
  const phoneOwner = new Map<string, string>();
  const instagramOwner = new Map<string, string>();
  for (const g of existing) {
    if (g.phone) phoneOwner.set(g.phone, `tamu "${g.displayName}"`);
    if (g.instagram) instagramOwner.set(g.instagram, `tamu "${g.displayName}"`);
  }

  const newGroups = new Map<string, string>(); // lowercase → nama asli
  const rows: Candidate[] = records.map((record, index) => {
    const line = index + 2; // baris 1 adalah header
    const messages: string[] = [];
    let failed = false;
    const fail = (message: string) => {
      messages.push(message);
      failed = true;
    };

    const rombongan = (record.rombongan ?? "").trim().toLowerCase();
    if (rombongan && !ROMBONGAN_YES.has(rombongan) && !ROMBONGAN_NO.has(rombongan)) {
      fail('Kolom rombongan harus "ya" atau "tidak"');
    }

    const wanted = (record.acara ?? "")
      .split(/[;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const eventIds: string[] = [];
    for (const value of wanted) {
      const found = findEvent(value);
      if ("id" in found) eventIds.push(found.id);
      else fail(found.error);
    }
    // Kolom acara kosong berarti diundang ke semua acara.
    const invited = wanted.length ? eventIds : eventRows.map((e) => e.id);

    const parsed = guestInputSchema.safeParse({
      displayName: record.nama_undangan ?? "",
      phone: record.hp,
      instagram: record.instagram,
      isRombongan: ROMBONGAN_YES.has(rombongan),
      usherNote: record.catatan_penjaga,
      eventIds: invited,
    });
    if (!parsed.success) for (const issue of parsed.error.issues) fail(issue.message);

    const groupName = record.kelompok?.trim() || null;
    if (groupName && !knownGroups.has(groupName.toLowerCase())) {
      newGroups.set(groupName.toLowerCase(), newGroups.get(groupName.toLowerCase()) ?? groupName);
    }

    let status: Candidate["status"] = failed ? "error" : "ok";
    if (parsed.success && !failed) {
      const { phone, instagram } = parsed.data;
      const clash: string[] = [];
      if (phone && phoneOwner.has(phone)) clash.push(`HP sama dengan ${phoneOwner.get(phone)}`);
      if (instagram && instagramOwner.has(instagram)) {
        clash.push(`Instagram sama dengan ${instagramOwner.get(instagram)}`);
      }
      if (clash.length) {
        status = "duplicate";
        messages.push(...clash);
      }
      if (phone && !phoneOwner.has(phone)) phoneOwner.set(phone, `baris ${line}`);
      if (instagram && !instagramOwner.has(instagram))
        instagramOwner.set(instagram, `baris ${line}`);
    }

    return {
      line,
      status,
      messages,
      displayName: record.nama_undangan ?? "",
      groupName,
      data: parsed.success && !failed ? parsed.data : null,
    };
  });

  return { rows, newGroups: [...newGroups.values()] };
}

export async function previewImport(db: Db, csv: string): Promise<ImportPreview> {
  const { rows, newGroups } = await analyze(db, csv);
  const counts = { ok: 0, duplicate: 0, error: 0 };
  for (const row of rows) counts[row.status]++;
  return {
    rows: rows.map((row) => ({
      line: row.line,
      status: row.status,
      messages: row.messages,
      displayName: row.displayName,
      phone: row.data?.phone ?? null,
      instagram: row.data?.instagram ?? null,
      groupName: row.groupName,
      isRombongan: row.data?.isRombongan ?? null,
    })),
    newGroups,
    counts,
  };
}

export async function commitImport(
  db: Db,
  csv: string,
  skipDuplicates: boolean,
): Promise<ImportCommitResponse> {
  const { rows, newGroups } = await analyze(db, csv);
  const chosen = rows.filter(
    (row) => row.data && (row.status === "ok" || (row.status === "duplicate" && !skipDuplicates)),
  );
  const skipped = rows.length - chosen.length;

  await db.transaction(async (tx) => {
    await lockGuestRev(tx);
    if (newGroups.length) {
      await tx
        .insert(guestGroups)
        .values(newGroups.map((name) => ({ name })))
        .onConflictDoNothing();
    }
    const groups = await tx
      .select({ id: guestGroups.id, name: guestGroups.name })
      .from(guestGroups);
    const groupId = new Map(groups.map((g) => [g.name.toLowerCase(), g.id]));

    const taken = new Set(
      (await tx.select({ code: guests.code }).from(guests).where(isNotNull(guests.code))).map(
        (row) => row.code as string,
      ),
    );
    const codes = generateUniqueCodes(chosen.length, taken);

    const prepared = chosen.map((row, i) => {
      const data = row.data as GuestData;
      return {
        id: randomUUID(),
        eventIds: [...new Set(data.eventIds)],
        values: {
          code: codes[i] as string,
          displayName: data.displayName,
          phone: data.phone,
          instagram: data.instagram,
          groupId: row.groupName ? (groupId.get(row.groupName.toLowerCase()) ?? null) : null,
          isRombongan: data.isRombongan,
          usherNote: data.usherNote,
          source: "import" as const,
        },
      };
    });

    for (let start = 0; start < prepared.length; start += INSERT_CHUNK) {
      const chunk = prepared.slice(start, start + INSERT_CHUNK);
      await tx.insert(guests).values(chunk.map((p) => ({ id: p.id, ...p.values })));
      const invitations = chunk.flatMap((p) =>
        p.eventIds.map((eventId) => ({ guestId: p.id, eventId })),
      );
      if (invitations.length) await tx.insert(guestEvents).values(invitations);
    }
  });

  return { imported: chosen.length, skipped, createdGroups: newGroups };
}

// --- Ekspor & template -----------------------------------------------------

/** Mencegah sel yang diawali = + - @ dibaca sebagai rumus oleh Excel/Sheets. */
export const safeCell = (value: string | null | undefined) =>
  value && /^[=+\-@\t\r]/.test(value) ? `'${value}` : (value ?? "");

const EXPORT_COLUMNS = [
  "kode",
  "nama_undangan",
  "hp",
  "instagram",
  "kelompok",
  "rombongan",
  "catatan_penjaga",
  "acara",
  "link",
];

/**
 * Label acara untuk kolom `acara` di CSV: nama acara (yang dikenali admin), atau kode singkat bila
 * dua acara bernama sama. Impor menerima keduanya.
 */
function eventLabels(rows: { id?: string; slug: string; name: string }[]) {
  const nameCount = new Map<string, number>();
  for (const e of rows) {
    const key = e.name.trim().toLowerCase();
    nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
  }
  return (e: { slug: string; name: string }) =>
    nameCount.get(e.name.trim().toLowerCase()) === 1 ? e.name.trim() : e.slug;
}

export async function exportGuestsCsv(db: Db): Promise<string> {
  const settings = await getSettings(db);
  const groups = await db.select({ id: guestGroups.id, name: guestGroups.name }).from(guestGroups);
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const eventRows = await db
    .select({ id: events.id, slug: events.slug, name: events.name })
    .from(events);
  const labelOf = eventLabels(eventRows);
  const eventLabel = new Map(eventRows.map((e) => [e.id, labelOf(e)]));

  const rows = await db
    .select()
    .from(guests)
    .where(isNull(guests.deletedAt))
    .orderBy(asc(guests.displayName), asc(guests.id));
  const invitations = rows.length
    ? await db
        .select()
        .from(guestEvents)
        .where(
          inArray(
            guestEvents.guestId,
            rows.map((r) => r.id),
          ),
        )
    : [];

  const records = rows.map((g) => ({
    kode: g.code ?? "",
    nama_undangan: safeCell(g.displayName),
    hp: g.phone ?? "",
    instagram: g.instagram ?? "",
    kelompok: safeCell(g.groupId ? groupName.get(g.groupId) : ""),
    rombongan: g.isRombongan ? "ya" : "tidak",
    catatan_penjaga: safeCell(g.usherNote),
    acara: invitations
      .filter((i) => i.guestId === g.id)
      .map((i) => eventLabel.get(i.eventId))
      .filter(Boolean)
      .join(";"),
    link: settings && g.code ? `${settings.publicBaseUrl}/u/${g.code}` : "",
  }));

  // BOM agar Excel membaca UTF-8 (nama dengan huruf non-ASCII) dengan benar.
  return `﻿${stringify(records, { header: true, columns: EXPORT_COLUMNS })}`;
}

/** Template impor. Contoh kolom acara diambil dari acara yang sudah ada (nama, atau slug bila nama ganda). */
export async function importTemplateCsv(db: Db): Promise<string> {
  const columns = [
    "nama_undangan",
    "hp",
    "instagram",
    "kelompok",
    "rombongan",
    "catatan_penjaga",
    "acara",
  ];
  const eventRows = await db
    .select({ slug: events.slug, name: events.name })
    .from(events)
    .orderBy(asc(events.startsAt), asc(events.name));
  const label = eventLabels(eventRows);
  // Contoh kedua: diundang ke acara terakhir saja (biasanya resepsi). Tanpa acara: contoh lama.
  const last = eventRows.at(-1);
  const exampleEvent = last ? label(last) : "resepsi";

  const examples = [
    {
      nama_undangan: "Bpk. Budi & Keluarga",
      hp: "0812-3456-7890",
      instagram: "",
      kelompok: "Keluarga",
      rombongan: "ya",
      catatan_penjaga: "",
      acara: "",
    },
    {
      nama_undangan: "Sari",
      hp: "",
      instagram: "@sari.rahma",
      kelompok: "Teman Kuliah",
      rombongan: "tidak",
      catatan_penjaga: "",
      acara: exampleEvent,
    },
  ];
  // Dengan dua acara atau lebih, tunjukkan juga cara menulis beberapa acara sekaligus.
  if (eventRows.length > 1) {
    examples.push({
      nama_undangan: "Pak RT",
      hp: "0813-1111-2222",
      instagram: "",
      kelompok: "Tetangga",
      rombongan: "tidak",
      catatan_penjaga: "",
      acara: eventRows.map(label).join(";"),
    });
  }
  return `\ufeff${stringify(examples, { header: true, columns })}`;
}

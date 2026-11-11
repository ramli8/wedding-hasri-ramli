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
import { events, groupEvents, guestEvents, guestGroups, guests } from "../db/schema.js";
import { generateUniqueCodes } from "../domain/guest-code.js";
import { AppError } from "../http/errors.js";
import { lockGuestRev } from "./checkin-log.js";
import { syncGuestEvents } from "./guests.js";
import { getSettings } from "./settings.js";
import {
  buildImportTemplateXlsx,
  buildXlsx,
  GUEST_COLUMNS,
  guestLists,
  isExampleRow,
} from "./xlsx-template.js";

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

const GROUP_PLACEHOLDER = "00000000-0000-4000-8000-000000000000";

async function analyze(db: Db, csv: string) {
  const records = readRecords(csv);

  const groupRows = await db
    .select({ id: guestGroups.id, name: guestGroups.name })
    .from(guestGroups);
  const knownGroups = new Set(groupRows.map((g) => g.name.toLowerCase()));
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
  // Baris contoh dari template Excel dilewati, tapi nomor barisnya tetap dihitung.
  const rows: Candidate[] = records.flatMap((record, index) => {
    if (isExampleRow(record)) return [];
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

    // Kelompok wajib (tamu selalu berkelompok); nama yang belum ada dibuat saat impor. Acara yang
    // diundang mengikuti kelompoknya, jadi kolom acara (bila ada) diabaikan.
    const groupName = record.kelompok?.trim() || null;
    if (!groupName) fail("Kolom kelompok wajib diisi");

    const parsed = guestInputSchema.safeParse({
      displayName: record.nama_undangan ?? "",
      phone: record.hp,
      instagram: record.instagram,
      isRombongan: ROMBONGAN_YES.has(rombongan),
      usherNote: record.catatan_penjaga,
      // Kelompok diperiksa lewat nama di atas; id aslinya baru diketahui saat impor dijalankan.
      groupId: GROUP_PLACEHOLDER,
    });
    if (!parsed.success) for (const issue of parsed.error.issues) fail(issue.message);

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

  const examplesSkipped = records.filter((record) => isExampleRow(record)).length;
  return { rows, newGroups: [...newGroups.values()], examplesSkipped };
}

export async function previewImport(db: Db, csv: string): Promise<ImportPreview> {
  const { rows, newGroups, examplesSkipped } = await analyze(db, csv);
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
    examplesSkipped,
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
      const created = await tx
        .insert(guestGroups)
        .values(newGroups.map((name) => ({ name })))
        .onConflictDoNothing()
        .returning({ id: guestGroups.id });
      // Kelompok baru dari impor diundang ke semua acara (ubah di menu Kelompok bila perlu).
      const allEvents = await tx.select({ id: events.id }).from(events);
      const invites = created.flatMap((g) =>
        allEvents.map((e) => ({ groupId: g.id, eventId: e.id })),
      );
      if (invites.length) await tx.insert(groupEvents).values(invites);
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
        values: {
          code: codes[i] as string,
          displayName: data.displayName,
          phone: data.phone,
          instagram: data.instagram,
          groupId: groupId.get((row.groupName ?? "").toLowerCase()) ?? null,
          isRombongan: data.isRombongan,
          usherNote: data.usherNote,
          source: "import" as const,
        },
      };
    });

    for (let start = 0; start < prepared.length; start += INSERT_CHUNK) {
      const chunk = prepared.slice(start, start + INSERT_CHUNK);
      await tx.insert(guests).values(chunk.map((p) => ({ id: p.id, ...p.values })));
      // Undangan = acara kelompok masing-masing.
      await syncGuestEvents(
        tx,
        chunk.map((p) => p.id),
      );
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
 * Label acara untuk kolom `acara` di CSV ekspor (informasi saja; impor mengabaikannya): nama acara,
 * atau kode singkat bila dua acara bernama sama.
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

/** Data ekspor tamu aktif (dipakai CSV dan Excel). Nilai mentah; pengaman rumus per format. */
async function exportRecords(db: Db) {
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
    nama_undangan: g.displayName,
    hp: g.phone ?? "",
    instagram: g.instagram ?? "",
    kelompok: g.groupId ? (groupName.get(g.groupId) ?? "") : "",
    rombongan: g.isRombongan ? "ya" : "tidak",
    catatan_penjaga: g.usherNote ?? "",
    acara: invitations
      .filter((i) => i.guestId === g.id)
      .map((i) => eventLabel.get(i.eventId))
      .filter(Boolean)
      .join(";"),
    link: settings && g.code ? `${settings.publicBaseUrl}/u/${g.code}` : "",
  }));
  return { records, groupNames: groups.map((g) => g.name).sort((a, b) => a.localeCompare(b)) };
}

export async function exportGuestsCsv(db: Db): Promise<string> {
  const { records: raw } = await exportRecords(db);
  // Sel yang diawali = + - @ diberi petik supaya tidak dibaca sebagai rumus.
  const records = raw.map((r) => ({
    ...r,
    nama_undangan: safeCell(r.nama_undangan),
    kelompok: safeCell(r.kelompok),
    catatan_penjaga: safeCell(r.catatan_penjaga),
  }));
  // BOM agar Excel membaca UTF-8 (nama dengan huruf non-ASCII) dengan benar.
  return `﻿${stringify(records, { header: true, columns: EXPORT_COLUMNS })}`;
}

/** Template impor. Tanpa kolom acara: acara yang diundang mengikuti kelompok. */
export async function importTemplateCsv(): Promise<string> {
  const columns = ["nama_undangan", "hp", "instagram", "kelompok", "rombongan", "catatan_penjaga"];
  const examples = [
    {
      nama_undangan: "Bpk. Budi & Keluarga",
      hp: "0812-3456-7890",
      instagram: "",
      kelompok: "Keluarga",
      rombongan: "ya",
      catatan_penjaga: "",
    },
    {
      nama_undangan: "Sari",
      hp: "",
      instagram: "@sari.rahma",
      kelompok: "Teman Kuliah",
      rombongan: "tidak",
      catatan_penjaga: "",
    },
  ];
  return `\ufeff${stringify(examples, { header: true, columns })}`;
}

/** Template impor Excel: kolom kelompok berupa dropdown dari kelompok yang sudah ada. */
export async function importTemplateXlsx(db: Db): Promise<Uint8Array> {
  const groups = await db
    .select({ name: guestGroups.name })
    .from(guestGroups)
    .orderBy(asc(guestGroups.name));
  return buildImportTemplateXlsx(groups.map((g) => g.name));
}

/**
 * Ekspor tamu sebagai Excel: kolom yang sama dengan CSV, dengan dropdown kelompok dan rombongan
 * seperti template, sehingga berkasnya bisa diperbaiki lalu diimpor lagi. Sel ditulis sebagai teks,
 * jadi tidak pernah dibaca sebagai rumus (tanpa petik pengaman).
 */
export async function exportGuestsXlsx(db: Db): Promise<Uint8Array> {
  const { records, groupNames } = await exportRecords(db);
  const widths: Record<string, number> = { kode: 10, acara: 28, link: 36 };
  const columns = EXPORT_COLUMNS.map(
    (header) =>
      GUEST_COLUMNS.find((c) => c.header === header) ?? { header, width: widths[header] ?? 16 },
  );
  return buildXlsx([
    {
      name: "Tamu",
      columns,
      rows: records.map((r) => EXPORT_COLUMNS.map((c) => r[c as keyof typeof r] ?? "")),
      lists: guestLists(groupNames.length),
    },
    { name: "Kelompok", list: groupNames },
  ]);
}

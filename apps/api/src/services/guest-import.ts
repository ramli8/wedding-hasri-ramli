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
  jumlah: "kuota",
  pax: "kuota",
  events: "acara",
};

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

function readRecords(csv: string): Record<string, string>[] {
  let header: string[] = [];
  let records: Record<string, string>[];
  try {
    records = parse(csv, {
      columns: (raw: string[]) => {
        header = raw.map(normalizeHeader);
        return header;
      },
      bom: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: [",", ";"],
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

async function analyze(db: Db, csv: string) {
  const records = readRecords(csv);

  const groupRows = await db.select({ name: guestGroups.name }).from(guestGroups);
  const knownGroups = new Set(groupRows.map((g) => g.name.toLowerCase()));
  const eventRows = await db.select({ id: events.id, slug: events.slug }).from(events);
  const eventBySlug = new Map(eventRows.map((e) => [e.slug, e.id]));
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

    let quota = 1;
    if (record.kuota) {
      const value = Number(record.kuota);
      if (Number.isInteger(value)) quota = value;
      else fail("Kuota harus angka bulat");
    }

    const slugs = (record.acara ?? "")
      .split(/[;|]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const eventIds: string[] = [];
    for (const slug of slugs) {
      const id = eventBySlug.get(slug);
      if (id) eventIds.push(id);
      else fail(`Acara "${slug}" tidak dikenal`);
    }
    // Kolom acara kosong berarti diundang ke semua acara.
    const invited = slugs.length ? eventIds : eventRows.map((e) => e.id);

    const parsed = guestInputSchema.safeParse({
      displayName: record.nama_undangan ?? "",
      fullName: record.nama_lengkap,
      phone: record.hp,
      instagram: record.instagram,
      quota,
      note: record.catatan,
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
      quota: row.data?.quota ?? null,
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
          fullName: data.fullName,
          phone: data.phone,
          instagram: data.instagram,
          groupId: row.groupName ? (groupId.get(row.groupName.toLowerCase()) ?? null) : null,
          quota: data.quota,
          note: data.note,
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
const safeCell = (value: string | null | undefined) =>
  value && /^[=+\-@\t\r]/.test(value) ? `'${value}` : (value ?? "");

const EXPORT_COLUMNS = [
  "kode",
  "nama_undangan",
  "nama_lengkap",
  "hp",
  "instagram",
  "kelompok",
  "kuota",
  "catatan",
  "catatan_penjaga",
  "acara",
  "link",
];

export async function exportGuestsCsv(db: Db): Promise<string> {
  const settings = await getSettings(db);
  const groups = await db.select({ id: guestGroups.id, name: guestGroups.name }).from(guestGroups);
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const eventRows = await db.select({ id: events.id, slug: events.slug }).from(events);
  const slug = new Map(eventRows.map((e) => [e.id, e.slug]));

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
    nama_lengkap: safeCell(g.fullName),
    hp: g.phone ?? "",
    instagram: g.instagram ?? "",
    kelompok: safeCell(g.groupId ? groupName.get(g.groupId) : ""),
    kuota: g.quota,
    catatan: safeCell(g.note),
    catatan_penjaga: safeCell(g.usherNote),
    acara: invitations
      .filter((i) => i.guestId === g.id)
      .map((i) => slug.get(i.eventId))
      .filter(Boolean)
      .join(";"),
    link: settings && g.code ? `${settings.publicBaseUrl}/u/${g.code}` : "",
  }));

  // BOM agar Excel membaca UTF-8 (nama dengan huruf non-ASCII) dengan benar.
  return `﻿${stringify(records, { header: true, columns: EXPORT_COLUMNS })}`;
}

export function importTemplateCsv(): string {
  const columns = [
    "nama_undangan",
    "nama_lengkap",
    "hp",
    "instagram",
    "kelompok",
    "kuota",
    "catatan",
    "catatan_penjaga",
    "acara",
  ];
  const examples = [
    {
      nama_undangan: "Bpk. Budi & Keluarga",
      nama_lengkap: "Budi Santoso",
      hp: "0812-3456-7890",
      instagram: "",
      kelompok: "Keluarga",
      kuota: 4,
      catatan: "",
      catatan_penjaga: "",
      acara: "",
    },
    {
      nama_undangan: "Sari",
      nama_lengkap: "",
      hp: "",
      instagram: "@sari.rahma",
      kelompok: "Teman Kuliah",
      kuota: 1,
      catatan: "Tidak punya WhatsApp",
      catatan_penjaga: "",
      acara: "resepsi",
    },
  ];
  return `﻿${stringify(examples, { header: true, columns })}`;
}

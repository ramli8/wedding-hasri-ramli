import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { VOICE_MAX_PER_GUEST, type VoiceMessage, type VoiceUploadResponse } from "@wedding/shared";
import { count, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { guestGroups, guests, voiceMessages } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { zipFilesStream } from "./export.js";

/** Subfolder MEDIA_DIR untuk pesan suara (bukan id media, dilewati ZIP foto). */
export const VOICE_DIR = "voice";

const EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
};

/**
 * Jenis berkas dari isinya, bukan dari keterangan peramban: WebM/Matroska (Chrome, Firefox baru),
 * Ogg (Firefox lama), MP4/M4A (Safari iPhone). Selain itu ditolak.
 */
export function sniffAudio(data: Buffer): keyof typeof EXT | null {
  if (data.length < 12) return null;
  if (data.readUInt32BE(0) === 0x1a45dfa3) return "audio/webm";
  if (data.subarray(0, 4).toString("latin1") === "OggS") return "audio/ogg";
  if (data.subarray(4, 8).toString("latin1") === "ftyp") return "audio/mp4";
  return null;
}

export const voicePath = (mediaDir: string, id: string, mimeType: string) =>
  join(mediaDir, VOICE_DIR, `${id}.${EXT[mimeType] ?? "bin"}`);

export async function saveVoice(
  db: Db,
  mediaDir: string,
  guestId: string,
  input: { durationMs: number; data: Buffer },
): Promise<VoiceUploadResponse> {
  const mimeType = sniffAudio(input.data);
  if (!mimeType) throw new AppError(400, "VALIDATION_ERROR", "Berkas rekaman tidak dikenali");
  return db.transaction(async (tx) => {
    // Kunci baris tamu supaya dua kiriman bersamaan tidak melewati batas per tamu.
    await tx.select({ id: guests.id }).from(guests).where(eq(guests.id, guestId)).for("update");
    const [sent] = await tx
      .select({ n: count() })
      .from(voiceMessages)
      .where(eq(voiceMessages.guestId, guestId));
    const already = sent?.n ?? 0;
    if (already >= VOICE_MAX_PER_GUEST) {
      throw new AppError(
        409,
        "CONFLICT",
        `Anda sudah mengirim ${VOICE_MAX_PER_GUEST} pesan suara. Terima kasih!`,
      );
    }
    const [row] = await tx
      .insert(voiceMessages)
      .values({
        guestId,
        durationMs: input.durationMs,
        mimeType,
        sizeBytes: input.data.length,
      })
      .returning({ id: voiceMessages.id });
    if (!row) throw new Error("Gagal menyimpan pesan suara");
    // Berkas ditulis di dalam transaksi: bila gagal, barisnya ikut batal.
    await mkdir(join(mediaDir, VOICE_DIR), { recursive: true });
    await writeFile(voicePath(mediaDir, row.id, mimeType), input.data);
    return { id: row.id, remaining: VOICE_MAX_PER_GUEST - already - 1 };
  });
}

const listColumns = {
  id: voiceMessages.id,
  guestId: voiceMessages.guestId,
  guestName: guests.displayName,
  groupName: guestGroups.name,
  durationMs: voiceMessages.durationMs,
  mimeType: voiceMessages.mimeType,
  sizeBytes: voiceMessages.sizeBytes,
  hidden: voiceMessages.hidden,
  createdAt: voiceMessages.createdAt,
};

type Row = Omit<VoiceMessage, "createdAt"> & { createdAt: Date };
const toMessage = (row: Row): VoiceMessage => ({ ...row, createdAt: row.createdAt.toISOString() });

function selectMessages(db: Db) {
  return db
    .select(listColumns)
    .from(voiceMessages)
    .innerJoin(guests, eq(guests.id, voiceMessages.guestId))
    .leftJoin(guestGroups, eq(guestGroups.id, guests.groupId));
}

export async function listVoice(db: Db): Promise<VoiceMessage[]> {
  const rows = await selectMessages(db).orderBy(desc(voiceMessages.createdAt));
  return rows.map(toMessage);
}

async function getVoice(db: Db, id: string): Promise<VoiceMessage> {
  const [row] = await selectMessages(db).where(eq(voiceMessages.id, id));
  if (!row) throw new AppError(404, "NOT_FOUND", "Pesan suara tidak ditemukan");
  return toMessage(row);
}

/** Lokasi berkas untuk diputar admin. */
export async function voiceFile(db: Db, mediaDir: string, id: string) {
  const item = await getVoice(db, id);
  const path = voicePath(mediaDir, id, item.mimeType);
  const info = await stat(path).catch(() => null);
  if (!info) throw new AppError(404, "NOT_FOUND", "Berkas pesan suara hilang");
  return { path, size: info.size, mimeType: item.mimeType };
}

export async function setVoiceHidden(db: Db, id: string, hidden: boolean): Promise<VoiceMessage> {
  const updated = await db
    .update(voiceMessages)
    .set({ hidden })
    .where(eq(voiceMessages.id, id))
    .returning({ id: voiceMessages.id });
  if (updated.length === 0) throw new AppError(404, "NOT_FOUND", "Pesan suara tidak ditemukan");
  return getVoice(db, id);
}

export async function deleteVoice(db: Db, mediaDir: string, id: string): Promise<void> {
  const [row] = await db
    .delete(voiceMessages)
    .where(eq(voiceMessages.id, id))
    .returning({ mimeType: voiceMessages.mimeType });
  if (!row) throw new AppError(404, "NOT_FOUND", "Pesan suara tidak ditemukan");
  await rm(voicePath(mediaDir, id, row.mimeType), { force: true });
}

/** ZIP pesan suara yang tidak disembunyikan, nama berkas = waktu WIB + nama tamu. */
export async function voiceZip(db: Db, mediaDir: string): Promise<ReadableStream<Uint8Array>> {
  const items = (await listVoice(db)).filter((item) => !item.hidden).reverse();
  const used = new Set<string>();
  return zipFilesStream(
    items.map((item) => {
      const wib = new Date(Date.parse(item.createdAt) + 7 * 3600_000)
        .toISOString()
        .slice(0, 16)
        .replace("T", "_")
        .replace(":", "-");
      const safeName = item.guestName.replace(/[^\p{L}\p{N} .'-]+/gu, "").trim() || "tamu";
      let name = `${wib} ${safeName}`;
      for (let i = 2; used.has(name); i++) name = `${wib} ${safeName} (${i})`;
      used.add(name);
      return {
        name: `${name}.${EXT[item.mimeType] ?? "bin"}`,
        source: voicePath(mediaDir, item.id, item.mimeType),
      };
    }),
  );
}

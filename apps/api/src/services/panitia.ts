import { randomBytes } from "node:crypto";
import type {
  MyTasksResponse,
  PanitiaMember,
  PanitiaMemberData,
  PanitiaTask,
  PanitiaTaskData,
} from "@wedding/shared";
import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { panitiaMembers, panitiaTasks } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { coupleName, getSettings } from "./settings.js";

type MemberRow = typeof panitiaMembers.$inferSelect;
type TaskRow = typeof panitiaTasks.$inferSelect;

const newToken = () => randomBytes(16).toString("base64url");

const toMember = (row: MemberRow): PanitiaMember => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  token: row.token,
});

const toTask = (row: TaskRow): PanitiaTask => ({
  id: row.id,
  title: row.title,
  memberId: row.memberId,
  dueOn: row.dueOn,
  note: row.note,
  doneAt: row.doneAt?.toISOString() ?? null,
});

const memberNotFound = () => new AppError(404, "NOT_FOUND", "Anggota panitia tidak ditemukan");
const taskNotFound = () => new AppError(404, "NOT_FOUND", "Tugas tidak ditemukan");

/** Belum selesai dulu (tenggat terdekat, tanpa tenggat di akhir), lalu yang sudah selesai. */
const taskOrder = [
  sql`${panitiaTasks.doneAt} is not null`,
  sql`${panitiaTasks.dueOn} asc nulls last`,
  asc(panitiaTasks.createdAt),
];

export async function getPanitia(db: Db) {
  const [members, tasks] = await Promise.all([
    db.select().from(panitiaMembers).orderBy(asc(panitiaMembers.createdAt)),
    db
      .select()
      .from(panitiaTasks)
      .orderBy(...taskOrder),
  ]);
  return { members: members.map(toMember), tasks: tasks.map(toTask) };
}

export async function createMember(db: Db, input: PanitiaMemberData) {
  const [row] = await db
    .insert(panitiaMembers)
    .values({ ...input, token: newToken() })
    .returning();
  if (!row) throw new Error("Gagal menyimpan anggota");
  return toMember(row);
}

export async function updateMember(db: Db, id: string, input: PanitiaMemberData) {
  const [row] = await db
    .update(panitiaMembers)
    .set(input)
    .where(eq(panitiaMembers.id, id))
    .returning();
  if (!row) throw memberNotFound();
  return toMember(row);
}

/** Tautan lama langsung tidak berlaku (mis. terkirim ke orang yang salah). */
export async function resetMemberToken(db: Db, id: string) {
  const [row] = await db
    .update(panitiaMembers)
    .set({ token: newToken() })
    .where(eq(panitiaMembers.id, id))
    .returning();
  if (!row) throw memberNotFound();
  return toMember(row);
}

/** Tugasnya tidak ikut terhapus; penanggung jawabnya menjadi kosong. */
export async function deleteMember(db: Db, id: string) {
  const [row] = await db
    .delete(panitiaMembers)
    .where(eq(panitiaMembers.id, id))
    .returning({ id: panitiaMembers.id });
  if (!row) throw memberNotFound();
}

async function assertMember(db: Db, memberId: string | null) {
  if (!memberId) return;
  const [row] = await db
    .select({ id: panitiaMembers.id })
    .from(panitiaMembers)
    .where(eq(panitiaMembers.id, memberId));
  if (!row) throw new AppError(400, "VALIDATION_ERROR", "Penanggung jawab tidak ditemukan");
}

export async function createTask(db: Db, input: PanitiaTaskData) {
  await assertMember(db, input.memberId);
  const [row] = await db.insert(panitiaTasks).values(input).returning();
  if (!row) throw new Error("Gagal menyimpan tugas");
  return toTask(row);
}

export async function updateTask(db: Db, id: string, input: PanitiaTaskData) {
  await assertMember(db, input.memberId);
  const [row] = await db
    .update(panitiaTasks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(panitiaTasks.id, id))
    .returning();
  if (!row) throw taskNotFound();
  return toTask(row);
}

export async function setTaskDone(db: Db, id: string, done: boolean, memberId?: string) {
  const now = new Date();
  const [row] = await db
    .update(panitiaTasks)
    .set({ doneAt: done ? now : null, updatedAt: now })
    .where(and(eq(panitiaTasks.id, id), memberId ? eq(panitiaTasks.memberId, memberId) : undefined))
    .returning();
  if (!row) throw taskNotFound();
  return toTask(row);
}

export async function deleteTask(db: Db, id: string) {
  const [row] = await db
    .delete(panitiaTasks)
    .where(eq(panitiaTasks.id, id))
    .returning({ id: panitiaTasks.id });
  if (!row) throw taskNotFound();
}

// --- Tautan anggota (tanpa login) ------------------------------------------------------------------

export async function findMemberByToken(db: Db, token: string) {
  const [row] = await db.select().from(panitiaMembers).where(eq(panitiaMembers.token, token));
  return row ?? null;
}

export async function myTasks(db: Db, member: MemberRow): Promise<MyTasksResponse> {
  const [rows, settings] = await Promise.all([
    db
      .select()
      .from(panitiaTasks)
      .where(eq(panitiaTasks.memberId, member.id))
      .orderBy(...taskOrder),
    getSettings(db),
  ]);
  return {
    name: member.name,
    couple: coupleName(settings),
    tasks: rows.map(toTask).map(({ memberId: _member, ...task }) => task),
  };
}

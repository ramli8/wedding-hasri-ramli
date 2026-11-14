import type { MyTasksResponse, PanitiaMember, PanitiaTask } from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { type adminClient, createTestContext, loggedInClient, ORIGIN } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());
let api: ReturnType<typeof adminClient>;
let app: ReturnType<typeof ctx.makeApp>;
const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
  app = ctx.makeApp();
});

const publicGet = (token: string) => app.request(`/api/v1/public/tugas/${token}`);
const publicDone = (token: string, id: string, done: boolean) =>
  app.request(`/api/v1/public/tugas/${token}/tasks/${id}/done`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ done }),
  });

describe("tugas panitia", () => {
  it("anggota hanya melihat dan mencentang tugasnya sendiri lewat tautan", async () => {
    const darto = (
      await read<{ member: PanitiaMember }>(
        await api.post("/panitia/members", { name: "Pak Darto", phone: "0812-3456-7890" }),
      )
    ).member;
    expect(darto.phone).toBe("6281234567890");
    expect(darto.token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const sum = (
      await read<{ member: PanitiaMember }>(await api.post("/panitia/members", { name: "Bu Sum" }))
    ).member;

    const tenda = (
      await read<{ task: PanitiaTask }>(
        await api.post("/panitia/tasks", {
          title: "Pesan tenda",
          memberId: darto.id,
          dueOn: "2027-05-01",
        }),
      )
    ).task;
    const kursi = (
      await read<{ task: PanitiaTask }>(
        await api.post("/panitia/tasks", { title: "Sewa kursi", memberId: sum.id }),
      )
    ).task;

    const mine = await read<MyTasksResponse>(await publicGet(darto.token));
    expect(mine.name).toBe("Pak Darto");
    expect(mine.tasks.map((t) => t.title)).toEqual(["Pesan tenda"]);
    expect(JSON.stringify(mine)).not.toContain("6281234567890");

    expect((await publicDone(darto.token, tenda.id, true)).status).toBe(200);
    // Tugas orang lain tidak bisa dicentang.
    expect((await publicDone(darto.token, kursi.id, true)).status).toBe(404);

    const all = await read<{ tasks: PanitiaTask[] }>(await api.get("/panitia"));
    expect(all.tasks.find((t) => t.id === tenda.id)?.doneAt).not.toBeNull();
    expect(all.tasks.find((t) => t.id === kursi.id)?.doneAt).toBeNull();
    // Yang belum selesai lebih dulu.
    expect(all.tasks[0]?.id).toBe(kursi.id);
  });

  it("tautan lama tidak berlaku setelah diganti, dan tautan salah ditolak", async () => {
    const m = (
      await read<{ member: PanitiaMember }>(
        await api.post("/panitia/members", { name: "Mas Andi" }),
      )
    ).member;
    const renewed = (
      await read<{ member: PanitiaMember }>(await api.post(`/panitia/members/${m.id}/token`))
    ).member;
    expect(renewed.token).not.toBe(m.token);
    expect((await publicGet(m.token)).status).toBe(404);
    expect((await publicGet(renewed.token)).status).toBe(200);
    expect((await publicGet("pendek")).status).toBe(400);
  });

  it("hapus anggota mengosongkan penanggung jawab tugasnya", async () => {
    const m = (
      await read<{ member: PanitiaMember }>(
        await api.post("/panitia/members", { name: "Mbak Rina" }),
      )
    ).member;
    const t = (
      await read<{ task: PanitiaTask }>(
        await api.post("/panitia/tasks", { title: "Undangan", memberId: m.id }),
      )
    ).task;
    expect((await api.delete(`/panitia/members/${m.id}`)).status).toBe(200);
    const all = await read<{ tasks: PanitiaTask[] }>(await api.get("/panitia"));
    expect(all.tasks.find((x) => x.id === t.id)?.memberId).toBeNull();
    expect((await api.post("/panitia/tasks", { title: "X", memberId: m.id })).status).toBe(400);
  });
});

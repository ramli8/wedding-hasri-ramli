import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashToken, SESSION_TTL_MS } from "../src/auth/session.js";
import { adminSessions } from "../src/db/schema.js";
import { createTestContext, insertAdmin, login, PASSWORD, post, resetDb } from "./helpers.js";

const ctx = createTestContext();
const { db } = ctx;
let app = ctx.makeApp();

const LOGIN = "/api/v1/auth/login";
const ME = "/api/v1/auth/me";

const getMe = (cookie?: string) => app.request(ME, { headers: cookie ? { cookie } : {} });

beforeEach(async () => {
  app = ctx.makeApp();
  await resetDb(db);
  await insertAdmin(db);
});
afterAll(() => ctx.close());

describe("GET /api/health", () => {
  it("mengembalikan ok bila database terjangkau", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok" });
  });
});

describe("POST /api/v1/auth/login", () => {
  it("masuk dengan kredensial benar dan menyetel cookie HttpOnly", async () => {
    const { res, cookie } = await login(app);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      admin: { email: "ramli@example.com", name: "Ramli" },
    });
    expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/^session=/);
  });

  it("hanya menyimpan hash token dan sesi berlaku 30 hari", async () => {
    const { cookie } = await login(app);
    const token = cookie.split("=")[1] as string;
    const rows = await db.select().from(adminSessions);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toBe(hashToken(token));
    expect(rows[0]?.tokenHash).not.toBe(token);
    const ttl = (rows[0]?.expiresAt.getTime() ?? 0) - Date.now();
    expect(ttl).toBeGreaterThan(SESSION_TTL_MS - 60_000);
  });

  it("menormalkan email (huruf besar dan spasi)", async () => {
    const { res } = await login(app, "  RAMLI@Example.com ");
    expect(res.status).toBe(200);
  });

  it("menolak kata sandi salah dan email tak dikenal dengan jawaban yang sama", async () => {
    const wrongPassword = await login(app, "ramli@example.com", "salah-salah-salah");
    const unknownEmail = await login(app, "tidak-ada@example.com");
    expect(wrongPassword.res.status).toBe(401);
    expect(unknownEmail.res.status).toBe(401);
    expect(await wrongPassword.res.json()).toEqual(await unknownEmail.res.json());
  });

  it("memblokir email setelah 5 percobaan gagal, bahkan dengan kata sandi benar", async () => {
    for (let i = 0; i < 5; i++) await login(app, "ramli@example.com", "salah-salah-salah");
    const { res } = await login(app);
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: { code: "RATE_LIMITED" } });
  });

  it("menolak body tidak valid dengan VALIDATION_ERROR", async () => {
    const res = await post(app, LOGIN, { email: "bukan-email", password: "x" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
  });

  it("menolak Origin asing", async () => {
    const res = await post(
      app,
      LOGIN,
      { email: "ramli@example.com", password: PASSWORD },
      { origin: "https://jahat.example" },
    );
    expect(res.status).toBe(403);
  });

  it("menolak request tanpa header Origin", async () => {
    const res = await app.request(LOGIN, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "ramli@example.com", password: PASSWORD }),
    });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("menolak tanpa cookie", async () => {
    const res = await getMe();
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });

  it("menolak token yang tidak dikenal", async () => {
    expect((await getMe("session=token-ngawur")).status).toBe(401);
  });

  it("mengembalikan admin untuk sesi valid", async () => {
    const { cookie } = await login(app);
    const res = await getMe(cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ admin: { email: "ramli@example.com" } });
  });

  it("menolak sesi kedaluwarsa dan menghapusnya", async () => {
    const { cookie } = await login(app);
    await db.update(adminSessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await getMe(cookie)).status).toBe(401);
    expect(await db.select().from(adminSessions)).toHaveLength(0);
  });

  it("memperpanjang sesi yang sisa masa berlakunya kurang dari setengah TTL", async () => {
    const { cookie } = await login(app);
    await db.update(adminSessions).set({ expiresAt: new Date(Date.now() + 60_000) });
    const res = await getMe(cookie);
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/^session=/);
    const [row] = await db.select().from(adminSessions);
    expect((row?.expiresAt.getTime() ?? 0) - Date.now()).toBeGreaterThan(SESSION_TTL_MS - 60_000);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("menghapus sesi sehingga cookie lama tidak berlaku lagi", async () => {
    const { cookie } = await login(app);
    const res = await post(app, "/api/v1/auth/logout", {}, { cookie });
    expect(res.status).toBe(200);
    expect((await getMe(cookie)).status).toBe(401);
  });
});

describe("POST /api/v1/auth/change-password", () => {
  const CHANGE = "/api/v1/auth/change-password";
  const NEW_PASSWORD = "kata-sandi-baru-123";

  it("mengganti kata sandi dan mencabut sesi lain, sesi sekarang tetap hidup", async () => {
    const first = await login(app);
    const second = await login(app);

    const res = await post(
      app,
      CHANGE,
      { currentPassword: PASSWORD, newPassword: NEW_PASSWORD },
      { cookie: second.cookie },
    );
    expect(res.status).toBe(200);

    expect((await getMe(first.cookie)).status).toBe(401);
    expect((await getMe(second.cookie)).status).toBe(200);
    expect((await login(app, "ramli@example.com", PASSWORD)).res.status).toBe(401);
    expect((await login(app, "ramli@example.com", NEW_PASSWORD)).res.status).toBe(200);
  });

  it("menolak bila kata sandi saat ini salah", async () => {
    const { cookie } = await login(app);
    const res = await post(
      app,
      CHANGE,
      { currentPassword: "bukan-yang-benar", newPassword: NEW_PASSWORD },
      { cookie },
    );
    expect(res.status).toBe(400);
  });

  it("menolak kata sandi baru yang kurang dari 10 karakter", async () => {
    const { cookie } = await login(app);
    const res = await post(
      app,
      CHANGE,
      { currentPassword: PASSWORD, newPassword: "pendek" },
      { cookie },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
  });

  it("memerlukan login", async () => {
    const res = await post(app, CHANGE, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(401);
  });
});

describe("hapus admin", () => {
  it("menghapus sesinya (ON DELETE CASCADE)", async () => {
    const { cookie } = await login(app);
    await resetDb(db);
    expect((await getMe(cookie)).status).toBe(401);
    expect(await db.select().from(adminSessions)).toHaveLength(0);
  });
});

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  type Guest,
  VOICE_MAX_PER_GUEST,
  type VoiceMessage,
  type VoiceUploadResponse,
} from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  type adminClient,
  createTestContext,
  loggedInClient,
  login,
  TEST_MEDIA_DIR,
} from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());
let api: ReturnType<typeof adminClient>;
let app: ReturnType<typeof ctx.makeApp>;
const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
  app = ctx.makeApp();
});

/** Kepala WebM (EBML) + isi acak secukupnya. */
const webm = () => new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, ...new Array(200).fill(7)]);

function upload(code: string, bytes: Uint8Array<ArrayBuffer>, durationMs = 5_000) {
  const form = new FormData();
  form.set("code", code);
  form.set("durationMs", String(durationMs));
  form.set("audio", new File([bytes], "pesan.webm", { type: "audio/webm" }));
  return app.request("/api/v1/public/voice", { method: "POST", body: form });
}

describe("pesan suara", () => {
  it("tamu mengirim, admin memutar, menyembunyikan, dan menghapus", async () => {
    const { guest } = await read<{ guest: Guest }>(
      await api.post("/guests", { displayName: "Om Budi", phone: "081299990000" }),
    );
    const code = guest.code ?? "";

    expect((await upload("ZZZZZZ", webm())).status).toBe(404);
    expect((await upload(code, new Uint8Array(300).fill(1))).status).toBe(400);
    expect((await upload(code, webm(), 90_000)).status).toBe(400);

    const sent = await upload(code, webm());
    expect(sent.status).toBe(201);
    const { id, remaining } = await read<VoiceUploadResponse>(sent);
    expect(remaining).toBe(VOICE_MAX_PER_GUEST - 1);
    expect(existsSync(join(TEST_MEDIA_DIR, "voice", `${id}.webm`))).toBe(true);

    for (let i = 1; i < VOICE_MAX_PER_GUEST; i++) {
      expect((await upload(code, webm())).status).toBe(201);
    }
    expect((await upload(code, webm())).status).toBe(409);

    const { items } = await read<{ items: VoiceMessage[] }>(await api.get("/voice"));
    expect(items).toHaveLength(VOICE_MAX_PER_GUEST);
    expect(items[0]?.guestName).toBe("Om Budi");

    const audio = await api.get(`/voice/${id}/audio`);
    expect(audio.status).toBe(200);
    expect(audio.headers.get("content-type")).toBe("audio/webm");
    expect(new Uint8Array(await audio.arrayBuffer())[0]).toBe(0x1a);

    const hidden = await read<{ item: VoiceMessage }>(
      await api.post(`/voice/${id}/hide`, { hidden: true }),
    );
    expect(hidden.item.hidden).toBe(true);

    const zip = await api.get("/voice/export.zip");
    expect(zip.status).toBe(200);
    expect(zip.headers.get("content-type")).toBe("application/zip");

    expect((await api.delete(`/voice/${id}`)).status).toBe(200);
    expect(existsSync(join(TEST_MEDIA_DIR, "voice", `${id}.webm`))).toBe(false);
    // Tanpa login tidak bisa mendengarkan.
    expect((await app.request(`/api/v1/admin/voice/${items[1]?.id}/audio`)).status).toBe(401);
  });

  it("permintaan Range dijawab 206 (Safari)", async () => {
    const { guest } = await read<{ guest: Guest }>(
      await api.post("/guests", { displayName: "Bu Ani", phone: "081299990001" }),
    );
    const { id } = await read<VoiceUploadResponse>(await upload(guest.code ?? "", webm()));
    const { cookie } = await login(app);
    const res = await app.request(`/api/v1/admin/voice/${id}/audio`, {
      headers: { cookie, range: "bytes=0-1" },
    });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 0-1/204");
    expect((await res.arrayBuffer()).byteLength).toBe(2);
  });
});

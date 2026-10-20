import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { parseArgs } from "node:util";
import { loginRequestSchema, MIN_PASSWORD_LENGTH } from "@wedding/shared";
import { hashPassword } from "../auth/password.js";
import { loadConfig } from "../config.js";
import { createDb } from "../db/client.js";
import { admins } from "../db/schema.js";

async function promptHidden(question: string) {
  process.stdout.write(question);
  const output = new Writable({ write: (_chunk, _encoding, done) => done() });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  const answer = await rl.question("");
  rl.close();
  process.stdout.write("\n");
  return answer;
}

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" } },
});

if (!values.email || !values.name) {
  console.error('Pemakaian: pnpm --filter @wedding/api admin:create --email a@b.com --name "Nama"');
  process.exit(1);
}

const email = loginRequestSchema.shape.email.safeParse(values.email);
if (!email.success) {
  console.error("Email tidak valid");
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD ?? (await promptHidden("Kata sandi: "));
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter`);
  process.exit(1);
}

const config = loadConfig();
const { db, close } = createDb(config.databaseUrl);
try {
  await db
    .insert(admins)
    .values({ email: email.data, name: values.name, passwordHash: await hashPassword(password) });
  console.log(`Admin ${email.data} dibuat`);
} catch (err) {
  const code = (err as { code?: string }).code;
  console.error(code === "23505" ? "Email sudah terdaftar" : err);
  process.exitCode = 1;
} finally {
  await close();
}

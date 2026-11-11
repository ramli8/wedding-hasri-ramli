import { hash, verify } from "@node-rs/argon2";

// Argon2id dengan parameter minimum OWASP (m=19 MiB, t=2, p=1).
const options = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

/**
 * Setiap hitungan Argon2 memakai ±19 MiB. Tanpa batas, banjir permintaan login serentak (mis. dari
 * banyak IP sekaligus) bisa menghabiskan RAM VPS 2 GB. Kelebihan permintaan menunggu giliran.
 */
const MAX_CONCURRENT = 4;
let running = 0;
const waiting: (() => void)[] = [];

async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  running += 1;
  try {
    return await task();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

export function hashPassword(password: string) {
  return limited(() => hash(password, options));
}

let dummyHash: Promise<string> | undefined;

/**
 * Bila `passwordHash` null (email tidak terdaftar), tetap menghitung terhadap hash
 * palsu supaya waktu respons tidak membocorkan apakah email ada.
 */
export async function verifyPassword(passwordHash: string | null, password: string) {
  if (passwordHash === null) {
    dummyHash ??= hashPassword("dummy-password-for-timing");
    const dummy = await dummyHash;
    await limited(() => verify(dummy, password)).catch(() => false);
    return false;
  }
  try {
    return await limited(() => verify(passwordHash, password));
  } catch {
    return false;
  }
}

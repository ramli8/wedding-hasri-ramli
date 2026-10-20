import { hash, verify } from "@node-rs/argon2";

// Argon2id dengan parameter minimum OWASP (m=19 MiB, t=2, p=1).
const options = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string) {
  return hash(password, options);
}

let dummyHash: Promise<string> | undefined;

/**
 * Bila `passwordHash` null (email tidak terdaftar), tetap menghitung terhadap hash
 * palsu supaya waktu respons tidak membocorkan apakah email ada.
 */
export async function verifyPassword(passwordHash: string | null, password: string) {
  if (passwordHash === null) {
    dummyHash ??= hashPassword("dummy-password-for-timing");
    await verify(await dummyHash, password).catch(() => false);
    return false;
  }
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

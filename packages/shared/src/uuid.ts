/**
 * UUID v7 (RFC 9562): 48 bit waktu (ms) di depan, sisanya acak. Dipakai untuk ID yang dibuat di
 * perangkat (event check-in, tamu walk-in), sehingga urut menurut waktu dan aman dikirim ulang.
 */
export function uuid7(
  now: number = Date.now(),
  random: Uint8Array = crypto.getRandomValues(new Uint8Array(10)),
): string {
  const bytes = new Uint8Array(16);
  // 48 bit waktu, big-endian
  let time = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = 0x70 | ((random[0] ?? 0) & 0x0f); // versi 7
  bytes[7] = random[1] ?? 0;
  bytes[8] = 0x80 | ((random[2] ?? 0) & 0x3f); // varian RFC 4122
  for (let i = 0; i < 7; i++) bytes[9 + i] = random[3 + i] ?? 0;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

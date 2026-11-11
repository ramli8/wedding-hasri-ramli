/** Pembatas percobaan gagal (in-memory; cukup untuk satu proses API). */
export class FailureLimiter {
  private readonly failures = new Map<string, number[]>();

  constructor(
    private readonly options: { max: number; windowMs: number },
    private readonly now: () => number = Date.now,
  ) {}

  isBlocked(key: string) {
    return this.recent(key).length >= this.options.max;
  }

  recordFailure(key: string) {
    this.failures.set(key, [...this.recent(key), this.now()]);
    // Kunci yang tidak pernah ditanya lagi tidak terhapus oleh `recent`; bersihkan sesekali agar
    // memori tidak tumbuh terus selama berbulan-bulan.
    if (this.failures.size > 10_000) {
      for (const k of [...this.failures.keys()]) this.recent(k);
    }
  }

  reset(key: string) {
    this.failures.delete(key);
  }

  private recent(key: string) {
    const cutoff = this.now() - this.options.windowMs;
    const recent = (this.failures.get(key) ?? []).filter((at) => at > cutoff);
    if (recent.length === 0) this.failures.delete(key);
    else this.failures.set(key, recent);
    return recent;
  }
}

/**
 * Penghitung permintaan per kunci dalam jendela tetap (mis. 300 per menit per IP). Dipakai untuk
 * menahan banjir permintaan ke rute tanpa login; batas percobaan gagal ada di FailureLimiter.
 */
export class RequestCounter {
  private windowStart = 0;
  private counts = new Map<string, number>();

  constructor(
    private readonly options: { max: number; windowMs: number },
    private readonly now: () => number = Date.now,
  ) {}

  /** Mencatat satu permintaan; false bila kunci ini sudah melewati batas di jendela sekarang. */
  hit(key: string): boolean {
    const now = this.now();
    if (now - this.windowStart >= this.options.windowMs) {
      // Jendela baru: semua hitungan lama dibuang sekaligus, jadi memori tidak tumbuh.
      this.windowStart = now;
      this.counts.clear();
    }
    const count = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, count);
    return count <= this.options.max;
  }
}

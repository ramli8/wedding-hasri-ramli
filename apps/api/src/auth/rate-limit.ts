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

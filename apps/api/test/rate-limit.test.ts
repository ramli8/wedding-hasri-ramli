import { describe, expect, it } from "vitest";
import { FailureLimiter } from "../src/auth/rate-limit.js";

describe("FailureLimiter", () => {
  it("memblokir setelah batas percobaan gagal tercapai", () => {
    const limiter = new FailureLimiter({ max: 3, windowMs: 1000 });
    for (let i = 0; i < 2; i++) limiter.recordFailure("a");
    expect(limiter.isBlocked("a")).toBe(false);
    limiter.recordFailure("a");
    expect(limiter.isBlocked("a")).toBe(true);
    expect(limiter.isBlocked("b")).toBe(false);
  });

  it("melepas blokir setelah jendela waktu lewat", () => {
    let now = 0;
    const limiter = new FailureLimiter({ max: 2, windowMs: 1000 }, () => now);
    limiter.recordFailure("a");
    limiter.recordFailure("a");
    expect(limiter.isBlocked("a")).toBe(true);
    now = 1001;
    expect(limiter.isBlocked("a")).toBe(false);
  });

  it("reset menghapus catatan gagal", () => {
    const limiter = new FailureLimiter({ max: 1, windowMs: 1000 });
    limiter.recordFailure("a");
    limiter.reset("a");
    expect(limiter.isBlocked("a")).toBe(false);
  });
});

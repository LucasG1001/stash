import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cacheGet, cacheSet, cacheClear } from "./cache.js";

describe("cache", () => {
  beforeEach(() => {
    cacheClear();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => vi.useRealTimers());

  it("returns stored value before TTL", () => {
    cacheSet("k", 42, 1000);
    expect(cacheGet<number>("k")).toBe(42);
  });

  it("expires after TTL", () => {
    cacheSet("k", 42, 1000);
    vi.setSystemTime(1001);
    expect(cacheGet("k")).toBeUndefined();
  });

  it("clear wipes the store", () => {
    cacheSet("k", 1, 1000);
    cacheClear();
    expect(cacheGet("k")).toBeUndefined();
  });
});

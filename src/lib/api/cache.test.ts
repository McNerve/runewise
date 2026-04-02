import { describe, expect, it, beforeEach } from "vitest";
import { getCached, getStaleCached, setCache } from "./cache";

describe("api cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns persisted values when requested", () => {
    setCache("persisted-test", { value: 42 }, { persist: true });
    expect(getCached("persisted-test", 60_000, { persist: true })).toEqual({
      value: 42,
    });
  });

  it("can fall back to stale cached data", () => {
    setCache("stale-test", { value: 99 }, { persist: true });
    expect(getStaleCached("stale-test", { persist: true })).toEqual({
      value: 99,
    });
  });
});

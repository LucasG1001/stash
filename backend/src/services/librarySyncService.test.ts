import { describe, it, expect } from "vitest";
import { lastAiredEpisode } from "./librarySyncService.js";

describe("lastAiredEpisode", () => {
  it("returns the previous episode while releasing", () => {
    expect(lastAiredEpisode("RELEASING", { episode: 6, airingAt: 0 }, 12)).toBe(5);
  });

  it("returns total episodes when finished without next airing", () => {
    expect(lastAiredEpisode("FINISHED", null, 12)).toBe(12);
  });

  it("returns 0 when finished but total is unknown", () => {
    expect(lastAiredEpisode("FINISHED", null, null)).toBe(0);
  });

  it("returns 0 for not yet released", () => {
    expect(lastAiredEpisode("NOT_YET_RELEASED", null, 12)).toBe(0);
  });

  it("detects a new episode when next airing increases", () => {
    const before = lastAiredEpisode("RELEASING", { episode: 6, airingAt: 0 }, 12);
    const after = lastAiredEpisode("RELEASING", { episode: 7, airingAt: 0 }, 12);
    expect(after).toBeGreaterThan(before);
  });

  it("detects the final episode when releasing transitions to finished", () => {
    const before = lastAiredEpisode("RELEASING", { episode: 12, airingAt: 0 }, 12);
    const after = lastAiredEpisode("FINISHED", null, 12);
    expect(after).toBeGreaterThan(before);
  });
});

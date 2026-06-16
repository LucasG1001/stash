import { describe, it, expect, vi, beforeEach } from "vitest";
import { lastAiredEpisode, detectAndNotify } from "./librarySyncService.js";
import { notifyNewEpisode, notifyAnimeFinished } from "./notifyService.js";
import type { LibraryEntry } from "../types/library.js";
import type { AnimeCard } from "../types/anime.js";

vi.mock("./notifyService.js", () => ({
  notifyNewEpisode: vi.fn(),
  notifyAnimeFinished: vi.fn(),
}));

function makeEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    id: "1",
    anilistId: 100,
    title: "Test",
    coverImage: null,
    status: "watching",
    score: 0,
    totalEpisodes: 12,
    animeStatus: "RELEASING",
    nextAiringEpisode: { episode: 6, airingAt: 0 },
    streamingLinks: [],
    syncedAt: "2026-01-01T00:00:00Z",
    watchedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeAnime(overrides: Partial<AnimeCard> = {}): AnimeCard {
  return {
    id: 100,
    title: "Test",
    coverImage: "",
    status: "RELEASING",
    episodes: 12,
    averageScore: null,
    season: null,
    seasonYear: null,
    genres: [],
    nextAiringEpisode: { episode: 6, airingAt: 0 },
    streamingLinks: [],
    ...overrides,
  };
}

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

describe("detectAndNotify", () => {
  beforeEach(() => {
    vi.mocked(notifyNewEpisode).mockClear();
    vi.mocked(notifyAnimeFinished).mockClear();
  });

  it("notifies a new episode while still releasing", () => {
    const old = makeEntry({ nextAiringEpisode: { episode: 6, airingAt: 0 } });
    const anime = makeAnime({ nextAiringEpisode: { episode: 7, airingAt: 0 } });

    detectAndNotify(old, anime);

    expect(notifyNewEpisode).toHaveBeenCalledWith(old, 6, 12);
    expect(notifyAnimeFinished).not.toHaveBeenCalled();
  });

  it("notifies only the finish when releasing transitions to finished", () => {
    const old = makeEntry({ animeStatus: "RELEASING", nextAiringEpisode: { episode: 12, airingAt: 0 } });
    const anime = makeAnime({ status: "FINISHED", nextAiringEpisode: null, episodes: 12 });

    detectAndNotify(old, anime);

    expect(notifyAnimeFinished).toHaveBeenCalledWith(old, 12);
    expect(notifyNewEpisode).not.toHaveBeenCalled();
  });

  it("passes the fresh total episode count to the new-episode notification", () => {
    const old = makeEntry({ totalEpisodes: null, nextAiringEpisode: { episode: 3, airingAt: 0 } });
    const anime = makeAnime({ episodes: 24, nextAiringEpisode: { episode: 4, airingAt: 0 } });

    detectAndNotify(old, anime);

    expect(notifyNewEpisode).toHaveBeenCalledWith(old, 3, 24);
  });

  it("does not notify when nothing changed", () => {
    const old = makeEntry({ nextAiringEpisode: { episode: 6, airingAt: 0 } });
    const anime = makeAnime({ nextAiringEpisode: { episode: 6, airingAt: 0 } });

    detectAndNotify(old, anime);

    expect(notifyNewEpisode).not.toHaveBeenCalled();
    expect(notifyAnimeFinished).not.toHaveBeenCalled();
  });
});

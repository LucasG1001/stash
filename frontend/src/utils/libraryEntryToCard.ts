import type { AnimeCard } from "../types/anime";
import type { LibraryEntry } from "../types/library";

export function libraryEntryToCard(entry: LibraryEntry): AnimeCard {
  return {
    id: entry.anilistId,
    title: entry.title,
    coverImage: entry.coverImage ?? "",
    status: entry.animeStatus || "FINISHED",
    episodes: entry.totalEpisodes,
    averageScore: null,
    season: null,
    seasonYear: entry.seasonYear,
    genres: [],
    nextAiringEpisode: entry.nextAiringEpisode,
    streamingLinks: entry.streamingLinks,
  };
}

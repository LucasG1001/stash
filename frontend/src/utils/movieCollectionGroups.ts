import { compareByScore, type ScoreSortDir } from "./librarySort";
import type { MovieLibraryEntry } from "../types/movieLibrary";

export interface MovieGroup {
  key: string;
  representative: MovieLibraryEntry;
  members: MovieLibraryEntry[];
  count: number;
}

function releaseTime(entry: MovieLibraryEntry): number {
  return entry.releaseDate ? new Date(entry.releaseDate).getTime() : Number.POSITIVE_INFINITY;
}

function byChronology(a: MovieLibraryEntry, b: MovieLibraryEntry): number {
  const ta = releaseTime(a);
  const tb = releaseTime(b);
  if (ta !== tb) return ta - tb;
  return a.tmdbId - b.tmdbId;
}

export function buildMovieCollectionGroups(
  entries: MovieLibraryEntry[],
  scoreSortDir: ScoreSortDir,
  releaseSortDir: "desc" | "asc"
): MovieGroup[] {
  const map = new Map<string, MovieLibraryEntry[]>();
  for (const entry of entries) {
    const key = entry.collectionId != null ? `collection-${entry.collectionId}` : `single-${entry.tmdbId}`;
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  }

  const groups: MovieGroup[] = [];
  map.forEach((members, key) => {
    const ordered = [...members].sort(byChronology);
    groups.push({ key, representative: ordered[0], members: ordered, count: ordered.length });
  });

  if (scoreSortDir !== "off") {
    const groupScore = (g: MovieGroup) => g.members.reduce((max, m) => Math.max(max, m.score), 0);
    return groups.sort((a, b) => compareByScore({ score: groupScore(a) }, { score: groupScore(b) }, scoreSortDir));
  }

  return groups.sort((a, b) => {
    const diff = releaseTime(a.representative) - releaseTime(b.representative);
    return releaseSortDir === "desc" ? -diff : diff;
  });
}

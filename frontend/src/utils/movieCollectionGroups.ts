import { compareByScore, type ScoreSortDir } from "./librarySort";
import type { MovieLibraryEntry } from "../types/movieLibrary";

export interface MovieGroup {
  key: string;
  representative: MovieLibraryEntry;
  members: MovieLibraryEntry[];
  count: number;
  completedCount: number;
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

function pickRepresentative(ordered: MovieLibraryEntry[]): MovieLibraryEntry {
  return ordered.find((m) => m.isCover) ?? ordered[0];
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
    const completedCount = ordered.filter((m) => m.status === "watched").length;
    const representative = pickRepresentative(ordered);
    groups.push({ key, representative, members: [...ordered].reverse(), count: ordered.length, completedCount });
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

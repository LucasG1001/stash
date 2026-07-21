import { buildCollectionGroups, sortGroupsByScore, type CollectionGroup } from "./buildCollectionGroups";
import { type ScoreSortDir } from "./librarySort";
import type { MovieLibraryEntry } from "../types/movieLibrary";

export type MovieGroup = CollectionGroup<MovieLibraryEntry>;

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
  const groups = buildCollectionGroups(entries, {
    getKey: (e) => (e.collectionId != null ? `collection-${e.collectionId}` : `single-${e.tmdbId}`),
    compareMembers: byChronology,
    isCompleted: (m) => m.status === "watched",
  });

  if (scoreSortDir !== "off") return sortGroupsByScore(groups, scoreSortDir);

  return groups.sort((a, b) => {
    const diff = releaseTime(a.representative) - releaseTime(b.representative);
    return releaseSortDir === "desc" ? -diff : diff;
  });
}

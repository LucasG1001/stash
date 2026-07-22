import { buildCollectionGroups, type CollectionGroup } from "./buildCollectionGroups";
import type { MovieLibraryEntry } from "../types/movieLibrary";

export type MovieGroup = CollectionGroup<MovieLibraryEntry>;

export function releaseTimeOf(entry: MovieLibraryEntry): number {
  return entry.releaseDate ? new Date(entry.releaseDate).getTime() : Number.POSITIVE_INFINITY;
}

function byChronology(a: MovieLibraryEntry, b: MovieLibraryEntry): number {
  const ta = releaseTimeOf(a);
  const tb = releaseTimeOf(b);
  if (ta !== tb) return ta - tb;
  return a.tmdbId - b.tmdbId;
}

export function buildMovieCollectionGroups(
  entries: MovieLibraryEntry[],
  memberFilter?: (entry: MovieLibraryEntry) => boolean
): MovieGroup[] {
  return buildCollectionGroups(entries, {
    getKey: (e) => (e.collectionId != null ? `collection-${e.collectionId}` : `single-${e.tmdbId}`),
    compareMembers: byChronology,
    isCompleted: (m) => m.status === "watched",
    memberFilter,
  });
}

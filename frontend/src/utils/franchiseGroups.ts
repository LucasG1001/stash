import { buildCollectionGroups, type CollectionGroup } from "./buildCollectionGroups";
import type { LibraryEntry } from "../types/library";

export type FranchiseGroup = CollectionGroup<LibraryEntry>;

export function seasonYearOf(entry: LibraryEntry): number {
  return entry.seasonYear ?? Number.POSITIVE_INFINITY;
}

function byChronology(a: LibraryEntry, b: LibraryEntry): number {
  const ya = seasonYearOf(a);
  const yb = seasonYearOf(b);
  if (ya !== yb) return ya - yb;
  return a.anilistId - b.anilistId;
}

export function buildFranchiseGroups(
  entries: LibraryEntry[],
  memberFilter?: (entry: LibraryEntry) => boolean
): FranchiseGroup[] {
  return buildCollectionGroups(entries, {
    getKey: (e) => (e.franchiseId != null ? `franchise-${e.franchiseId}` : `single-${e.anilistId}`),
    compareMembers: byChronology,
    memberFilter,
  });
}

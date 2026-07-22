import { buildCollectionGroups, sortGroupsByScore, type CollectionGroup } from "./buildCollectionGroups";
import type { ScoreSortDir } from "./librarySort";
import type { LibraryEntry } from "../types/library";

export type FranchiseGroup = CollectionGroup<LibraryEntry>;

function byChronology(a: LibraryEntry, b: LibraryEntry): number {
  const ya = a.seasonYear ?? Number.POSITIVE_INFINITY;
  const yb = b.seasonYear ?? Number.POSITIVE_INFINITY;
  if (ya !== yb) return ya - yb;
  return a.anilistId - b.anilistId;
}

export function buildFranchiseGroups(
  entries: LibraryEntry[],
  releaseSortDir: "desc" | "asc",
  scoreSortDir: ScoreSortDir = "off"
): FranchiseGroup[] {
  const groups = buildCollectionGroups(entries, {
    getKey: (e) => (e.franchiseId != null ? `franchise-${e.franchiseId}` : `single-${e.anilistId}`),
    compareMembers: byChronology,
    isCompleted: (m) => m.status === "watched",
  });

  if (scoreSortDir !== "off") return sortGroupsByScore(groups, scoreSortDir);

  return groups.sort((a, b) => {
    const diff = (a.representative.seasonYear ?? 0) - (b.representative.seasonYear ?? 0);
    return releaseSortDir === "desc" ? -diff : diff;
  });
}

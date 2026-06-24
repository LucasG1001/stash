import { compareByScore, type ScoreSortDir } from "./librarySort";
import type { LibraryEntry } from "../types/library";

export interface FranchiseGroup {
  key: string;
  representative: LibraryEntry;
  members: LibraryEntry[];
  count: number;
  completedCount: number;
}

function byChronology(a: LibraryEntry, b: LibraryEntry): number {
  const ya = a.seasonYear ?? Number.POSITIVE_INFINITY;
  const yb = b.seasonYear ?? Number.POSITIVE_INFINITY;
  if (ya !== yb) return ya - yb;
  return a.anilistId - b.anilistId;
}

function pickRepresentative(ordered: LibraryEntry[]): LibraryEntry {
  let best = ordered[0];
  for (const entry of ordered) {
    if (entry.score > best.score) best = entry;
  }
  return best;
}

export function buildFranchiseGroups(
  entries: LibraryEntry[],
  scoreSortDir: ScoreSortDir,
  releaseSortDir: "desc" | "asc"
): FranchiseGroup[] {
  const map = new Map<string, LibraryEntry[]>();
  for (const entry of entries) {
    const key = entry.franchiseId != null ? `franchise-${entry.franchiseId}` : `single-${entry.anilistId}`;
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  }

  const groups: FranchiseGroup[] = [];
  map.forEach((members, key) => {
    const ordered = [...members].sort(byChronology);
    const completedCount = ordered.filter((m) => m.status === "watched").length;
    groups.push({ key, representative: pickRepresentative(ordered), members: [...ordered].reverse(), count: ordered.length, completedCount });
  });

  if (scoreSortDir !== "off") {
    const groupScore = (g: FranchiseGroup) => g.members.reduce((max, m) => Math.max(max, m.score), 0);
    return groups.sort((a, b) => compareByScore({ score: groupScore(a) }, { score: groupScore(b) }, scoreSortDir));
  }

  return groups.sort((a, b) => {
    const diff = (a.representative.seasonYear ?? 0) - (b.representative.seasonYear ?? 0);
    return releaseSortDir === "desc" ? -diff : diff;
  });
}

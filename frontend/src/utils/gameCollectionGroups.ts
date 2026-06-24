import { compareByScore, type ScoreSortDir } from "./librarySort";
import type { GameLibraryEntry } from "../types/gameLibrary";

export interface GameGroup {
  key: string;
  representative: GameLibraryEntry;
  members: GameLibraryEntry[];
  count: number;
  completedCount: number;
}

function releaseTime(entry: GameLibraryEntry): number {
  return entry.released ? new Date(entry.released).getTime() : Number.POSITIVE_INFINITY;
}

function byChronology(a: GameLibraryEntry, b: GameLibraryEntry): number {
  const ta = releaseTime(a);
  const tb = releaseTime(b);
  if (ta !== tb) return ta - tb;
  return a.igdbId - b.igdbId;
}

function pickRepresentative(ordered: GameLibraryEntry[]): GameLibraryEntry {
  return ordered.find((m) => m.isCover) ?? ordered[0];
}

export function buildGameCollectionGroups(
  entries: GameLibraryEntry[],
  scoreSortDir: ScoreSortDir,
  releaseSortDir: "desc" | "asc"
): GameGroup[] {
  const map = new Map<string, GameLibraryEntry[]>();
  for (const entry of entries) {
    const key = entry.collectionId != null ? `collection-${entry.collectionId}` : `single-${entry.igdbId}`;
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  }

  const groups: GameGroup[] = [];
  map.forEach((members, key) => {
    const ordered = [...members].sort(byChronology);
    const completedCount = ordered.filter((m) => m.status === "beaten").length;
    const representative = pickRepresentative(ordered);
    groups.push({ key, representative, members: [...ordered].reverse(), count: ordered.length, completedCount });
  });

  if (scoreSortDir !== "off") {
    const groupScore = (g: GameGroup) => g.members.reduce((max, m) => Math.max(max, m.score), 0);
    return groups.sort((a, b) => compareByScore({ score: groupScore(a) }, { score: groupScore(b) }, scoreSortDir));
  }

  return groups.sort((a, b) => {
    const diff = releaseTime(a.representative) - releaseTime(b.representative);
    return releaseSortDir === "desc" ? -diff : diff;
  });
}

import { buildCollectionGroups, sortGroupsByScore, type CollectionGroup } from "./buildCollectionGroups";
import { type ScoreSortDir } from "./librarySort";
import type { GameLibraryEntry } from "../types/gameLibrary";

export type GameGroup = CollectionGroup<GameLibraryEntry>;

function releaseTime(entry: GameLibraryEntry): number {
  return entry.released ? new Date(entry.released).getTime() : Number.POSITIVE_INFINITY;
}

function byChronology(a: GameLibraryEntry, b: GameLibraryEntry): number {
  const ta = releaseTime(a);
  const tb = releaseTime(b);
  if (ta !== tb) return ta - tb;
  return a.igdbId - b.igdbId;
}

export function buildGameCollectionGroups(
  entries: GameLibraryEntry[],
  scoreSortDir: ScoreSortDir,
  releaseSortDir: "desc" | "asc"
): GameGroup[] {
  const groups = buildCollectionGroups(entries, {
    getKey: (e) => (e.collectionId != null ? `collection-${e.collectionId}` : `single-${e.igdbId}`),
    compareMembers: byChronology,
    isCompleted: (m) => m.status === "beaten",
  });

  if (scoreSortDir !== "off") return sortGroupsByScore(groups, scoreSortDir);

  return groups.sort((a, b) => {
    const diff = releaseTime(a.representative) - releaseTime(b.representative);
    return releaseSortDir === "desc" ? -diff : diff;
  });
}

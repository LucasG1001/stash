import { buildCollectionGroups, type CollectionGroup } from "./buildCollectionGroups";
import type { GameLibraryEntry } from "../types/gameLibrary";

export type GameGroup = CollectionGroup<GameLibraryEntry>;

export function releaseTimeOf(entry: GameLibraryEntry): number {
  return entry.released ? new Date(entry.released).getTime() : Number.POSITIVE_INFINITY;
}

function byChronology(a: GameLibraryEntry, b: GameLibraryEntry): number {
  const ta = releaseTimeOf(a);
  const tb = releaseTimeOf(b);
  if (ta !== tb) return ta - tb;
  return a.igdbId - b.igdbId;
}

export function buildGameCollectionGroups(
  entries: GameLibraryEntry[],
  memberFilter?: (entry: GameLibraryEntry) => boolean
): GameGroup[] {
  return buildCollectionGroups(entries, {
    getKey: (e) => (e.collectionId != null ? `collection-${e.collectionId}` : `single-${e.igdbId}`),
    compareMembers: byChronology,
    isCompleted: (m) => m.status === "beaten",
    memberFilter,
  });
}

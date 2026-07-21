import { compareByScore, type ScoreSortDir } from "./librarySort";

export interface CollectionGroup<T> {
  key: string;
  representative: T;
  members: T[];
  count: number;
  completedCount: number;
}

export interface BuildGroupsConfig<T> {
  getKey: (entry: T) => string;
  compareMembers: (a: T, b: T) => number;
  isCompleted: (entry: T) => boolean;
  reverseMembers?: boolean;
}

export function pickRepresentative<T extends { isCover?: boolean }>(ordered: T[]): T {
  return ordered.find((m) => m.isCover) ?? ordered[0];
}

export function buildCollectionGroups<T extends { isCover?: boolean }>(
  entries: T[],
  config: BuildGroupsConfig<T>
): CollectionGroup<T>[] {
  const { getKey, compareMembers, isCompleted, reverseMembers = true } = config;

  const map = new Map<string, T[]>();
  for (const entry of entries) {
    const key = getKey(entry);
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  }

  const groups: CollectionGroup<T>[] = [];
  map.forEach((members, key) => {
    const ordered = [...members].sort(compareMembers);
    const completedCount = ordered.filter(isCompleted).length;
    groups.push({
      key,
      representative: pickRepresentative(ordered),
      members: reverseMembers ? [...ordered].reverse() : ordered,
      count: ordered.length,
      completedCount,
    });
  });

  return groups;
}

export function sortGroupsByScore<T extends { score: number }>(
  groups: CollectionGroup<T>[],
  scoreSortDir: Exclude<ScoreSortDir, "off">
): CollectionGroup<T>[] {
  const groupScore = (g: CollectionGroup<T>) => g.members.reduce((max, m) => Math.max(max, m.score), 0);
  return groups.sort((a, b) => compareByScore({ score: groupScore(a) }, { score: groupScore(b) }, scoreSortDir));
}

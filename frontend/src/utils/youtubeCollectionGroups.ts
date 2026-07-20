import type { YoutubeLibraryEntry, YoutubeOrder } from "../types/youtubeLibrary";

export interface YoutubeGroup {
  key: string;
  representative: YoutubeLibraryEntry;
  members: YoutubeLibraryEntry[];
  count: number;
  completedCount: number;
}

function addedTime(entry: YoutubeLibraryEntry): number {
  return entry.createdAt ? new Date(entry.createdAt).getTime() : 0;
}

function publishedTime(entry: YoutubeLibraryEntry): number {
  return entry.publishedAt ? new Date(entry.publishedAt).getTime() : 0;
}

function byPublishedAsc(a: YoutubeLibraryEntry, b: YoutubeLibraryEntry): number {
  const diff = publishedTime(a) - publishedTime(b);
  return diff !== 0 ? diff : a.videoId.localeCompare(b.videoId);
}

function pickRepresentative(ordered: YoutubeLibraryEntry[]): YoutubeLibraryEntry {
  return ordered.find((m) => m.isCover) ?? ordered[0];
}

export function buildYoutubeCollectionGroups(
  entries: YoutubeLibraryEntry[],
  order: YoutubeOrder
): YoutubeGroup[] {
  const map = new Map<string, YoutubeLibraryEntry[]>();
  for (const entry of entries) {
    const key = entry.collectionId != null ? `collection-${entry.collectionId}` : `single-${entry.videoId}`;
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  }

  const groups: YoutubeGroup[] = [];
  map.forEach((members, key) => {
    const ordered = [...members].sort(byPublishedAsc);
    const completedCount = ordered.filter((m) => m.status === "liked").length;
    const representative = pickRepresentative(ordered);
    groups.push({ key, representative, members: [...ordered].reverse(), count: ordered.length, completedCount });
  });

  const groupViews = (g: YoutubeGroup) => g.members.reduce((max, m) => Math.max(max, m.viewCount ?? 0), 0);

  return groups.sort((a, b) => {
    switch (order) {
      case "views":
        return groupViews(b) - groupViews(a);
      case "published":
        return publishedTime(b.representative) - publishedTime(a.representative);
      case "added":
      default:
        return addedTime(b.representative) - addedTime(a.representative);
    }
  });
}

import type { YoutubeLibraryEntry, YoutubeLibraryStatus } from "../types/youtubeLibrary";

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

export function buildYoutubeCollectionGroups(entries: YoutubeLibraryEntry[]): YoutubeGroup[] {
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

  const isCollection = (g: YoutubeGroup) => g.representative.collectionId != null;

  // Coleções primeiro; avulsos depois (mais recentes primeiro). A ordenação
  // alfabética das coleções (por nome) é aplicada na página, que conhece os nomes.
  return groups.sort((a, b) => {
    const collDiff = Number(isCollection(b)) - Number(isCollection(a));
    return collDiff !== 0 ? collDiff : addedTime(b.representative) - addedTime(a.representative);
  });
}

export function applyStatusView(groups: YoutubeGroup[], status: YoutubeLibraryStatus): YoutubeGroup[] {
  const result: YoutubeGroup[] = [];
  for (const g of groups) {
    const isCollection = g.representative.collectionId != null;

    if (status === "removed") {
      // Coleção com ao menos um removido aparece inteira; avulso só se for removido.
      if (isCollection) {
        if (g.members.some((m) => m.status === "removed")) result.push(g);
      } else if (g.representative.status === "removed") {
        result.push(g);
      }
      continue;
    }

    // status === "liked": esconder membros removidos das coleções.
    if (isCollection) {
      const liked = g.members.filter((m) => m.status === "liked");
      if (liked.length === 0) continue;
      const ordered = [...liked].sort(byPublishedAsc);
      const representative = pickRepresentative(ordered);
      result.push({
        key: g.key,
        representative,
        members: [...ordered].reverse(),
        count: ordered.length,
        completedCount: ordered.length,
      });
    } else if (g.representative.status === "liked") {
      result.push(g);
    }
  }
  return result;
}

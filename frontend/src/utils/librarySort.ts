export type ScoreSortDir = "off" | "desc" | "asc";

export function nextScoreSortDir(dir: ScoreSortDir): ScoreSortDir {
  return dir === "off" ? "desc" : dir === "desc" ? "asc" : "off";
}

export function compareByScore<T extends { score: number }>(
  a: T,
  b: T,
  dir: "desc" | "asc"
): number {
  const aHas = a.score > 0;
  const bHas = b.score > 0;
  if (aHas !== bHas) return aHas ? -1 : 1;
  const diff = a.score - b.score;
  return dir === "desc" ? -diff : diff;
}

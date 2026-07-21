export function filterGroupsByAiringStatus<T extends { members: { animeStatus?: string }[] }>(
  groups: T[],
  filter: string
): T[] {
  if (filter === "all") return groups;
  return groups.filter((g) => g.members.some((m) => m.animeStatus === filter));
}

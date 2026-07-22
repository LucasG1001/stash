export function filterGroupsByAiringStatus<T extends { members: { animeStatus?: string }[] }>(
  groups: T[],
  filter: string | string[]
): T[] {
  const filters = Array.isArray(filter) ? filter : [filter];
  if (filters.length === 0 || (filters.length === 1 && filters[0] === "all")) return groups;
  return groups.filter((g) =>
    g.members.some((m) => m.animeStatus != null && filters.includes(m.animeStatus))
  );
}

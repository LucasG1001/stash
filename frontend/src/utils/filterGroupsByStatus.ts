export function filterGroupsByStatus<T extends { members: { status: string }[] }>(
  groups: T[],
  filter: string | string[],
  matchesExtra?: (member: T["members"][number], filter: string) => boolean
): T[] {
  const filters = Array.isArray(filter) ? filter : [filter];
  if (filters.length === 0 || (filters.length === 1 && filters[0] === "all")) {
    return groups.filter((g) => g.members.some((m) => m.status !== "dropped"));
  }
  return groups.filter((g) =>
    g.members.some((m) => filters.some((f) => m.status === f || (matchesExtra?.(m, f) ?? false)))
  );
}

export function filterGroupsByStatus<T extends { members: { status: string }[] }>(
  groups: T[],
  filter: string,
  matchesExtra?: (member: T["members"][number], filter: string) => boolean
): T[] {
  if (filter === "all") {
    return groups.filter((g) => g.members.some((m) => m.status !== "dropped"));
  }
  return groups.filter((g) =>
    g.members.some((m) => m.status === filter || (matchesExtra?.(m, filter) ?? false))
  );
}

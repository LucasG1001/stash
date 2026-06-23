export function filterGroupsByStatus<T extends { members: { status: string }[] }>(
  groups: T[],
  filter: string
): T[] {
  return filter === "all"
    ? groups.filter((g) => g.members.some((m) => m.status !== "dropped"))
    : groups.filter((g) => g.members.some((m) => m.status === filter));
}

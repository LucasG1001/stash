export function filterGroupsBySearch<T extends { members: { title: string }[] }>(
  groups: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups.filter((g) => g.members.some((m) => m.title.toLowerCase().includes(q)));
}

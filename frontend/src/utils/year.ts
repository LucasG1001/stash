export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getRecentYears(count = 26): number[] {
  const current = getCurrentYear();
  return Array.from({ length: count }, (_, i) => current - i);
}

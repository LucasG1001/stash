function short(value: number, divisor: number, suffix: string): string {
  const scaled = value / divisor;
  const text = scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, "");
  return `${text.replace(".", ",")} ${suffix}`;
}

export function formatViews(count: number | null | undefined): string {
  if (count == null || count < 0) return "—";
  if (count < 1000) return `${count} views`;
  if (count < 1_000_000) return `${short(count, 1000, "mil")} views`;
  if (count < 1_000_000_000) return `${short(count, 1_000_000, "mi")} views`;
  return `${short(count, 1_000_000_000, "bi")} views`;
}

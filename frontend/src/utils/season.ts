export const SEASONS_ORDER = ["WINTER", "SPRING", "SUMMER", "FALL"];

export const SEASON_PT: Record<string, string> = {
  WINTER: "Inverno",
  SPRING: "Primavera",
  SUMMER: "Verão",
  FALL: "Outono",
};

export function getCurrentRealSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 1 && month <= 3) return { season: "WINTER", year };
  if (month >= 4 && month <= 6) return { season: "SPRING", year };
  if (month >= 7 && month <= 9) return { season: "SUMMER", year };
  return { season: "FALL", year };
}

export function getSurroundingSeasons(season: string, year: number) {
  const idx = SEASONS_ORDER.indexOf(season);

  const prevIdx = (idx - 1 + 4) % 4;
  const prevYear = idx === 0 ? year - 1 : year;

  const nextIdx = (idx + 1) % 4;
  const nextYear = idx === 3 ? year + 1 : year;

  return [
    { season: SEASONS_ORDER[prevIdx], year: prevYear },
    { season, year },
    { season: SEASONS_ORDER[nextIdx], year: nextYear },
  ];
}

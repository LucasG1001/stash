export const MONTH_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function getCurrentMonth(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getLast12Months(): { month: number; year: number }[] {
  const { month, year } = getCurrentMonth();
  return Array.from({ length: 12 }, (_, i) => {
    const offset = month - 1 - i;
    const m = ((offset % 12) + 12) % 12;
    const y = year + Math.floor(offset / 12);
    return { month: m + 1, year: y };
  });
}

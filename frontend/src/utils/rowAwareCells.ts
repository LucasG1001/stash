import type { ReactNode } from "react";

export interface RowAwareItem {
  card: ReactNode;
  expansion: ReactNode | null;
}

export function arrangeRowAwareCells(items: RowAwareItem[], cols: number): ReactNode[] {
  const cells: ReactNode[] = [];
  let col = 0;
  let pending: ReactNode[] = [];

  for (const item of items) {
    cells.push(item.card);
    if (item.expansion) pending.push(item.expansion);
    col++;
    if (col >= cols) {
      cells.push(...pending);
      pending = [];
      col = 0;
    }
  }

  cells.push(...pending);
  return cells;
}

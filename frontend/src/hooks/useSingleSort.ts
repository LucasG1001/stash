import { useCallback, useState } from "react";

export type SortDir = "desc" | "asc";

// Ordenação de seleção única: sempre exatamente um critério ativo. Selecionar o
// critério já ativo alterna a direção; selecionar outro troca o critério (desc).
export function useSingleSort(defaultField: string, defaultDir: SortDir = "desc") {
  const [state, setState] = useState<{ field: string; dir: SortDir }>({
    field: defaultField,
    dir: defaultDir,
  });

  const select = useCallback((next: string) => {
    setState((s) =>
      s.field === next
        ? { field: s.field, dir: s.dir === "desc" ? "asc" : "desc" }
        : { field: next, dir: "desc" }
    );
  }, []);

  return { field: state.field, dir: state.dir, select };
}

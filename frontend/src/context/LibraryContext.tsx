import { useState, useCallback, type ReactNode } from "react";
import { LibraryContext, EMPTY_SLICE, type Store, type Slice } from "./libraryStore";

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>({});
  const setSlice = useCallback((media: string, updater: (prev: Slice) => Slice) => {
    setStore((prev) => ({ ...prev, [media]: updater(prev[media] ?? EMPTY_SLICE) }));
  }, []);
  return <LibraryContext.Provider value={{ store, setSlice }}>{children}</LibraryContext.Provider>;
}

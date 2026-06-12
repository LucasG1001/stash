import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { LibraryProvider } from "./LibraryContext";
import { useLibraryStore, type LibraryService } from "./libraryStore";

interface Entry {
  id: string;
  extId: number;
}
interface Create {
  extId: number;
}
type Update = Partial<Create>;

function makeService(initial: Entry[]): LibraryService<Entry, Create, Update> {
  return {
    fetchLibrary: vi.fn(async () => initial),
    addToLibrary: vi.fn(async (entry: Create) => ({ id: "new", extId: entry.extId })),
    updateLibraryEntry: vi.fn(async (id: string, data: Update) => ({ id, extId: data.extId ?? 0 })),
    removeFromLibrary: vi.fn(async () => undefined),
  };
}

const wrapper = ({ children }: { children: ReactNode }) => <LibraryProvider>{children}</LibraryProvider>;

describe("useLibraryStore", () => {
  it("loads once and finds by external id", async () => {
    const service = makeService([{ id: "1", extId: 10 }]);
    const { result } = renderHook(
      () => useLibraryStore<Entry, Create, Update>("test-find", service, (e) => e.extId),
      { wrapper }
    );
    await waitFor(() => expect(result.current.entries.length).toBe(1));
    expect(service.fetchLibrary).toHaveBeenCalledTimes(1);
    expect(result.current.findByExternalId(10)?.id).toBe("1");
    expect(result.current.findByExternalId(999)).toBeUndefined();
  });

  it("reflects add and remove in the store", async () => {
    const service = makeService([]);
    const { result } = renderHook(
      () => useLibraryStore<Entry, Create, Update>("test-crud", service, (e) => e.extId),
      { wrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.add({ extId: 5 });
    });
    expect(result.current.entries.length).toBe(1);

    await act(async () => {
      await result.current.remove("new");
    });
    expect(result.current.entries.length).toBe(0);
  });
});

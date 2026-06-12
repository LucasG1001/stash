import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaList, type MediaPage } from "./useMediaList";

function page(items: number[], hasNextPage: boolean): Promise<MediaPage<number>> {
  return Promise.resolve({ items, hasNextPage });
}

describe("useMediaList", () => {
  it("loads items and hasNextPage by key", async () => {
    const { result } = renderHook(() => useMediaList<number>("erro"));
    await act(async () => {
      await result.current.load("a", () => page([1, 2], true));
    });
    expect(result.current.items).toEqual([1, 2]);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("serves a repeated key from cache without refetching", async () => {
    const { result } = renderHook(() => useMediaList<number>("erro"));
    const fetchFn = vi.fn(() => page([1], false));
    await act(async () => {
      await result.current.load("a", fetchFn);
    });
    await act(async () => {
      await result.current.load("a", fetchFn);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("loadMore appends the next page", async () => {
    const { result } = renderHook(() => useMediaList<number>("erro"));
    const fetchFn = (p: number) => page(p === 1 ? [1] : [2], p === 1);
    await act(async () => {
      await result.current.load("a", fetchFn);
    });
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items).toEqual([1, 2]);
    expect(result.current.hasNextPage).toBe(false);
  });
});

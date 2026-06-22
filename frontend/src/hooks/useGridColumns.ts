import { useCallback, useRef, useState } from "react";

export function useGridColumns(): [number, (node: HTMLDivElement | null) => void] {
  const [cols, setCols] = useState(1);
  const observerRef = useRef<ResizeObserver | null>(null);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;

    const measure = () => {
      const template = getComputedStyle(node).gridTemplateColumns;
      if (!template || template === "none") return;
      const count = template.split(" ").filter(Boolean).length;
      setCols((prev) => (count > 0 && count !== prev ? count : prev));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [cols, setRef];
}

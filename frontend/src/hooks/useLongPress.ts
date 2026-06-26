import { useRef, useCallback, type PointerEvent as ReactPointerEvent, type MutableRefObject } from "react";

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD = 10;

export interface LongPressHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
}

export function useLongPress(
  onLongPress: (() => void) | undefined,
  suppressClickRef: MutableRefObject<boolean>
): LongPressHandlers {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  }, []);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    suppressClickRef.current = false;
    if (!onLongPress) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    timer.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      onLongPress();
      clear();
    }, LONG_PRESS_MS);
  }, [onLongPress, suppressClickRef, clear]);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    if (timer.current === null || !start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (dx * dx + dy * dy > MOVE_THRESHOLD * MOVE_THRESHOLD) clear();
  }, [clear]);

  return { onPointerDown, onPointerMove, onPointerUp: clear, onPointerLeave: clear, onPointerCancel: clear };
}

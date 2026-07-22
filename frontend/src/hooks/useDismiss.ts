import { useEffect, useRef } from "react";

// Fecha no Escape e trava o scroll do body só no mobile (no desktop o popover é
// ancorado e travar o scroll causaria salto de layout ao sumir a scrollbar).
export function useDismiss(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const lockScroll = window.matchMedia("(max-width: 768px)").matches;
    if (lockScroll) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (lockScroll) document.body.style.overflow = "";
    };
  }, [open]);
}

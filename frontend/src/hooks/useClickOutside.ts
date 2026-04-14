import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
  ignoreRefs?: ReadonlyArray<RefObject<HTMLElement | null>>
): void {
  useEffect(() => {
    if (!enabled) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (ignoreRefs?.some((r) => r.current?.contains(target))) return;
      const el = ref.current;
      if (!el || el.contains(target)) return;
      handler();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [ref, handler, enabled, ignoreRefs]);
}

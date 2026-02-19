"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

export interface UseDebounceOptions {
  /** Max number of invocations allowed before reset (e.g. 3 = allow 3 invokes then cooldown). */
  limit: number;
  /**
   * Cooldown duration(s) in ms. If a number, used after the Nth invoke before reset.
   * If an array, delay after 1st invoke is [0], after 2nd is [1], after 3rd is [2], etc.
   * (e.g. [500, 600, 2000] → 500ms after 1st, 600ms after 2nd, 2000ms after 3rd).
   */
  delayMs: number | number[];
}

/**
 * Returns a function that invokes the given callback, with a debounce after each invoke.
 * After each invocation a cooldown is applied (dynamic if delayMs is an array); after the
 * limit-th invoke the counter resets when the cooldown ends.
 */
export function useDebounce({ limit, delayMs }: UseDebounceOptions) {
  const burstCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const delays = useMemo(
    () => (Array.isArray(delayMs) ? delayMs : Array(limit).fill(delayMs)),
    [limit, delayMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (fn: () => void) => {
      if (timerRef.current) return;
      if (burstCountRef.current >= limit) return;

      burstCountRef.current += 1;
      const count = burstCountRef.current;
      fn();

      const delay = delays[count - 1] ?? delays[delays.length - 1];
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (burstCountRef.current === limit) {
          burstCountRef.current = 0;
        }
      }, delay);
    },
    [limit, delays]
  );
}

"use client";

import { useEffect, useState } from "react";

// Returns a timestamp that refreshes on an interval, so relative times like
// "5 minuti fa" stay current without a manual refresh.
export function useTick(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

// A small transient pill at the bottom of the screen, used for non-blocking
// feedback like a failed save. Auto-dismisses itself after a few seconds.
export function Toast({ message, onDismiss, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [message, onDismiss, durationMs]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="animate-fade-in rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}

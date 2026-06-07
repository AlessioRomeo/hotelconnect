import { STATUS_META } from "@/lib/status";
import type { RoomStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: RoomStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${meta.text}`}>
      <span className={`h-2 w-2 rounded-full ${meta.swatch}`} />
      {meta.label}
    </span>
  );
}

import { SERVICE_META } from "@/lib/service";
import type { ServiceType } from "@/lib/types";
import { DoNotDisturbIcon, PersonIcon } from "./icons";

export function ServiceBadge({ type }: { type: ServiceType }) {
  const meta = SERVICE_META[type];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.pill}`}
    >
      {meta.label}
    </span>
  );
}

export function GuestBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
        <PersonIcon className="h-2.5 w-2.5 shrink-0" />
        Ospite
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
      <PersonIcon className="h-3 w-3" />
      Ospite in camera
    </span>
  );
}

export function DndBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        <DoNotDisturbIcon className="h-2.5 w-2.5 shrink-0" />
        Non disturbare
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
      <DoNotDisturbIcon className="h-3 w-3" />
      Non disturbare
    </span>
  );
}

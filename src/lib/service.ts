import type { ServiceType } from "./types";

export interface ServiceMeta {
  label: string;
  pill: string;
}

export const SERVICE_META: Record<ServiceType, ServiceMeta> = {
  fermata: { label: "Fermata", pill: "bg-sky-100 text-sky-700" },
  partenza: { label: "Partenza", pill: "bg-violet-100 text-violet-700" },
};

export const SERVICE_ORDER: ServiceType[] = ["fermata", "partenza"];

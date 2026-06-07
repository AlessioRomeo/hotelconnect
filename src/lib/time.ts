const rtf = new Intl.RelativeTimeFormat("it", { numeric: "auto" });

export function timeAgo(iso: string, now: number = Date.now()): string {
  const sec = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(sec);
  if (abs < 45) return "adesso";
  if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), "hour");
  return rtf.format(Math.round(sec / 86400), "day");
}

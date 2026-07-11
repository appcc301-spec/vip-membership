import { type PlatformEvent } from "./data";

export function formatEventTime(time?: string): string {
  if (!time) return "TBA";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes || "00"} ${ampm}`;
}

export function getNextEvent(events: PlatformEvent[]): PlatformEvent | undefined {
  const now = new Date().toISOString().split("T")[0];
  return events
    .filter((e) => e.visible && e.status !== "cancelled" && e.date >= now)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

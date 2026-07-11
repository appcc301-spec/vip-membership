import { type PlatformEvent } from "./data";

function formatDateTime(date: string, time?: string): string {
  const timeStr = time || "00:00:00";
  return `${date}T${timeStr}`;
}

export function generateGoogleCalendarUrl(event: PlatformEvent): string {
  const start = formatDateTime(event.date, event.time).replace(/[-:]/g, "").replace("\.000", "");
  const endDate = new Date(formatDateTime(event.date, event.time));
  endDate.setHours(endDate.getHours() + 2);
  const end = endDate.toISOString().replace(/[-:]/g, "").replace("\.000", "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: `Robert Plant concert at ${event.venue}, ${event.city}, ${event.country}.`,
    location: `${event.venue}, ${event.city}, ${event.country}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateICalData(event: PlatformEvent): string {
  const start = formatDateTime(event.date, event.time).replace(/[-:]/g, "").replace(".000", "");
  const endDate = new Date(formatDateTime(event.date, event.time));
  endDate.setHours(endDate.getHours() + 2);
  const end = endDate.toISOString().replace(/[-:]/g, "").replace(".000", "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Robert Plant VIP//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@robertplant-vip.com`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:Robert Plant concert at ${event.venue}, ${event.city}, ${event.country}.`,
    `LOCATION:${event.venue}, ${event.city}, ${event.country}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
}

export function downloadICal(event: PlatformEvent): void {
  const data = generateICalData(event);
  const blob = new Blob([data], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.id}-event.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

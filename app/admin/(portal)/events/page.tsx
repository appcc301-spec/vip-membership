import { getAllEvents } from "@/lib/events-data";
import { getArtists } from "@/lib/members";
import { AdminEventsView } from "@/components/admin/AdminEventsView";

export default async function EventsPage() {
  const [events, artists] = await Promise.all([getAllEvents(), getArtists()]);
  return <AdminEventsView events={events} artists={artists} />;
}

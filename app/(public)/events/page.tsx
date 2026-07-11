import { EventCard } from "@/components/EventCard";
import { getPublicEvents } from "@/lib/events-data";
import { getPrimaryArtist, DEFAULT_ARTIST_NAME } from "@/lib/platform";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const artist = await getPrimaryArtist();
  const name = artist?.name || DEFAULT_ARTIST_NAME;
  return { title: `Upcoming Events | ${name} VIP` };
}

export default async function PublicEventsPage() {
  const [events, artist] = await Promise.all([getPublicEvents(), getPrimaryArtist()]);
  const artistName = artist?.name || DEFAULT_ARTIST_NAME;

  return (
    <div className="min-h-screen bg-rich-black py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-playfair text-gold-gradient mb-4">Upcoming Events</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            {artistName} live on stage — exclusive VIP tour dates and experiences.
          </p>
        </div>

        {events.length > 0 ? (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 border border-white/10 rounded-2xl">
            <p className="text-white/50">No upcoming events at this time. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

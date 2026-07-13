import Link from "next/link";
import { Hero } from "@/components/Hero";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { getPublicEvents } from "@/lib/events-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await getPublicEvents(3);

  return (
    <>
      <Hero />
      <section className="py-20 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair text-gold-gradient mb-4">
              Welcome to the Inner Circle
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              An invitation-only VIP experience. Memberships are created and managed by our team to ensure every member receives the premium treatment they deserve.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Exclusive Access",
                desc: "Early tickets, private events, and behind-the-scenes content reserved for members only.",
              },
              {
                title: "Luxury Digital Card",
                desc: "A personalized, QR-coded VIP membership card stored in your account and ready to download.",
              },
              {
                title: "Curated by the Team",
                desc: "Every membership is personally created and managed by our administrator team.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="glassmorphism p-8 rounded-2xl hover:border-gold/30 transition-colors"
              >
                <h3 className="text-xl font-playfair text-gold mb-3">{item.title}</h3>
                <p className="text-white/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 xl:px-12 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-playfair text-gold-gradient">Upcoming Events</h2>
              <p className="text-white/70 mt-2">Exclusive VIP tour dates and experiences.</p>
            </div>
            <Link href="/events">
              <Button variant="outline">View All Events</Button>
            </Link>
          </div>

          {events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/EventCard";
import { getArtistBySlug } from "@/lib/members";
import { getPublicEvents } from "@/lib/events-data";
import { DEFAULT_ARTIST_NAME } from "@/lib/platform";
import { MEMBERSHIP_TIERS, type TierConfig } from "@/lib/data";
import { Calendar, Music, Mail, Star, ArrowLeft } from "lucide-react";

interface ArtistPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  const artistName = artist?.name || DEFAULT_ARTIST_NAME;
  return {
    title: `${artistName} VIP Membership`,
    description: `Join the ${artistName} VIP inner circle for exclusive access, events, and premium membership experiences.`,
  };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);

  if (!artist || artist.isArchived || artist.status !== "active") {
    notFound();
  }

  const events = await getPublicEvents(undefined, artist.id);
  const artistName = artist.name || DEFAULT_ARTIST_NAME;

  return (
    <div className="min-h-screen bg-rich-black">
      {/* Hero Banner */}
      <div className="relative h-[50vh] min-h-[360px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${artist.bannerUrl || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600&auto=format&fit=crop"})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-rich-black via-rich-black/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-4">
          {artist.logoUrl ? (
            <img
              src={artist.logoUrl}
              alt={artistName}
              className="h-20 md:h-28 w-auto object-contain mb-4 drop-shadow-lg"
            />
          ) : (
            <h1 className="text-4xl md:text-6xl font-playfair text-gold-gradient text-center mb-2">
              {artistName}
            </h1>
          )}
          <p className="text-white/70 text-center max-w-2xl">
            Exclusive VIP Membership Experience
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-gold transition-colors">
          <ArrowLeft size={18} /> Back to platform home
        </Link>

        {/* Bio / About */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-playfair text-gold-gradient">About {artistName}</h2>
            <p className="text-white/70 leading-relaxed text-lg">
              {artist.description ||
                `${artistName} VIP Membership is an invitation-only experience. Memberships are created and managed by our team to ensure every member receives the premium treatment they deserve.`}
            </p>
          </div>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-playfair text-gold text-xl">Quick Info</h3>
              <div className="space-y-3 text-sm text-white/70">
                {artist.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gold" />
                    <span>{artist.contactEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-gold" />
                  <span>Invitation-only membership</span>
                </div>
                <div className="flex items-center gap-2">
                  <Music size={16} className="text-gold" />
                  <span>Exclusive content & events</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Membership Tiers */}
        <section>
          <h2 className="text-3xl font-playfair text-gold-gradient mb-8 text-center">Membership Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MEMBERSHIP_TIERS.map((tier: TierConfig) => (
              <Card
                key={tier.id}
                className="bg-white/5 border-white/10 hover:border-gold/30 transition-colors overflow-hidden"
              >
                <CardContent className="p-8 text-center space-y-4">
                  <h3 className="text-2xl font-playfair text-gold capitalize">{tier.name}</h3>
                  <div className="text-3xl font-semibold text-white">${tier.price}</div>
                  <ul className="text-sm text-white/70 space-y-2 text-left">
                    {tier.benefits.slice(0, 4).map((benefit: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Star size={14} className="text-gold mt-1 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Events */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-playfair text-gold-gradient">Upcoming Events</h2>
              <p className="text-white/70 mt-2">Exclusive {artistName} tour dates and experiences.</p>
            </div>
          </div>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-white/10 rounded-2xl">
              <Calendar className="mx-auto text-gold/60 mb-3" size={32} />
              <p className="text-white/50">No upcoming events for {artistName} at this time.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

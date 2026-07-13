import Link from "next/link";
import { getMemberById, getArtistById } from "@/lib/members";
import { getMemberEvents } from "@/lib/events-data";
import { getSession } from "@/lib/auth";
import { VIPCard } from "@/components/VIPCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Crown, Calendar, Ticket, Music, Gift, Clock, AlertTriangle } from "lucide-react";
import { EXCLUSIVE_CONTENT } from "@/lib/data";

export default async function MemberDashboardPage() {
  const session = await getSession();
  const member = await getMemberById(session?.id || "");
  const artist = member?.artistId ? await getArtistById(member.artistId) : null;
  const artistName = artist?.name || "VIP";

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <AlertTriangle className="text-white/30" size={26} />
        </div>
        <h2 className="text-xl font-playfair text-white/60">Account not found</h2>
        <p className="text-white/40 text-sm max-w-sm">
          Your account could not be loaded. Please try logging out and back in. If the issue persists, contact support.
        </p>
        <a href="/api/auth/logout" className="text-sm text-gold/70 hover:text-gold underline">Sign out</a>
      </div>
    );
  }

  const status = member.membership.status;
  const isPending = status === "pending" || status === "pending-24h" || status === "pending-48h";

  // Safe event fetch — gracefully handle missing events table
  let upcomingEvents: Awaited<ReturnType<typeof getMemberEvents>> = [];
  try {
    upcomingEvents = (await getMemberEvents(member.artistId)).slice(0, 3);
  } catch {}

  // ── Pending membership screen ────────────────────────────────────────────────
  if (isPending) {
    const pendingExpiresAt = member.membership.pendingExpiresAt
      ? (() => {
          const d = new Date(member.membership.pendingExpiresAt!);
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const min = String(d.getMinutes()).padStart(2, "0");
          return `${d.getFullYear()}-${mm}-${dd} ${hh}:${min}`;
        })()
      : null;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-playfair text-gold-gradient">
            Welcome, {member.personal.firstName}
          </h1>
          <p className="text-white/60">Your {artistName} VIP membership account is ready.</p>
        </div>

        {/* Pending notice */}
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <Clock className="text-yellow-400" size={30} />
              </div>
              <div>
                <h2 className="text-xl font-playfair text-white mb-2">Membership Pending Activation</h2>
                <p className="text-white/60 leading-relaxed max-w-md">
                  Your <span className="text-yellow-400 capitalize font-medium">{member.membership.tier} VIP</span> membership application has been received successfully.
                  Your account will be <strong className="text-white">fully activated</strong> once payment has been received and confirmed by our team.
                </p>
                {pendingExpiresAt && (
                  <p className="text-orange-300 text-sm mt-3">
                    ⏱ Payment deadline: <strong>{pendingExpiresAt}</strong>
                  </p>
                )}
              </div>
              <div className="w-full max-w-sm glassmorphism rounded-xl p-4 text-sm text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/50">Membership #</span>
                  <span className="text-white font-mono">{member.membership.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Tier</span>
                  <span className="text-white capitalize">{member.membership.tier} VIP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Status</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border capitalize">
                    {status === "pending" ? "Pending" : status === "pending-24h" ? "Pending (24h)" : "Pending (48h)"}
                  </Badge>
                </div>
              </div>
              <p className="text-white/40 text-xs">
                Once activated, you will have full access to your VIP card, exclusive content, and member benefits.
              </p>
              <a
                href="/support"
                className="text-sm text-gold/70 hover:text-gold underline transition-colors"
              >
                Questions about payment? Contact support →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Active membership dashboard ───────────────────────────────────────────────
  const tierBenefits = member.membership.tier;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Welcome, {member.personal.firstName}</h1>
        <p className="text-white/60">Your {artistName} private VIP lounge and digital membership card.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VIPCard member={member} />
        </div>
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
                <Crown size={18} className="text-gold" /> Membership Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Tier</span>
                <span className="text-white capitalize font-medium">{member.membership.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Number</span>
                <span className="text-white font-mono">{member.membership.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status</span>
                <Badge variant="success" className="capitalize">
                  {member.membership.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Joined</span>
                <span className="text-white">{formatDate(member.membership.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Renews</span>
                <span className="text-white">{formatDate(member.membership.expirationDate)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
              <Gift size={18} className="text-gold" /> Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2"><Ticket size={14} className="text-gold" /> Early ticket access</li>
              <li className="flex items-center gap-2"><Gift size={14} className="text-gold" /> Exclusive merchandise</li>
              <li className="flex items-center gap-2"><Music size={14} className="text-gold" /> Digital downloads</li>
              {tierBenefits !== "gold" && (
                <li className="flex items-center gap-2"><Crown size={14} className="text-gold" /> VIP events & meetups</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
              <Calendar size={18} className="text-gold" /> Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-white/50 text-sm">No upcoming events.</p>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between text-sm">
                  <div>
                    <p className="text-white font-medium">{event.title}</p>
                    <p className="text-white/50">{event.venue}, {event.city}</p>
                  </div>
                  <p className="text-gold text-xs">{formatDate(event.date)}</p>
                </div>
              ))
            )}
            <Link href="/my-events">
              <Button variant="outline" size="sm" className="w-full mt-2">View All Events</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
              <Music size={18} className="text-gold" /> Exclusive Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EXCLUSIVE_CONTENT.slice(0, 3).map((content) => (
              <div key={content.id} className="flex items-center gap-3 group cursor-pointer">
                <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden">
                  <img
                    src={content.thumbnail}
                    alt={content.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{content.title}</p>
                  <p className="text-white/50 text-xs capitalize">{content.type}</p>
                </div>
              </div>
            ))}
            <Link href="/content">
              <Button variant="outline" size="sm" className="w-full mt-1">View All Content</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

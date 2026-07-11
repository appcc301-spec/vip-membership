"use client";

import { useState } from "react";
import { Calendar, Ticket, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EventCard } from "@/components/EventCard";
import { EventCountdown } from "@/components/EventCountdown";
import { downloadICal, generateGoogleCalendarUrl } from "@/lib/calendar";
import { getNextEvent } from "@/lib/events";
import { type PlatformEvent } from "@/lib/data";

type RsvpState = Record<string, "going" | "interested" | "not_going">;

interface MemberEventsViewProps {
  events: PlatformEvent[];
  memberId: string;
  initialRsvps?: RsvpState;
}

export function MemberEventsView({ events, memberId, initialRsvps = {} }: MemberEventsViewProps) {
  const [rsvps, setRsvps] = useState<RsvpState>(initialRsvps);
  const [loading, setLoading] = useState<string | null>(null);
  const nextEvent = getNextEvent(events);

  async function rsvp(eventId: string, status: RsvpState[string]) {
    setLoading(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to RSVP");
      setRsvps((prev) => ({ ...prev, [eventId]: status }));
      toast.success(status === "not_going" ? "RSVP updated." : "You're on the list!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">VIP Events</h1>
        <p className="text-white/60">Upcoming tour dates and exclusive member experiences.</p>
      </div>

      {nextEvent && <EventCountdown event={nextEvent} />}

      {events.length === 0 ? (
        <div className="text-center py-12 border border-white/10 rounded-xl bg-white/[0.02]">
          <Calendar className="mx-auto text-gold/60 mb-3" size={32} />
          <p className="text-white/70">No upcoming events have been synced yet.</p>
          <p className="text-white/50 text-sm mt-1">Live tour dates are loaded via the Bandsintown API.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const currentRsvp = rsvps[event.id];
            return (
              <EventCard
                key={event.id}
                event={event}
                actions={
                  <div className="flex flex-wrap gap-2 w-full">
                    <Button
                      size="sm"
                      variant={currentRsvp === "going" ? "default" : "outline"}
                      className="gap-2"
                      onClick={() => rsvp(event.id, "going")}
                      disabled={loading === event.id}
                    >
                      <Ticket size={14} /> {currentRsvp === "going" ? "Going" : "RSVP"}
                    </Button>
                    <Button
                      size="sm"
                      variant={currentRsvp === "interested" ? "default" : "outline"}
                      className="gap-2"
                      onClick={() => rsvp(event.id, "interested")}
                      disabled={loading === event.id}
                    >
                      <Bell size={14} /> Interested
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadICal(event)}>
                      <Calendar size={14} /> Add to Calendar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" asChild>
                      <a href={generateGoogleCalendarUrl(event)} target="_blank" rel="noreferrer">
                        <Check size={14} /> Google Calendar
                      </a>
                    </Button>
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

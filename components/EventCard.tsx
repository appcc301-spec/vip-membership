"use client";

import { Calendar, MapPin, Clock, ExternalLink, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { formatEventTime } from "@/lib/events";
import { type PlatformEvent } from "@/lib/data";

interface EventCardProps {
  event: PlatformEvent;
  variant?: "default" | "compact" | "premium";
  showBadge?: boolean;
  actions?: React.ReactNode;
}

export function EventCard({ event, variant = "default", showBadge = true, actions }: EventCardProps) {
  const isCompact = variant === "compact";
  const isPremium = variant === "premium";

  return (
    <Card
      className={cn(
        "group overflow-hidden bg-white/5 border-white/10 transition-all duration-500 hover:border-gold/40 hover:shadow-gold/10",
        isPremium && "relative border-gold/20 hover:shadow-lg hover:shadow-gold/20"
      )}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.imageUrl || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800"}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-rich-black via-rich-black/40 to-transparent" />
        <div className="absolute top-4 left-4 bg-rich-black/80 backdrop-blur border border-gold/30 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-gold uppercase tracking-wider">{new Date(event.date + "T00:00:00").toLocaleString("en-US", { month: "short" })}</div>
          <div className="text-xl font-playfair font-bold text-white">{new Date(event.date + "T00:00:00").getDate()}</div>
        </div>
        {showBadge && (
          <div className="absolute top-4 right-4">
            <Badge variant={event.type === "vip" ? "default" : "outline"} className={cn("uppercase text-xs", event.type === "vip" && "bg-gold text-rich-black border-gold")}>
              {event.type === "vip" ? "VIP Exclusive" : event.status.replace("_", " ")}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className={cn("p-5", isPremium && "relative")}>
        <h3 className={cn("font-playfair text-white", isCompact ? "text-lg" : "text-xl")}>{event.title}</h3>
        <div className="mt-3 space-y-2 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gold" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gold" />
              <span>{formatEventTime(event.time)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gold" />
            <span>{event.venue}, {event.city}, {event.country}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {event.ticketUrl && (
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <a href={event.ticketUrl} target="_blank" rel="noreferrer">
                <Ticket size={14} /> Tickets
              </a>
            </Button>
          )}
          {event.bandsintownUrl && (
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <a href={event.bandsintownUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Bandsintown
              </a>
            </Button>
          )}
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}

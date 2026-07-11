"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { type PlatformEvent } from "@/lib/data";

interface EventCountdownProps {
  event: PlatformEvent;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(targetDate: string, targetTime?: string): TimeLeft {
  const dateTime = targetTime ? `${targetDate}T${targetTime}` : `${targetDate}T00:00:00`;
  const target = new Date(dateTime).getTime();
  const now = new Date().getTime();
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function EventCountdown({ event }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(event.date, event.time));
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(event.date, event.time));
    }, 1000);
    return () => clearInterval(timer);
  }, [event.date, event.time]);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <Card className="bg-gradient-to-br from-gold/20 to-gold/5 border-gold/30">
      <CardContent className="p-6">
        <p className="text-sm text-gold uppercase tracking-widest mb-3">Next concert in</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {units.map((unit) => (
            <div key={unit.label} className="bg-rich-black/60 rounded-lg p-3">
              <div className="text-2xl md:text-3xl font-playfair font-bold text-white">{String(unit.value).padStart(2, "0")}</div>
              <div className="text-xs text-white/60 uppercase mt-1">{unit.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-white font-playfair text-lg">{event.title}</p>
        <p className="text-white/60 text-sm">{event.venue}, {event.city}</p>
      </CardContent>
    </Card>
  );
}

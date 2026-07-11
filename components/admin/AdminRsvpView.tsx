"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Download, Calendar, MapPin, CheckCircle2, Star, XCircle, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { type RsvpEventSummary } from "@/lib/events-data";

interface RsvpMember {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberTier: string;
  memberStatus: string;
  status: "going" | "interested" | "not_going";
  createdAt: string;
}

interface AdminRsvpViewProps {
  summaries: RsvpEventSummary[];
}

function exportCsv(rows: RsvpMember[], filename: string) {
  const header = "Name,Email,Tier,Member Status,RSVP,Date";
  const lines = rows.map(
    (r) => `"${r.memberName}","${r.memberEmail}","${r.memberTier}","${r.memberStatus}","${r.status}","${r.createdAt?.slice(0, 10) ?? ""}"`
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export function AdminRsvpView({ summaries }: AdminRsvpViewProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Record<string, { going: RsvpMember[]; interested: RsvpMember[]; notGoing: RsvpMember[] }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const totalGoing = summaries.reduce((a, s) => a + s.going, 0);
  const totalInterested = summaries.reduce((a, s) => a + s.interested, 0);
  const totalRsvps = summaries.reduce((a, s) => a + s.total, 0);
  const eventsWithRsvps = summaries.filter((s) => s.total > 0).length;
  const displayedSummaries = showAll ? summaries : summaries.filter((s) => s.total > 0);

  async function refreshPage() {
    setRefreshing(true);
    setAttendees({});
    setErrors({});
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  }

  async function loadAttendees(eventId: string) {
    setLoading(eventId);
    setErrors((prev) => { const n = { ...prev }; delete n[eventId]; return n; });
    try {
      const res = await fetch(`/api/events/${eventId}/attendees`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        setErrors((prev) => ({ ...prev, [eventId]: msg }));
        toast.error(`Failed to load: ${msg}`);
        return;
      }
      setAttendees((prev) => ({ ...prev, [eventId]: data }));
    } catch (e: any) {
      const msg = e?.message || "Network error";
      setErrors((prev) => ({ ...prev, [eventId]: msg }));
      toast.error("Could not load attendees.");
    } finally {
      setLoading(null);
    }
  }

  async function toggleEvent(eventId: string) {
    if (expanded === eventId) { setExpanded(null); return; }
    setExpanded(eventId);
    // Always re-fetch — never use stale cached data
    await loadAttendees(eventId);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair text-gold-gradient">Event Interest & RSVP Tracking</h1>
          <p className="text-white/60">Monitor member responses and interest across all events.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={refreshPage}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider">Going</p>
                <p className="text-2xl font-bold text-white">{totalGoing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center">
                <Star size={20} className="text-gold" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider">Interested</p>
                <p className="text-2xl font-bold text-white">{totalInterested}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider">Total RSVPs</p>
                <p className="text-2xl font-bold text-white">{totalRsvps}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Calendar size={20} className="text-white/60" />
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider">Events w/ RSVPs</p>
                <p className="text-2xl font-bold text-white">{eventsWithRsvps}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-event RSVP list */}
      {summaries.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-16 text-center">
            <Calendar size={40} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/60 font-medium">No events found</p>
            <p className="text-white/40 text-sm mt-1">Sync events from the Events page first, then members can RSVP.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Filter toggle */}
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-sm">
              {showAll
                ? `All ${summaries.length} events`
                : eventsWithRsvps === 0
                ? "No RSVPs yet — showing all events"
                : `${eventsWithRsvps} event${eventsWithRsvps !== 1 ? "s" : ""} with responses`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/50 hover:text-white"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Show with RSVPs only" : `Show all ${summaries.length} events`}
            </Button>
          </div>

          {displayedSummaries.length === 0 && !showAll && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-10 text-center">
                <p className="text-white/50 text-sm">No members have RSVPed to any event yet.</p>
                <Button variant="ghost" size="sm" className="mt-2 text-xs text-gold" onClick={() => setShowAll(true)}>
                  View all events
                </Button>
              </CardContent>
            </Card>
          )}

          {displayedSummaries.map((s) => {
            const isExpanded = expanded === s.eventId;
            const data = attendees[s.eventId];
            const isLoading = loading === s.eventId;

            return (
              <Card key={s.eventId} className="bg-white/5 border-white/10 overflow-hidden">
                {/* Event row */}
                <button
                  className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.03] transition-colors"
                  onClick={() => toggleEvent(s.eventId)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-white font-playfair font-semibold text-base leading-tight">{s.eventTitle}</p>
                      {s.total === 0 && (
                        <Badge variant="outline" className="text-white/30 border-white/10 text-xs">No responses</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-white/50 text-sm flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(s.eventDate)}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} />{s.eventVenue}, {s.eventCity}</span>
                    </div>
                  </div>

                  {/* RSVP pill stats */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                      <CheckCircle2 size={13} className="text-green-400" />
                      <span className="text-green-400 text-sm font-semibold">{s.going}</span>
                      <span className="text-green-400/60 text-xs">going</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20">
                      <Star size={13} className="text-gold" />
                      <span className="text-gold text-sm font-semibold">{s.interested}</span>
                      <span className="text-gold/60 text-xs">interested</span>
                    </div>
                    {s.notGoing > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <XCircle size={13} className="text-white/40" />
                        <span className="text-white/50 text-sm font-semibold">{s.notGoing}</span>
                      </div>
                    )}
                    <div className="ml-2 text-white/40">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-5 space-y-5">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-white/50 text-sm py-4">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-gold rounded-full animate-spin" />
                        Loading member details…
                      </div>
                    ) : errors[s.eventId] ? (
                      <div className="flex items-center gap-3 py-4">
                        <AlertCircle size={16} className="text-red-400 shrink-0" />
                        <p className="text-red-400 text-sm">{errors[s.eventId]}</p>
                        <Button size="sm" variant="outline" className="gap-1.5 ml-auto" onClick={() => loadAttendees(s.eventId)}>
                          <RefreshCw size={13} /> Retry
                        </Button>
                      </div>
                    ) : !data ? null : (
                      <>
                        {/* Going table */}
                        {data.going.length > 0 && (
                          <MemberTable
                            title="Going"
                            color="green"
                            rows={data.going}
                            onExport={() => exportCsv(data.going, `${s.eventId}-going.csv`)}
                          />
                        )}

                        {/* Interested table */}
                        {data.interested.length > 0 && (
                          <MemberTable
                            title="Interested"
                            color="gold"
                            rows={data.interested}
                            onExport={() => exportCsv(data.interested, `${s.eventId}-interested.csv`)}
                          />
                        )}

                        {/* Not going table */}
                        {data.notGoing.length > 0 && (
                          <MemberTable
                            title="Not Going"
                            color="muted"
                            rows={data.notGoing}
                            onExport={() => exportCsv(data.notGoing, `${s.eventId}-not-going.csv`)}
                          />
                        )}

                        {/* Export all */}
                        {(data.going.length + data.interested.length + data.notGoing.length) > 0 && (
                          <div className="pt-2 flex gap-2">
                            <Button
                              size="sm" variant="outline"
                              className="gap-1.5 text-xs"
                              onClick={() => exportCsv(
                                [...data.going, ...data.interested, ...data.notGoing],
                                `${s.eventId}-all-rsvps.csv`
                              )}
                            >
                              <Download size={13} /> Export All RSVPs
                            </Button>
                          </div>
                        )}

                        {(data.going.length + data.interested.length + data.notGoing.length) === 0 && (
                          <p className="text-white/40 text-sm py-2">No members have responded yet.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MemberTable({
  title,
  color,
  rows,
  onExport,
}: {
  title: string;
  color: "green" | "gold" | "muted";
  rows: RsvpMember[];
  onExport: () => void;
}) {
  const colorMap = {
    green: "text-green-400",
    gold: "text-gold",
    muted: "text-white/40",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs uppercase tracking-wider font-semibold ${colorMap[color]}`}>
          {title} ({rows.length})
        </p>
        <Button size="sm" variant="ghost" className="gap-1 text-xs text-white/40 hover:text-white h-6 px-2" onClick={onExport}>
          <Download size={11} /> CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/[0.07]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-white/[0.02]">
              <th className="text-left py-2.5 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Name</th>
              <th className="text-left py-2.5 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Email</th>
              <th className="text-left py-2.5 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Tier</th>
              <th className="text-left py-2.5 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="text-left py-2.5 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                <td className="py-3 px-4 text-white font-medium">{r.memberName}</td>
                <td className="py-3 px-4 text-white/60">{r.memberEmail}</td>
                <td className="py-3 px-4">
                  <span className="capitalize text-white/70 bg-white/5 px-2 py-0.5 rounded text-xs">{r.memberTier}</span>
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant={r.memberStatus === "active" ? "success" : "destructive"}
                    className="capitalize text-xs"
                  >
                    {r.memberStatus}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-white/50 text-xs font-mono">{r.createdAt?.slice(0, 10) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

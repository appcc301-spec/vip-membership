"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Eye, EyeOff, Star, Trash2, Plus, Calendar, MapPin, Clock, AlertCircle, CheckCircle2, Info, Activity, Users, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { formatEventTime } from "@/lib/events";
import { type PlatformEvent, type SyncStatus, type Artist } from "@/lib/data";

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

interface EventAttendees {
  going: RsvpMember[];
  interested: RsvpMember[];
  notGoing: RsvpMember[];
  total: number;
}

interface AdminEventsViewProps {
  events: PlatformEvent[];
  artists?: Artist[];
}

interface ConnectionTestResult {
  ok: boolean;
  endpoint: string;
  apiStatus?: number;
  errorMessage?: string;
  rawResponse?: string;
}

function exportCsv(rows: RsvpMember[], filename: string) {
  const header = "Name,Email,Tier,Status,Date";
  const lines = rows.map((r) =>
    `"${r.memberName}","${r.memberEmail}","${r.memberTier}","${r.memberStatus}","${r.createdAt.slice(0, 10)}"`
  );
  const csv = [header, ...lines].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

export function AdminEventsView({ events: initialEvents, artists = [] }: AdminEventsViewProps) {
  const [events, setEvents] = useState<PlatformEvent[]>(initialEvents);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Record<string, EventAttendees>>({});
  const [loadingAttendees, setLoadingAttendees] = useState<string | null>(null);
  const [filterArtistId, setFilterArtistId] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    venue: "",
    city: "",
    country: "",
    imageUrl: "",
    ticketUrl: "",
    featured: false,
    artistId: "",
  });

  useEffect(() => {
    loadSyncStatus();
  }, []);

  async function loadSyncStatus() {
    try {
      const res = await fetch("/api/events/sync-status");
      const data = await res.json();
      setSyncStatus(data.status || null);
    } catch {
      setSyncStatus(null);
    }
  }

  async function sync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/events", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      if (data.result.errorMessage) {
        toast.error(`Sync failed: ${data.result.errorMessage}`);
      } else {
        toast.success(`Synced ${data.result.imported} events from the Bandsintown API.`);
      }
      const refreshed = await fetch("/api/events?scope=admin");
      const refreshedData = await refreshed.json();
      setEvents(refreshedData.events || []);
      await loadSyncStatus();
    } catch (err: any) {
      toast.error(err.message);
      await loadSyncStatus();
    } finally {
      setSyncing(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const res = await fetch("/api/events/test-connection");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection test failed");
      setTestResult(data.result);
      if (data.result.ok) {
        toast.success(`Connection OK (${data.result.apiStatus}).`);
      } else {
        toast.error(`Connection failed: ${data.result.errorMessage}`);
      }
    } catch (err: any) {
      toast.error(err.message);
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  }

  async function toggleVisibility(id: string, visible: boolean) {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, visible } : e)));
      toast.success(visible ? "Event visible." : "Event hidden.");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleFeatured(id: string, featured: boolean) {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });
      if (!res.ok) throw new Error("Failed to update featured");
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, featured } : e)));
      toast.success(featured ? "Event featured on homepage." : "Removed from featured.");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event deleted.");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleAttendees(eventId: string) {
    if (expandedEvent === eventId) { setExpandedEvent(null); return; }
    setExpandedEvent(eventId);
    if (attendees[eventId]) return;
    setLoadingAttendees(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees`);
      const data = await res.json();
      setAttendees((prev) => ({ ...prev, [eventId]: data }));
    } catch {
      toast.error("Failed to load attendees.");
    } finally {
      setLoadingAttendees(null);
    }
  }

  const activeArtists = artists.filter((a) => a.status === "active");
  const artistMap = Object.fromEntries(artists.map((a) => [a.id, a.name]));
  const filteredEvents = filterArtistId
    ? events.filter((e) => e.artistId === filterArtistId)
    : events;

  async function createVipEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/events/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      setEvents((prev) => [...prev, data.event]);
      toast.success("VIP event created.");
      setShowForm(false);
      setForm({ title: "", date: "", time: "", venue: "", city: "", country: "", imageUrl: "", ticketUrl: "", featured: false, artistId: "" });
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair text-gold-gradient">Events</h1>
          <p className="text-white/60">Manage imported tour dates and VIP-only events.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeArtists.length > 0 && (
            <select
              value={filterArtistId}
              onChange={(e) => setFilterArtistId(e.target.value)}
              className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value="">All Artists</option>
              {activeArtists.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus size={16} /> New VIP Event
          </Button>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
            <Info size={18} className="text-gold" /> Event Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStatus?.status === "disabled" ? (
            <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm space-y-3">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">No API key configured — live events via widget only</p>
                  <p className="text-white/70 mt-1">
                    Public and member pages display live tour dates through the official Bandsintown widget. To import dates into the database (enabling RSVP, featured toggles, and visibility control), add a <strong className="text-white">free</strong> Ticketmaster API key — no artist account needed.
                  </p>
                </div>
              </div>
              <div className="pl-7 space-y-1 text-white/70">
                <p className="font-medium text-white">How to get a free Ticketmaster API key:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://developer.ticketmaster.com" target="_blank" rel="noreferrer" className="text-gold hover:underline">developer.ticketmaster.com</a></li>
                  <li>Click <strong className="text-white">Register</strong> — takes 2 minutes</li>
                  <li>Copy your Consumer Key from the dashboard</li>
                  <li>Add <code className="text-gold">TICKETMASTER_API_KEY=your_key</code> to <code className="text-white/80">.env.local</code></li>
                  <li>Restart the server and click <strong className="text-white">Sync Events</strong></li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={testConnection} disabled={testing} className="gap-2">
                <Activity size={16} className={testing ? "animate-pulse" : ""} /> Test Connection
              </Button>
              <Button variant="outline" size="sm" onClick={sync} disabled={syncing} className="gap-2">
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} /> Sync Events
              </Button>
            </div>
          )}

          {syncStatus && syncStatus.status !== "disabled" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-white/50">Endpoint</p>
                <p className="text-white break-all">{syncStatus.endpoint}</p>
              </div>
              <div>
                <p className="text-white/50">Last sync</p>
                <p className="text-white">{formatDate(syncStatus.syncedAt)}</p>
              </div>
              <div>
                <p className="text-white/50">Imported</p>
                <p className="text-white">{syncStatus.importedCount} events</p>
              </div>
              <div>
                <p className="text-white/50">Status</p>
                <div className="flex items-center gap-1">
                  {syncStatus.status === "success" ? (
                    <CheckCircle2 size={14} className="text-green-400" />
                  ) : (
                    <AlertCircle size={14} className="text-red-400" />
                  )}
                  <span className={syncStatus.status === "success" ? "text-green-400" : "text-red-400"}>
                    {syncStatus.status === "success" ? "Live API" : "API Error"}
                  </span>
                </div>
              </div>
              {typeof syncStatus.apiStatus === "number" && (
                <div>
                  <p className="text-white/50">HTTP response</p>
                  <p className="text-white">{syncStatus.apiStatus}</p>
                </div>
              )}
              {syncStatus.errorMessage && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-white/50">Error</p>
                  <p className="text-red-300">{syncStatus.errorMessage}</p>
                </div>
              )}
            </div>
          ) : syncStatus === null ? (
            <p className="text-white/50 text-sm">No sync recorded yet. Click &ldquo;Test Connection&rdquo; to verify the API configuration.</p>
          ) : null}

          {testResult && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-white/50 text-sm mb-2">Connection Test Result</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-white/50">Endpoint</p>
                  <p className="text-white break-all">{testResult.endpoint}</p>
                </div>
                <div>
                  <p className="text-white/50">HTTP response</p>
                  <p className="text-white">{testResult.apiStatus ?? "—"}</p>
                </div>
                <div>
                  <p className="text-white/50">Status</p>
                  <p className={testResult.ok ? "text-green-400" : "text-red-400"}>{testResult.ok ? "OK" : "Failed"}</p>
                </div>
                {testResult.errorMessage && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-white/50">Error</p>
                    <p className="text-red-300">{testResult.errorMessage}</p>
                  </div>
                )}
                {testResult.rawResponse && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-white/50">Raw response preview</p>
                    <pre className="text-xs text-white/70 bg-black/30 p-2 rounded overflow-auto">{testResult.rawResponse}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair">Create VIP Private Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createVipEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeArtists.length > 0 && (
                <div className="md:col-span-2 space-y-2">
                  <Label>Artist</Label>
                  <select
                    value={form.artistId}
                    onChange={(e) => setForm({ ...form, artistId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="">— Select Artist (optional) —</option>
                    {activeArtists.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Ticket / Link URL</Label>
                <Input value={form.ticketUrl} onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                <Label htmlFor="featured">Feature on homepage</Label>
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Create VIP Event</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 border border-white/10 rounded-xl bg-white/[0.02]">
          <Calendar className="mx-auto text-gold/60 mb-3" size={32} />
          <p className="text-white/70">{filterArtistId ? "No events for this artist." : "No events have been synced yet."}</p>
          {!filterArtistId && (
            <p className="text-white/50 text-sm mt-1 max-w-md mx-auto">
              Configure <code className="text-gold">BANDSINTOWN_APP_ID</code> and click Test Connection, then Sync Bandsintown to import live tour dates.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="bg-white/5 border-white/10">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-40 h-32 sm:h-auto shrink-0 overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none">
                  <img
                    src={event.imageUrl || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <Badge variant={event.type === "vip" ? "default" : "outline"} className={event.type === "vip" ? "bg-gold text-rich-black border-gold" : ""}>
                          {event.type === "vip" ? "VIP Private" : "Imported"}
                        </Badge>
                        <Badge variant={event.status === "upcoming" ? "success" : "destructive"} className="capitalize">
                          {event.status.replace("_", " ")}
                        </Badge>
                        {event.artistId && artistMap[event.artistId] && (
                          <Badge className="bg-white/10 text-white/60 border-white/20 border text-xs">
                            {artistMap[event.artistId]}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-playfair text-white text-lg">{event.title}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => toggleFeatured(event.id, !event.featured)} title={event.featured ? "Unfeature" : "Feature"}>
                        <Star size={16} className={event.featured ? "text-gold fill-gold" : "text-white/60"} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => toggleVisibility(event.id, !event.visible)} title={event.visible ? "Hide" : "Show"}>
                        {event.visible ? <Eye size={16} className="text-white/60" /> : <EyeOff size={16} className="text-white/60" />}
                      </Button>
                      {event.type === "vip" && (
                        <Button size="icon" variant="ghost" onClick={() => deleteEvent(event.id)} title="Delete">
                          <Trash2 size={16} className="text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-white/60">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-gold" /> {formatDate(event.date)}</div>
                    {event.time && <div className="flex items-center gap-2"><Clock size={14} className="text-gold" /> {formatEventTime(event.time)}</div>}
                    <div className="flex items-center gap-2"><MapPin size={14} className="text-gold" /> {event.venue}, {event.city}, {event.country}</div>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => toggleAttendees(event.id)}
                      className="gap-2 text-white/60 hover:text-white text-xs"
                    >
                      <Users size={13} />
                      {attendees[event.id]
                        ? `${attendees[event.id].going.length} Going · ${attendees[event.id].interested.length} Interested`
                        : "View Attendees"}
                      {expandedEvent === event.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </Button>
                  </div>
                </CardContent>
              </div>

              {expandedEvent === event.id && (
                <div className="border-t border-white/10 p-5 space-y-4">
                  {loadingAttendees === event.id ? (
                    <p className="text-white/50 text-sm">Loading attendees…</p>
                  ) : attendees[event.id] ? (
                    <>
                      <div className="flex gap-4 text-sm">
                        <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                          ✓ {attendees[event.id].going.length} Going
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-gold">
                          ★ {attendees[event.id].interested.length} Interested
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50">
                          Total: {attendees[event.id].total}
                        </div>
                      </div>

                      {attendees[event.id].going.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs uppercase tracking-wider text-green-400 font-semibold">Going</p>
                            <Button size="sm" variant="ghost" className="gap-1 text-xs text-white/50 h-6 px-2"
                              onClick={() => exportCsv(attendees[event.id].going, `${event.id}-going.csv`)}>
                              <Download size={11} /> CSV
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-white/70">
                              <thead><tr className="border-b border-white/10">
                                <th className="text-left py-1.5 pr-4 text-white/40">Name</th>
                                <th className="text-left py-1.5 pr-4 text-white/40">Email</th>
                                <th className="text-left py-1.5 pr-4 text-white/40">Tier</th>
                                <th className="text-left py-1.5 text-white/40">Date</th>
                              </tr></thead>
                              <tbody>{attendees[event.id].going.map((r) => (
                                <tr key={r.id} className="border-b border-white/5">
                                  <td className="py-1.5 pr-4">{r.memberName}</td>
                                  <td className="py-1.5 pr-4">{r.memberEmail}</td>
                                  <td className="py-1.5 pr-4 capitalize">{r.memberTier}</td>
                                  <td className="py-1.5">{r.createdAt.slice(0, 10)}</td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {attendees[event.id].interested.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs uppercase tracking-wider text-gold font-semibold">Interested</p>
                            <Button size="sm" variant="ghost" className="gap-1 text-xs text-white/50 h-6 px-2"
                              onClick={() => exportCsv(attendees[event.id].interested, `${event.id}-interested.csv`)}>
                              <Download size={11} /> CSV
                            </Button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-white/70">
                              <thead><tr className="border-b border-white/10">
                                <th className="text-left py-1.5 pr-4 text-white/40">Name</th>
                                <th className="text-left py-1.5 pr-4 text-white/40">Email</th>
                                <th className="text-left py-1.5 pr-4 text-white/40">Tier</th>
                                <th className="text-left py-1.5 text-white/40">Date</th>
                              </tr></thead>
                              <tbody>{attendees[event.id].interested.map((r) => (
                                <tr key={r.id} className="border-b border-white/5">
                                  <td className="py-1.5 pr-4">{r.memberName}</td>
                                  <td className="py-1.5 pr-4">{r.memberEmail}</td>
                                  <td className="py-1.5 pr-4 capitalize">{r.memberTier}</td>
                                  <td className="py-1.5">{r.createdAt.slice(0, 10)}</td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {attendees[event.id].total === 0 && (
                        <p className="text-white/40 text-sm">No members have responded to this event yet.</p>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

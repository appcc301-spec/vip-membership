"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Pencil, Trash2, Star, Archive, ArchiveRestore,
  Music2, Loader2, CheckCircle2
} from "lucide-react";
import { type Artist } from "@/lib/data";

function statusBadge(artist: Artist) {
  if (artist.isArchived) {
    return <Badge className="bg-white/10 text-white/40 border-white/20 border">Archived</Badge>;
  }
  if (artist.isActive) {
    return <Badge className="bg-gold/20 text-gold border-gold/40 border gap-1"><CheckCircle2 size={11} /> Active</Badge>;
  }
  if (artist.status === "inactive") {
    return <Badge className="bg-white/10 text-white/50 border-white/20 border">Inactive</Badge>;
  }
  return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">Ready</Badge>;
}

export function ArtistsClient({ initialArtists }: { initialArtists: Artist[] }) {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [busy, setBusy] = useState<string | null>(null);

  async function setActive(artist: Artist) {
    setBusy(`active-${artist.id}`);
    try {
      const res = await fetch(`/api/artists/${artist.id}/set-active`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArtists((prev) =>
        prev.map((a) => ({ ...a, isActive: a.id === artist.id, isArchived: a.id === artist.id ? false : a.isArchived }))
      );
      toast.success(`"${artist.name}" is now the active homepage artist.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function toggleArchive(artist: Artist) {
    const nowArchived = !artist.isArchived;
    setBusy(`archive-${artist.id}`);
    try {
      const res = await fetch(`/api/artists/${artist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isArchived: nowArchived,
          status: nowArchived ? "archived" : "active",
          isActive: nowArchived ? false : artist.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArtists((prev) => prev.map((a) => a.id === artist.id ? data.artist : a));
      toast.success(nowArchived ? `"${artist.name}" archived.` : `"${artist.name}" restored.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function deleteArtist(artist: Artist, force = false) {
    setBusy(`delete-${artist.id}`);
    try {
      const url = `/api/artists/${artist.id}${force ? "?force=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (res.status === 409 && data.requiresConfirmation) {
        const msg = [
          `"${artist.name}" has linked data:`,
          data.memberCount > 0 ? `• ${data.memberCount} member(s)` : "",
          data.eventCount > 0 ? `• ${data.eventCount} event(s)` : "",
          "",
          "Deleting will NOT remove those records, but they will lose their artist link. Proceed?",
        ].filter(Boolean).join("\n");
        if (confirm(msg)) {
          setBusy(null);
          await deleteArtist(artist, true);
          return;
        }
        setBusy(null);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Delete failed");
      setArtists((prev) => prev.filter((a) => a.id !== artist.id));
      toast.success(`"${artist.name}" deleted.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {artists.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Music2 size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No artists configured yet.</p>
          <p className="text-sm mt-1">Add your first artist to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className={`bg-white/5 border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors
                ${artist.isActive ? "border-gold/40 bg-gold/[0.04]" : "border-white/10 hover:border-white/20"}`}
            >
              {/* Avatar / Logo */}
              <div className="shrink-0">
                {artist.logoUrl ? (
                  <img src={artist.logoUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-white/10" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl border border-white/10"
                    style={{ backgroundColor: `${artist.primaryColor || "#c9a84c"}22` }}
                  >
                    {artist.name[0]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-playfair text-white font-semibold text-lg">{artist.name}</span>
                  {statusBadge(artist)}
                  {artist.primaryColor && (
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: artist.primaryColor }} title={artist.primaryColor} />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/40">
                  <span className="font-mono">/{artist.slug}</span>
                  {artist.contactEmail && <span>{artist.contactEmail}</span>}
                  {artist.description && <span className="truncate max-w-xs">{artist.description}</span>}
                </div>
              </div>

              {/* Banner preview */}
              {artist.bannerUrl && (
                <div className="hidden lg:block shrink-0">
                  <img src={artist.bannerUrl} alt="banner" className="w-24 h-12 rounded object-cover border border-white/10 opacity-60" />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!artist.isActive && !artist.isArchived && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-gold/30 text-gold hover:bg-gold/10"
                    disabled={!!busy}
                    onClick={() => setActive(artist)}
                  >
                    {busy === `active-${artist.id}` ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />}
                    Set Active
                  </Button>
                )}
                {artist.isActive && (
                  <span className="flex items-center gap-1 text-gold text-xs font-medium px-2">
                    <Star size={13} className="fill-gold" /> Homepage
                  </span>
                )}
                <Link href={`/admin/artists/${artist.id}/edit`}>
                  <Button size="sm" variant="outline" className="gap-1.5 border-white/10 text-white/70 hover:text-white" disabled={!!busy}>
                    <Pencil size={13} /> Edit
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className={`gap-1.5 border-white/10 ${artist.isArchived ? "text-green-400 hover:bg-green-500/10" : "text-amber-400 hover:bg-amber-500/10"}`}
                  disabled={!!busy}
                  onClick={() => toggleArchive(artist)}
                >
                  {busy === `archive-${artist.id}` ? <Loader2 size={13} className="animate-spin" /> : artist.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                  {artist.isArchived ? "Restore" : "Archive"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-white/10 text-red-400 hover:bg-red-500/10"
                  disabled={!!busy || artist.isActive}
                  title={artist.isActive ? "Cannot delete the active homepage artist" : "Delete permanently"}
                  onClick={() => {
                    if (!confirm(`Permanently delete "${artist.name}"? This cannot be undone.`)) return;
                    deleteArtist(artist);
                  }}
                >
                  {busy === `delete-${artist.id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

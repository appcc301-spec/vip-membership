"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { type Artist } from "@/lib/data";
import { ImageUpload } from "@/components/admin/ImageUpload";

export function ArtistEditForm({ artist }: { artist: Artist }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: artist.name,
    slug: artist.slug,
    logoUrl: artist.logoUrl || "",
    bannerUrl: artist.bannerUrl || "",
    description: artist.description || "",
    contactEmail: artist.contactEmail || "",
    primaryColor: artist.primaryColor || "#c9a84c",
    status: artist.status,
    isArchived: artist.isArchived,
    isActive: artist.isActive,
  });

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Artist name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/artists/${artist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update artist");
      toast.success("Artist updated successfully.");
      router.push("/admin/artists");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(force = false) {
    if (!force && !confirm(`Delete artist "${artist.name}"? This cannot be undone.`)) return;
    setDeleting(true);
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
          "Their artist link will be cleared. Proceed?",
        ].filter(Boolean).join("\n");
        setDeleting(false);
        if (confirm(msg)) handleDelete(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to delete artist");
      toast.success("Artist deleted.");
      router.push("/admin/artists");
    } catch (err: any) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Artist Name *</Label>
          <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Brand Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => updateField("primaryColor", e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-white/10 bg-transparent"
            />
            <Input value={form.primaryColor} onChange={(e) => updateField("primaryColor", e.target.value)} className="font-mono" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImageUpload
          label="Logo"
          value={form.logoUrl}
          onChange={(url) => updateField("logoUrl", url)}
          aspectHint="Square recommended"
        />
        <ImageUpload
          label="Banner Image"
          value={form.bannerUrl}
          onChange={(url) => updateField("bannerUrl", url)}
          aspectHint="16:9 or wide format"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={form.status}
          onChange={(e) => updateField("status", e.target.value)}
          className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading || deleting} className="gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/artists")}>
            Cancel
          </Button>
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled={loading || deleting}
          onClick={() => handleDelete()}
          className="gap-2"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete
        </Button>
      </div>
    </form>
  );
}

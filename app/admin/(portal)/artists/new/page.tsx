"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Music2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function NewArtistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    bannerUrl: "",
    description: "",
    contactEmail: "",
    primaryColor: "#c9a84c",
    status: "active" as "active" | "archived",
  });

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !prev.slug) {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Artist name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create artist");
      toast.success(`Artist "${data.artist.name}" created successfully.`);
      router.push("/admin/artists");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Add Artist</h1>
        <p className="text-white/60">Configure a new artist for the platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Artist Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Robert Plant" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} placeholder="e.g. robert-plant" required />
            <p className="text-white/30 text-xs">Auto-generated from name. Used in URLs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} placeholder="team@artist.com" />
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
            placeholder="Brief description of the artist..."
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
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Music2 size={16} />}
            Create Artist
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/artists")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

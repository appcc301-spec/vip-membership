"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type Member, type MembershipTier, type MembershipStatus, type CardTheme, type Artist, MEMBERSHIP_TIERS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, User, Crown, CreditCard, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_THEMES: CardTheme[] = ["gold", "black", "platinum", "diamond", "emerald"];
const THEME_STYLES: Record<CardTheme, string> = {
  gold: "from-[#8a6d2f] via-[#c9a84c] to-[#e8d5a3]",
  black: "from-neutral-900 via-neutral-800 to-neutral-900",
  platinum: "from-[#6b6b6b] via-[#e5e4e2] to-[#a8a8a8]",
  diamond: "from-[#3b8ea5] via-[#b9f2ff] to-[#dff9ff]",
  emerald: "from-[#1e4d2b] via-[#50c878] to-[#8ce6a8]",
};
const VALID_STATUSES: MembershipStatus[] = [
  "pending", "pending-24h", "pending-48h", "active", "dormant", "cancelled", "expired", "suspended",
];

interface Props {
  member: Member;
  artists: Artist[];
}

export function MemberEditForm({ member, artists }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: member.personal.firstName,
    lastName: member.personal.lastName,
    email: member.personal.email,
    phone: member.personal.phone || "",
    country: member.personal.country || "",
    address: member.personal.address || "",
    dateOfBirth: member.personal.dateOfBirth || "",
    profilePhoto: member.personal.profilePhoto || "",
    artistId: member.artistId || "",
    tier: member.membership.tier as MembershipTier,
    status: member.membership.status as MembershipStatus,
    startDate: member.membership.startDate,
    expirationDate: member.membership.expirationDate,
    notes: member.membership.notes || "",
    theme: member.card.theme as CardTheme,
  });

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error("First name, last name and email are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update member");
      toast.success("Member updated successfully.");
      router.push(`/admin/members/${member.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-playfair text-gold-gradient">Edit Member</h1>
          <p className="text-white/50 text-sm">{member.personal.firstName} {member.personal.lastName} · {member.membership.number}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}
            className="border-white/10 text-white/60 hover:text-white">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
            <User size={15} className="text-gold" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={(e) => set("country", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
                  {form.profilePhoto ? (
                    <img src={form.profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-white/20" />
                  )}
                </div>
                <label htmlFor="photoUpload"
                  className="flex items-center gap-2 cursor-pointer border border-white/10 hover:border-gold/40 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm px-4 py-2 rounded-md transition-all">
                  <Upload size={13} /> {form.profilePhoto ? "Change Photo" : "Upload Photo"}
                </label>
                <input id="photoUpload" type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) { toast.error("Photo must be under 2MB"); return; }
                    const reader = new FileReader();
                    reader.onload = (ev) => set("profilePhoto", ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                {form.profilePhoto && (
                  <button type="button" onClick={() => set("profilePhoto", "")}
                    className="text-white/30 hover:text-red-400 text-xs transition-colors">
                    Remove
                  </button>
                )}
              </div>
              <p className="text-white/30 text-xs">JPG, PNG or WebP — max 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
            <Crown size={15} className="text-gold" /> Membership Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {artists.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Artist</Label>
                <select value={form.artistId} onChange={(e) => set("artistId", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50">
                  <option value="">— No Artist —</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Membership Tier</Label>
              <select value={form.tier} onChange={(e) => set("tier", e.target.value as MembershipTier)}
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50">
                {MEMBERSHIP_TIERS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — ${t.price}/year</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => set("status", e.target.value as MembershipStatus)}
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50">
                {VALID_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Input type="date" value={form.expirationDate} onChange={(e) => set("expirationDate", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Internal notes…" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Theme */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
            <CreditCard size={15} className="text-gold" /> VIP Card Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CARD_THEMES.map((theme) => (
              <button key={theme} type="button" onClick={() => set("theme", theme)}
                className={cn(
                  "relative rounded-xl p-4 text-center border-2 transition-all",
                  form.theme === theme ? "border-gold" : "border-white/10 hover:border-white/30"
                )}>
                <div className={cn("h-14 rounded-lg bg-gradient-to-br mb-2", THEME_STYLES[theme])} />
                <p className="text-xs capitalize text-white">{theme}</p>
                {form.theme === theme && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-gold rounded-full flex items-center justify-center">
                    <Save size={9} className="text-black" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer save */}
      <div className="flex justify-end gap-3 pb-8">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}
          className="border-white/10 text-white/60 hover:text-white">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}

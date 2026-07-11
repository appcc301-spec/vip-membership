"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Crown, Loader2, CreditCard, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MEMBERSHIP_TIERS, type CardTheme, type MembershipTier, type MembershipStatus, type Artist } from "@/lib/data";
import { cn } from "@/lib/utils";

const cardThemes: CardTheme[] = ["gold", "black", "platinum", "diamond", "emerald"];

const themeStyles: Record<CardTheme, string> = {
  gold: "from-[#8a6d2f] via-[#c9a84c] to-[#e8d5a3]",
  black: "from-neutral-900 via-neutral-800 to-neutral-900",
  platinum: "from-[#6b6b6b] via-[#e5e4e2] to-[#a8a8a8]",
  diamond: "from-[#3b8ea5] via-[#b9f2ff] to-[#dff9ff]",
  emerald: "from-[#1e4d2b] via-[#50c878] to-[#8ce6a8]",
};

export default function CreateMemberPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    address: "",
    dateOfBirth: "",
    profilePhoto: "",
    artistId: "",
    tier: "gold" as MembershipTier,
    startDate: "",
    expirationDate: "",
    status: "pending" as MembershipStatus,
    notes: "",
    theme: "gold" as CardTheme,
  });

  useEffect(() => {
    if (!form.startDate) {
      updateField("startDate", new Date().toISOString().split("T")[0]);
    }
    fetch("/api/artists")
      .then((r) => r.json())
      .then((d) => { if (d.artists) setArtists(d.artists); })
      .catch(() => {});
  }, []);

  const totalSteps = 4;
  const canProceed =
    step === 1
      ? form.firstName && form.lastName && form.email
      : step === 2
      ? form.startDate && form.expirationDate
      : true;

  async function onCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create member");
      }
      const result = await res.json();
      toast.success(`VIP member created. Welcome email sent to ${form.email}.`);
      router.push(`/admin/members/${result.member.id}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white/60 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-playfair text-gold-gradient">Create New VIP Member</h1>
          <p className="text-white/60 text-sm">This will create the account, membership, and digital VIP card.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const s = i + 1;
          const active = s === step;
          const done = s < step;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border",
                  active
                    ? "bg-gold text-black border-gold"
                    : done
                    ? "bg-gold/20 text-gold border-gold"
                    : "bg-white/5 text-white/40 border-white/10"
                )}
              >
                {done ? <Check size={16} /> : s}
              </div>
              <span className={cn("text-sm hidden sm:inline", active ? "text-white" : "text-white/40")}>
                {s === 1 && "Personal"}
                {s === 2 && "Membership"}
                {s === 3 && "Card Design"}
                {s === 4 && "Review"}
              </span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Crown size={18} className="text-gold" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Profile Photo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
                        {form.profilePhoto ? (
                          <img src={form.profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-white/20" />
                        )}
                      </div>
                      <label
                        htmlFor="profilePhotoUpload"
                        className="flex items-center gap-2 cursor-pointer border border-white/10 hover:border-gold/40 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm px-4 py-2 rounded-md transition-all"
                      >
                        <Upload size={14} />
                        {form.profilePhoto ? "Change Photo" : "Upload Photo"}
                      </label>
                      <input
                        id="profilePhotoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Photo must be under 2MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => updateField("profilePhoto", ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }}
                      />
                      {form.profilePhoto && (
                        <button
                          type="button"
                          onClick={() => updateField("profilePhoto", "")}
                          className="text-white/30 hover:text-red-400 text-xs transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-white/30 text-xs">JPG, PNG or WebP — max 2MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Crown size={18} className="text-gold" />
                  Membership Information
                </h2>
                {artists.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="artistId">Artist</Label>
                    <select
                      id="artistId"
                      value={form.artistId}
                      onChange={(e) => updateField("artistId", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      <option value="">— Select Artist (optional) —</option>
                      {artists.filter((a) => a.status === "active").map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tier">Membership Tier</Label>
                    <select
                      id="tier"
                      value={form.tier}
                      onChange={(e) => updateField("tier", e.target.value as MembershipTier)}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      {MEMBERSHIP_TIERS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — ${t.price}/year
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value as MembershipStatus)}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      <option value="pending">Pending (awaiting payment)</option>
                      <option value="pending-24h">Pending 24h (payment due in 24h)</option>
                      <option value="pending-48h">Pending 48h (payment due in 48h)</option>
                      <option value="active">Active (payment confirmed)</option>
                      <option value="dormant">Dormant</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {(form.status === "pending-24h" || form.status === "pending-48h") && (
                      <p className="text-xs text-orange-300/80 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                        ⏱ A payment deadline will be automatically set ({form.status === "pending-24h" ? "24 hours" : "48 hours"} from now).
                      </p>
                    )}
                    {form.status === "active" && (
                      <p className="text-xs text-green-400/80 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                        ✓ Member will have immediate full dashboard access after setting their password.
                      </p>
                    )}
                    {form.status === "pending" && (
                      <p className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                        Member will see a pending screen. Use the member detail page to activate once payment is confirmed.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input id="startDate" type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Expiration Date *</Label>
                    <Input id="expirationDate" type="date" value={form.expirationDate} onChange={(e) => updateField("expirationDate", e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="notes">Special Notes</Label>
                    <Input id="notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-gold" />
                  VIP Card Design
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {cardThemes.map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updateField("theme", theme)}
                      className={cn(
                        "relative rounded-xl p-4 text-center border-2 transition-all",
                        form.theme === theme ? "border-gold" : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <div className={cn("h-16 rounded-lg bg-gradient-to-br mb-3", themeStyles[theme])} />
                      <p className="text-sm capitalize text-white">{theme}</p>
                      {form.theme === theme && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                          <Check size={12} className="text-black" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Check size={18} className="text-gold" />
                  Review & Create
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                      {form.profilePhoto ? (
                        <img src={form.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold border border-gold/30">
                          {form.firstName?.[0]}{form.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{form.firstName} {form.lastName}</p>
                        <p className="text-white/50">{form.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-white/50">Name</p>
                      <p className="text-white font-medium">
                        {form.firstName} {form.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/50">Email</p>
                      <p className="text-white">{form.email}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Tier</p>
                      <p className="text-white capitalize">{form.tier}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Initial Status</p>
                      <p className="text-white capitalize">{form.status}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Valid Through</p>
                      <p className="text-white">
                        {form.startDate} → {form.expirationDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/50">Card Theme</p>
                      <p className="text-white capitalize">{form.theme}</p>
                    </div>
                  </div>
                  <div className="glassmorphism rounded-2xl p-6 text-center">
                    <p className="text-white/70 text-sm mb-4">
                      On creation, the system will automatically:
                    </p>
                    <ul className="space-y-2 text-sm text-left text-white/80">
                      <li className="flex items-center gap-2"><Check size={14} className="text-gold" /> Create secure login account</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-gold" /> Generate membership number</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-gold" /> Generate digital VIP card</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-gold" /> Generate unique QR code</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-gold" /> Send welcome email</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || loading}>
          <ChevronLeft size={18} /> Back
        </Button>
        {step < totalSteps ? (
          <Button onClick={() => setStep((s) => Math.min(totalSteps, s + 1))} disabled={!canProceed}>
            Next <ChevronRight size={18} />
          </Button>
        ) : (
          <Button onClick={onCreate} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
            {loading ? "Creating..." : "Create VIP Member"}
          </Button>
        )}
      </div>
    </div>
  );
}

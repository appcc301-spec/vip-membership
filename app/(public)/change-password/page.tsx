"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = newPassword.length === 0 ? 0 : newPassword.length < 8 ? 1 : newPassword.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Too short", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-400", "bg-green-500"][strength];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/members/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }
      toast.success("Password updated successfully. Welcome!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-rich-black px-4">
      <div className="w-full max-w-md glassmorphism p-8 rounded-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="text-gold" size={26} />
          </div>
          <h1 className="text-2xl font-playfair text-gold-gradient">Set Your Password</h1>
          <p className="text-white/60 text-sm mt-2">
            You logged in with a temporary password.<br />Please set a new secure password to continue.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${strength >= level ? strengthColor : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strength === 1 ? "text-red-400" : strength === 2 ? "text-yellow-400" : "text-green-400"}`}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirm.length > 0 && newPassword !== confirm && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
            {confirm.length > 0 && newPassword === confirm && newPassword.length >= 8 && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <ShieldCheck size={12} /> Passwords match
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || newPassword !== confirm || newPassword.length < 8}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={16} />}
            {loading ? "Saving..." : "Set New Password"}
          </Button>
        </form>

        <div className="mt-5 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-white/40 text-center">
            Your password is encrypted and never stored in plain text.
          </p>
        </div>
      </div>
    </div>
  );
}

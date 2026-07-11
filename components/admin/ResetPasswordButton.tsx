"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Loader2, Copy, Eye, EyeOff } from "lucide-react";

interface ResetPasswordButtonProps {
  memberId: string;
}

export function ResetPasswordButton({ memberId }: ResetPasswordButtonProps) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  async function handleReset() {
    if (!confirm("Reset this member's password? They will need to use the new temporary password on next login.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setNewPassword(data.temporaryPassword);
      setRevealed(true);
      toast.success("Password reset. Share the new temporary password with the member.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        variant="outline"
        onClick={handleReset}
        disabled={loading}
        className="gap-2 border-gold/30 text-gold hover:bg-gold/10"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
        Reset Password
      </Button>

      {newPassword && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 space-y-2">
          <p className="text-yellow-400 text-xs font-medium">New Temporary Password — share with member</p>
          <div className="flex items-center gap-2">
            <code className="text-white font-mono text-base tracking-widest select-all flex-1">
              {revealed ? newPassword : "•".repeat(newPassword.length)}
            </code>
            <button onClick={() => setRevealed((v) => !v)} className="text-white/50 hover:text-white p-1">
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={copyToClipboard} className="text-white/50 hover:text-gold p-1">
              <Copy size={14} />
            </button>
          </div>
          <p className="text-white/40 text-xs">Member will be prompted to change this on next login.</p>
        </div>
      )}
    </div>
  );
}

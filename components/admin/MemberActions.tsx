"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Member, type MembershipStatus } from "@/lib/data";
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, Loader2, History } from "lucide-react";

interface MemberActionsProps {
  member: Member;
}

const STATUS_CONFIG: Record<MembershipStatus, { label: string; color: string; variant: "success" | "destructive" | "warning" | "secondary" | "outline" }> = {
  active:       { label: "Active",          color: "text-green-400",  variant: "success" },
  pending:      { label: "Pending",         color: "text-yellow-400", variant: "warning" },
  "pending-24h":{ label: "Pending 24h",    color: "text-orange-400", variant: "warning" },
  "pending-48h":{ label: "Pending 48h",    color: "text-orange-400", variant: "warning" },
  dormant:      { label: "Dormant",         color: "text-red-400",    variant: "destructive" },
  cancelled:    { label: "Cancelled",       color: "text-red-500",    variant: "destructive" },
  expired:      { label: "Expired",         color: "text-white/50",   variant: "secondary" },
  suspended:    { label: "Suspended",       color: "text-white/50",   variant: "outline" },
};

export function MemberActions({ member }: MemberActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const status = member.membership.status;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  async function updateStatus(newStatus: MembershipStatus, note?: string) {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update status");
      }
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label ?? newStatus}.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function renewMembership() {
    setLoading("renew");
    try {
      const current = new Date(member.membership.expirationDate);
      const next = new Date(current.setFullYear(current.getFullYear() + 1));
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expirationDate: next.toISOString().split("T")[0], status: "active", note: "Renewed +1 year" }),
      });
      if (!res.ok) throw new Error("Failed to renew membership");
      toast.success("Membership renewed and activated.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function deleteMember() {
    if (!confirm("Are you sure you want to delete this member? This cannot be undone.")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete member");
      toast.success("Member deleted.");
      router.push("/admin/members");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  const history = member.membership.statusHistory ?? [];
  const pendingExpiresAt = member.membership.pendingExpiresAt
    ? new Date(member.membership.pendingExpiresAt)
    : null;

  // All time-dependent values computed client-side only to avoid hydration mismatch
  const msLeft = mounted && pendingExpiresAt ? pendingExpiresAt.getTime() - Date.now() : 0;
  const hoursLeft = msLeft > 0 ? Math.floor(msLeft / 3600000) : 0;
  const minutesLeft = msLeft > 0 ? Math.floor((msLeft % 3600000) / 60000) : 0;
  const pendingExpiredOnClient = mounted && pendingExpiresAt && msLeft <= 0;
  const pendingActiveOnClient = mounted && pendingExpiresAt && msLeft > 0;

  // Format dates in a locale-neutral way to avoid server/client mismatch
  function formatDateTime(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  return (
    <div className="space-y-4">
      {/* Status + expiry banner */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          className={`capitalize text-sm px-3 py-1 ${
            status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" :
            status === "dormant" || status === "cancelled" ? "bg-red-500/20 text-red-400 border-red-500/30" :
            status === "pending" || status === "pending-24h" || status === "pending-48h" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
            "bg-white/10 text-white/50 border-white/20"
          } border`}
        >
          {cfg.label}
        </Badge>
        {pendingActiveOnClient && (
          <span className="flex items-center gap-1.5 text-orange-300 text-sm bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
            <Clock size={13} />
            Expires in {hoursLeft}h {minutesLeft}m &nbsp;·&nbsp; {formatDateTime(pendingExpiresAt!)}
          </span>
        )}
        {pendingExpiredOnClient && (
          <span className="flex items-center gap-1.5 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
            <XCircle size={13} /> Pending period expired
          </span>
        )}
        {member.membership.dormantAt && mounted && (
          <span className="text-white/40 text-xs">
            Dormant since {formatDateTime(new Date(member.membership.dormantAt))}
          </span>
        )}
      </div>

      {/* Primary action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Activate — always available unless already active */}
        {status !== "active" && (
          <Button size="sm" onClick={() => updateStatus("active", "Manually activated by admin")} disabled={!!loading} className="gap-1.5">
            {loading === "active" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Activate
          </Button>
        )}

        {/* Pending timers — only if not already in those states */}
        {status !== "pending-24h" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus("pending-24h", "Admin set 24h pending")} disabled={!!loading} className="gap-1.5 border-orange-500/30 text-orange-300 hover:bg-orange-500/10">
            {loading === "pending-24h" ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
            Pending 24h
          </Button>
        )}
        {status !== "pending-48h" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus("pending-48h", "Admin set 48h pending")} disabled={!!loading} className="gap-1.5 border-orange-500/30 text-orange-300 hover:bg-orange-500/10">
            {loading === "pending-48h" ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
            Pending 48h
          </Button>
        )}

        {/* Dormant */}
        {status !== "dormant" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus("dormant", "Manually set to dormant by admin")} disabled={!!loading} className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10">
            {loading === "dormant" ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            Set Dormant
          </Button>
        )}

        {/* Cancel */}
        {status !== "cancelled" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus("cancelled", "Cancelled by admin")} disabled={!!loading} className="gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10">
            {loading === "cancelled" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Cancel
          </Button>
        )}

        {/* Renew */}
        <Button size="sm" variant="secondary" onClick={renewMembership} disabled={!!loading} className="gap-1.5">
          {loading === "renew" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          Renew +1 Year
        </Button>

        {/* History toggle */}
        {history.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowHistory((v) => !v)} className="gap-1.5 text-white/50">
            <History size={14} /> {showHistory ? "Hide" : "Show"} History
          </Button>
        )}

        {/* Delete */}
        <Button size="sm" variant="destructive" onClick={deleteMember} disabled={!!loading} className="ml-auto">
          {loading === "delete" ? <Loader2 size={14} className="animate-spin" /> : null}
          Delete
        </Button>
      </div>

      {/* Status history */}
      {showHistory && history.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/70 text-sm font-medium flex items-center gap-2">
              <History size={13} /> Status History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="flex items-start justify-between text-xs border-b border-white/5 pb-2 last:border-0">
                <div className="space-y-0.5">
                  <span className={`font-medium capitalize ${STATUS_CONFIG[entry.status]?.color ?? "text-white"}`}>
                    {STATUS_CONFIG[entry.status]?.label ?? entry.status}
                  </span>
                  {entry.note && <p className="text-white/40">{entry.note}</p>}
                </div>
                <div className="text-right text-white/30 shrink-0 ml-4">
                  <p suppressHydrationWarning>{formatDateTime(new Date(entry.changedAt))}</p>
                  <p className="capitalize">{entry.changedBy}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

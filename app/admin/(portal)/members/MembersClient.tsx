"use client";

import { useState, useMemo } from "react";
import { type Member, type MembershipStatus } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, ChevronRight, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS: { value: MembershipStatus | "all"; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "active",      label: "Active" },
  { value: "pending",     label: "Pending" },
  { value: "pending-24h", label: "Pending 24h" },
  { value: "pending-48h", label: "Pending 48h" },
  { value: "dormant",     label: "Dormant" },
  { value: "cancelled",   label: "Cancelled" },
  { value: "expired",     label: "Expired" },
  { value: "suspended",   label: "Suspended" },
];

function statusBadgeClass(status: MembershipStatus): string {
  if (status === "active") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (status === "dormant" || status === "cancelled") return "bg-red-500/20 text-red-400 border-red-500/30";
  if (status === "pending" || status === "pending-24h" || status === "pending-48h")
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-white/10 text-white/50 border-white/20";
}

function statusLabel(status: MembershipStatus): string {
  if (status === "pending-24h") return "Pending 24h";
  if (status === "pending-48h") return "Pending 48h";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface Props {
  members: Member[];
}

export function MembersClient({ members }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<MembershipStatus | "all">("all");

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        `${m.personal.firstName} ${m.personal.lastName}`.toLowerCase().includes(q) ||
        m.personal.email.toLowerCase().includes(q) ||
        m.membership.number.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || m.membership.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [members, search, filterStatus]);

  const counts = useMemo(() => {
    const c: Partial<Record<MembershipStatus, number>> = {};
    for (const m of members) {
      c[m.membership.status] = (c[m.membership.status] ?? 0) + 1;
    }
    return c;
  }, [members]);

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="space-y-3">
        {/* Search */}
        <div className="flex items-center gap-3">
          <Search className="text-white/40 shrink-0" size={18} />
          <Input
            placeholder="Search by name, email or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const count = opt.value === "all" ? members.length : (counts[opt.value as MembershipStatus] ?? 0);
            const active = filterStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-gold/20 text-gold border-gold/40"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30 hover:text-white/80"
                }`}
              >
                {opt.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-gold/30" : "bg-white/10"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-white/5">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-white/30 text-sm">No members found</p>
          )}
          {filtered.map((member) => {
            const pendingExp = member.membership.pendingExpiresAt ? new Date(member.membership.pendingExpiresAt) : null;
            const msLeft = pendingExp ? pendingExp.getTime() - Date.now() : 0;
            const hoursLeft = msLeft > 0 ? Math.floor(msLeft / 3600000) : 0;
            const minutesLeft = msLeft > 0 ? Math.floor((msLeft % 3600000) / 60000) : 0;
            return (
              <Link key={member.id} href={`/admin/members/${member.id}`} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
                {member.personal.profilePhoto ? (
                  <img src={member.personal.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold border border-gold/30 shrink-0">
                    {member.personal.firstName[0]}{member.personal.lastName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{member.personal.firstName} {member.personal.lastName}</p>
                  <p className="text-white/50 text-xs truncate">{member.personal.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`capitalize text-[10px] border px-1.5 py-0 ${statusBadgeClass(member.membership.status)}`}>
                      {statusLabel(member.membership.status)}
                    </Badge>
                    <span className="text-white/40 text-[10px] capitalize">{member.membership.tier}</span>
                    {pendingExp && (
                      <span className={`flex items-center gap-0.5 text-[10px] ${msLeft > 0 ? "text-orange-300" : "text-red-400"}`}>
                        <Clock size={9} />{msLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : "Exp"}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20 shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 border-b border-white/10">
                <th className="text-left py-3 font-medium">Name</th>
                <th className="text-left py-3 font-medium">Email</th>
                <th className="text-left py-3 font-medium">Tier</th>
                <th className="text-left py-3 font-medium">Number</th>
                <th className="text-left py-3 font-medium">Status</th>
                <th className="text-left py-3 font-medium">Pending Expires</th>
                <th className="text-left py-3 font-medium">Membership Expires</th>
                <th className="py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/30">No members found</td>
                </tr>
              )}
              {filtered.map((member) => {
                const pendingExp = member.membership.pendingExpiresAt ? new Date(member.membership.pendingExpiresAt) : null;
                const msLeft = pendingExp ? pendingExp.getTime() - Date.now() : 0;
                const hoursLeft = msLeft > 0 ? Math.floor(msLeft / 3600000) : 0;
                const minutesLeft = msLeft > 0 ? Math.floor((msLeft % 3600000) / 60000) : 0;
                return (
                  <tr key={member.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer group">
                    <td className="py-3">
                      <Link href={`/admin/members/${member.id}`} className="flex items-center gap-2 text-white group-hover:text-gold transition-colors">
                        {member.personal.profilePhoto ? (
                          <img src={member.personal.profilePhoto} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold border border-gold/30">
                            {member.personal.firstName[0]}{member.personal.lastName[0]}
                          </div>
                        )}
                        {member.personal.firstName} {member.personal.lastName}
                      </Link>
                    </td>
                    <td className="py-3 text-white/70"><Link href={`/admin/members/${member.id}`} className="block">{member.personal.email}</Link></td>
                    <td className="py-3 text-white/80 capitalize"><Link href={`/admin/members/${member.id}`} className="block">{member.membership.tier}</Link></td>
                    <td className="py-3 text-white/80 font-mono text-xs"><Link href={`/admin/members/${member.id}`} className="block">{member.membership.number}</Link></td>
                    <td className="py-3">
                      <Link href={`/admin/members/${member.id}`} className="block">
                        <Badge className={`capitalize text-xs border ${statusBadgeClass(member.membership.status)}`}>{statusLabel(member.membership.status)}</Badge>
                      </Link>
                    </td>
                    <td className="py-3 text-xs">
                      {pendingExp ? (
                        <span className={`flex items-center gap-1 ${msLeft > 0 ? "text-orange-300" : "text-red-400"}`}>
                          <Clock size={11} />{msLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : "Expired"}
                        </span>
                      ) : <span className="text-white/20">—</span>}
                    </td>
                    <td className="py-3 text-white/60 text-xs"><Link href={`/admin/members/${member.id}`} className="block">{member.membership.expirationDate}</Link></td>
                    <td className="py-3">
                      <Link href={`/admin/members/${member.id}`} className="text-white/20 group-hover:text-gold/60 transition-colors">
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

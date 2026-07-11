import { notFound } from "next/navigation";
import Link from "next/link";
import { getMemberById } from "@/lib/members";
import { VIPCard } from "@/components/VIPCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberActions } from "@/components/admin/MemberActions";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import { formatDate } from "@/lib/utils";
import { Mail, Phone, MapPin, Calendar, Key, User, ShieldCheck, ShieldAlert, Pencil } from "lucide-react";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd} ${hh}:${min}`;
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) return notFound();

  const hasChangedPassword = !member.credentials.temporaryPassword;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {member.personal.profilePhoto ? (
          <img
            src={member.personal.profilePhoto}
            alt=""
            className="w-14 h-14 rounded-full object-cover border-2 border-gold/30"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center text-gold font-bold text-lg">
            {member.personal.firstName[0]}{member.personal.lastName[0]}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-playfair text-gold-gradient">
            {member.personal.firstName} {member.personal.lastName}
          </h1>
          <p className="text-white/60 text-sm">{member.personal.email} · <span className="capitalize">{member.membership.tier}</span> · {member.membership.number}</p>
        </div>
        <Link href={`/admin/members/${member.id}/edit`}>
          <Button variant="outline" className="gap-2 border-white/10 text-white/70 hover:text-white hover:border-gold/40">
            <Pencil size={14} /> Edit Member
          </Button>
        </Link>
      </div>

      <MemberActions member={member} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <VIPCard member={member} />
        <div className="space-y-4">
          {/* Personal Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
                <User size={15} className="text-gold" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-white/80">
                <Mail size={14} className="text-gold shrink-0" /> {member.personal.email}
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Phone size={14} className="text-gold shrink-0" /> {member.personal.phone || "—"}
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <MapPin size={14} className="text-gold shrink-0" />
                {[member.personal.address, member.personal.country].filter(Boolean).join(", ") || "—"}
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Calendar size={14} className="text-gold shrink-0" /> {formatDate(member.personal.dateOfBirth) || "—"}
              </div>
            </CardContent>
          </Card>

          {/* Account & Credentials */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
                <Key size={15} className="text-gold" /> Account & Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/50">Username</span>
                <span className="text-white font-mono">{member.credentials.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Password Status</span>
                {hasChangedPassword ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck size={11} /> Password Set
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <ShieldAlert size={11} /> Using Temp Password
                  </Badge>
                )}
              </div>
              {member.credentials.temporaryPassword && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">{hasChangedPassword ? "Last Reset Password" : "Temp Password"}</span>
                  <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded text-xs border border-white/10 tracking-wider">
                    {member.credentials.temporaryPassword}
                  </span>
                </div>
              )}
              {member.credentials.passwordUpdatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Password Updated</span>
                  <span className="text-white/70 text-xs">{fmtDateTime(member.credentials.passwordUpdatedAt)}</span>
                </div>
              )}
              {!hasChangedPassword && (
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 space-y-1">
                  <p className="text-yellow-400 text-xs font-medium flex items-center gap-1">
                    <ShieldAlert size={11} /> Awaiting First Login
                  </p>
                  <p className="text-white/40 text-xs">Member has not yet changed their temporary password.</p>
                </div>
              )}
              <div className="pt-1 border-t border-white/5">
                <ResetPasswordButton memberId={member.id} />
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-white/50">Member Since</span>
                <span className="text-white/70">{formatDate(member.membership.startDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Expires</span>
                <span className="text-white/70">{formatDate(member.membership.expirationDate)}</span>
              </div>
              {member.membership.notes && (
                <div className="flex items-start justify-between pt-1 border-t border-white/5">
                  <span className="text-white/50 shrink-0">Notes</span>
                  <span className="text-white/70 text-right max-w-[60%]">{member.membership.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

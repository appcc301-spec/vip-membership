import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { seedDatabase, getMemberById } from "@/lib/members";
import { processExpiredPendingMembers } from "@/lib/expiry";
import { MemberSidebar } from "@/components/member/MemberSidebar";
import { Crown, AlertTriangle } from "lucide-react";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd} ${hh}:${min}`;
}

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await seedDatabase();
  await processExpiredPendingMembers();
  const session = await getSession();
  if (!session || session.role !== "member") {
    redirect("/login");
  }

  const member = await getMemberById(session.id);
  const status = member?.membership.status;
  const isBlocked = status === "dormant" || status === "cancelled";
  const isPending = status === "pending" || status === "pending-24h" || status === "pending-48h";

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-rich-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-400" size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-playfair text-white mb-2">Membership Cancelled</h1>
            <p className="text-white/60 leading-relaxed">
              Membership cancelled. For reactivation, please contact support.
            </p>
          </div>
          <div className="glassmorphism rounded-xl p-4 text-sm text-white/50">
            <p>Member: {session.name}</p>
            <p>Status: <span className="text-red-400 capitalize">{status}</span></p>
          </div>
          <a
            href="/support"
            className="inline-block px-6 py-3 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors text-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  const tier = member?.membership.tier ?? "gold";
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="min-h-screen bg-rich-black text-white">
      <MemberSidebar name={session.name} tier={tierLabel} />
      <div className="lg:ml-64 min-h-screen pb-16 lg:pb-0">
        {isPending && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3 flex items-center gap-3">
            <Crown size={16} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-300 text-sm leading-snug">
              {status === "pending" && "Your membership is pending payment confirmation. You will receive full access once activated."}
              {status === "pending-24h" && member?.membership.pendingExpiresAt && (
                `Payment required within 24 hours (by ${fmtDate(member.membership.pendingExpiresAt)}).`
              )}
              {status === "pending-48h" && member?.membership.pendingExpiresAt && (
                `Payment required within 48 hours (by ${fmtDate(member.membership.pendingExpiresAt)}).`
              )}
            </p>
          </div>
        )}
        <main className="p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

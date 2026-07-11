import { getMembers } from "@/lib/members";
import { Badge } from "@/components/ui/badge";
import { VIPCard } from "@/components/VIPCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function CardsPage() {
  const members = await getMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">VIP Cards</h1>
        <p className="text-white/60">Manage, replace, and reissue digital membership cards.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/admin/members/${member.id}`}
            className="block space-y-3 group rounded-2xl p-4 border border-white/5 hover:border-gold/30 hover:bg-white/[0.02] transition-all"
          >
            <VIPCard member={member} />
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-white font-medium group-hover:text-gold transition-colors">
                  {member.personal.firstName} {member.personal.lastName}
                </p>
                <p className="text-white/50 text-sm font-mono">{member.membership.number}</p>
                <p className="text-white/40 text-xs mt-0.5 capitalize">{member.membership.tier} · {member.personal.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={member.card.status === "active" ? "success" : "destructive"}
                  className="capitalize"
                >
                  {member.card.status}
                </Badge>
                <ChevronRight size={16} className="text-white/20 group-hover:text-gold/60 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

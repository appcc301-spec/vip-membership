import { getMemberById } from "@/lib/members";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { MEMBERSHIP_TIERS } from "@/lib/data";
import { Crown, Calendar, Check } from "lucide-react";

export default async function MemberMembershipPage() {
  const session = await getSession();
  const member = await getMemberById(session?.id || "");
  if (!member) return null;

  const tier = MEMBERSHIP_TIERS.find((t) => t.id === member.membership.tier);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">My Membership</h1>
        <p className="text-white/60">View tier status, renewal, and history.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair flex items-center gap-2">
              <Crown size={20} className="text-gold" /> {tier?.name} Membership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Membership Number</span>
              <span className="text-white font-mono">{member.membership.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Status</span>
              <Badge variant={member.membership.status === "active" ? "success" : "destructive"} className="capitalize">
                {member.membership.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Join Date</span>
              <span className="text-white">{formatDate(member.membership.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Renewal Date</span>
              <span className="text-white">{formatDate(member.membership.expirationDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Price</span>
              <span className="text-white">{formatCurrency(tier?.price || 0)} / year</span>
            </div>
            <div className="pt-4 flex gap-3">
              <Button>Renew Membership</Button>
              <Button variant="outline">Upgrade Tier</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair text-base">Included Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tier?.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <Check size={16} className="text-gold mt-0.5" />
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

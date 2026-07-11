import { getAnalytics, getMembers } from "@/lib/members";
import { MEMBERSHIP_TIERS } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Users, CreditCard, Mail, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const analytics = await getAnalytics();
  const members = (await getMembers()).slice(0, 5);

  const stats = [
    { label: "Total Members", value: analytics.totalMembers, icon: Users, trend: "+0%" },
    { label: "Active Members", value: analytics.activeMembers, icon: CreditCard, trend: "+0%" },
    { label: "Revenue", value: formatCurrency(analytics.revenue), icon: TrendingUp, trend: "+0%" },
    { label: "Email Deliveries", value: analytics.emailDeliveries, icon: Mail, trend: "+0%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Dashboard</h1>
        <p className="text-white/60">Control center for the VIP membership platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/60">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <Icon className="text-gold" size={20} />
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-4">{stat.trend} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair">Recent Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/50 border-b border-white/10">
                    <th className="text-left py-3 font-medium">Member</th>
                    <th className="text-left py-3 font-medium">Tier</th>
                    <th className="text-left py-3 font-medium">Status</th>
                    <th className="text-left py-3 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-white">
                        {member.personal.firstName} {member.personal.lastName}
                      </td>
                      <td className="py-3 text-white/80 capitalize">{member.membership.tier}</td>
                      <td className="py-3">
                        <Badge
                          variant={member.membership.status === "active" ? "success" : "destructive"}
                          className="capitalize"
                        >
                          {member.membership.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-white/60">{member.membership.expirationDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Link href="/admin/members" className="text-sm text-gold hover:underline">
                View all members
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/members/new">
              <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                <p className="text-white font-medium">Create New Member</p>
                <p className="text-xs text-white/50 mt-1">Add a VIP member and generate their card.</p>
              </div>
            </Link>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-white/80">
                <AlertCircle size={16} className="text-gold" />
                <p className="text-sm font-medium">Upcoming Renewals</p>
              </div>
              <p className="text-2xl font-semibold text-white mt-2">{analytics.upcomingRenewals}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

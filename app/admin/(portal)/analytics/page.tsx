import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics } from "@/lib/members";
import { formatCurrency } from "@/lib/utils";
import { Users, CreditCard, Mail, TrendingUp, QrCode, RefreshCcw } from "lucide-react";
import { AnalyticsChart } from "@/components/admin/AnalyticsChart";

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  const stats = [
    { label: "Total Members", value: analytics.totalMembers, icon: Users },
    { label: "Active Members", value: analytics.activeMembers, icon: CreditCard },
    { label: "Revenue", value: formatCurrency(analytics.revenue), icon: TrendingUp },
    { label: "Email Deliveries", value: analytics.emailDeliveries, icon: Mail },
    { label: "QR Scans", value: analytics.qrScans, icon: QrCode },
    { label: "Renewals", value: analytics.upcomingRenewals, icon: RefreshCcw },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Analytics</h1>
        <p className="text-white/60">Membership growth, revenue, and engagement metrics.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              </CardContent>
            </Card>
          );
        })}
      </div>
      <AnalyticsChart />
    </div>
  );
}

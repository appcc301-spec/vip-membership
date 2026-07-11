import { MEMBERSHIP_TIERS } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function MembershipPage() {
  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-playfair text-gold-gradient mb-4">
            Membership Tiers
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Memberships are invitation-only. Learn about the tiers available to approved VIP members.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MEMBERSHIP_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className="border-white/10 bg-white/5 hover:border-gold/30 transition-colors"
            >
              <CardHeader>
                <CardTitle className="font-playfair text-2xl" style={{ color: tier.color }}>
                  {tier.name}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-semibold text-white">${tier.price}</span>
                  <span className="text-white/50"> / year</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                      <Check size={16} className="text-gold mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

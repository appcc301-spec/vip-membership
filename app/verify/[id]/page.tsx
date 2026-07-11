import { notFound } from "next/navigation";
import { getMembers, seedDatabase } from "@/lib/members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  await seedDatabase();
  const { id } = await params;
  const members = await getMembers();
  const member = members.find((m) => m.membership.number === id || m.card.id === id);
  if (!member) return notFound();

  return (
    <div className="min-h-screen flex items-center justify-center bg-rich-black px-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-gold" size={32} />
          </div>
          <CardTitle className="text-2xl font-playfair text-gold-gradient">Verified VIP Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-xl text-white font-medium">
            {member.personal.firstName} {member.personal.lastName}
          </p>
          <div className="space-y-2 text-sm text-white/70">
            <p>
              Tier: <span className="text-white capitalize font-medium">{member.membership.tier}</span>
            </p>
            <p>
              Status:{" "}
              <Badge
                variant={member.membership.status === "active" ? "success" : "destructive"}
                className="capitalize"
              >
                {member.membership.status}
              </Badge>
            </p>
            <p>
              Expires: <span className="text-white">{member.membership.expirationDate}</span>
            </p>
            <p className="font-mono text-white/50">{member.membership.number}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

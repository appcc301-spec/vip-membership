import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MemberSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Support</h1>
        <p className="text-white/60">Create a support ticket or browse the FAQ.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair">Create Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="How can we help?" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea
                rows={5}
                placeholder="Describe your issue..."
                className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
            <Button>Submit Ticket</Button>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair">Quick FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/70">
            <p><span className="text-gold">Q:</span> How do I download my card?</p>
            <p className="text-white/50">A: Visit the My Card page and click Download Image or PDF.</p>
            <p><span className="text-gold">Q:</span> Can I change my membership tier?</p>
            <p className="text-white/50">A: Tier changes are managed by the administrator team.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

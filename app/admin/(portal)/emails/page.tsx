import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Send, Sparkles, Ticket } from "lucide-react";

const templates = [
  { title: "Welcome Email", icon: Sparkles, desc: "Sent automatically when a member is created." },
  { title: "Renewal Reminder", icon: Mail, desc: "Notify members before their membership expires." },
  { title: "Newsletter", icon: Send, desc: "Latest news and announcements." },
  { title: "Event Invitation", icon: Ticket, desc: "Invite members to upcoming VIP events." },
];

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair text-gold-gradient">Emails</h1>
          <p className="text-white/60">Manage email campaigns and member communications.</p>
        </div>
        <Button>Compose Email</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template, i) => {
          const Icon = template.icon;
          return (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-playfair text-base flex items-center gap-2">
                  <Icon size={18} className="text-gold" /> {template.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60">{template.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

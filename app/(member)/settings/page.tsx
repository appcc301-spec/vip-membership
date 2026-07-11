import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MemberSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Settings</h1>
        <p className="text-white/60">Notification, privacy, and language preferences.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Email updates", "Event reminders", "New content alerts", "Renewal notices"].map((label) => (
              <label key={label} className="flex items-center justify-between text-sm text-white/80">
                {label}
                <input type="checkbox" defaultChecked className="accent-gold" />
              </label>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-playfair">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between text-sm text-white/80">
              Show profile photo
              <input type="checkbox" defaultChecked className="accent-gold" />
            </label>
            <label className="flex items-center justify-between text-sm text-white/80">
              Receive newsletter
              <input type="checkbox" defaultChecked className="accent-gold" />
            </label>
            <Button className="mt-4">Save Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

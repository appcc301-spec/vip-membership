import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Platform Settings</h1>
        <p className="text-white/60">Configure platform name, branding, and defaults.</p>
      </div>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-playfair">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input id="platformName" defaultValue="Robert Plant VIP" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input id="supportEmail" defaultValue="support@robertplant-vip.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultTier">Default Tier</Label>
            <Input id="defaultTier" defaultValue="Gold" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}

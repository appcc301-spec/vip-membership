import { getMemberById } from "@/lib/members";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function MemberProfilePage() {
  const session = await getSession();
  const member = await getMemberById(session?.id || "");
  if (!member) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Profile</h1>
        <p className="text-white/60">Update personal information and password.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-white/5 border-white/10 text-center p-6">
            <img
              src={member.personal.profilePhoto}
              alt={member.personal.firstName}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-gold"
            />
            <p className="text-white font-medium text-lg">
              {member.personal.firstName} {member.personal.lastName}
            </p>
            <p className="text-white/60 text-sm">{member.personal.email}</p>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white font-playfair">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input defaultValue={member.personal.firstName} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input defaultValue={member.personal.lastName} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input defaultValue={member.personal.phone} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input defaultValue={member.personal.address} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input defaultValue={member.personal.country} />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

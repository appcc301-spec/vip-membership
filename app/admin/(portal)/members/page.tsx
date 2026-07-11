import { getMembers } from "@/lib/members";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-playfair text-gold-gradient">Members</h1>
          <p className="text-white/60 text-sm">Manage VIP members and their memberships.</p>
        </div>
        <Link href="/admin/members/new" className="sm:shrink-0">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus size={18} />
            Create Member
          </Button>
        </Link>
      </div>

      <MembersClient members={members} />
    </div>
  );
}

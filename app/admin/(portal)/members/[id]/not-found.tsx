import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserX, ArrowLeft } from "lucide-react";

export default function MemberNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <UserX size={28} className="text-white/30" />
      </div>
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient mb-2">Member Not Found</h1>
        <p className="text-white/50 text-sm max-w-sm">
          This member does not exist or may have been deleted. Please return to the members list.
        </p>
      </div>
      <Link href="/admin/members">
        <Button variant="outline" className="gap-2 border-white/10 text-white/70 hover:text-white">
          <ArrowLeft size={16} /> Back to Members
        </Button>
      </Link>
    </div>
  );
}

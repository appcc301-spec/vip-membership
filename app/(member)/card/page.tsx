import { getMemberById } from "@/lib/members";
import { getSession } from "@/lib/auth";
import { MemberCardView } from "@/components/member/MemberCardView";

export default async function MemberCardPage() {
  const session = await getSession();
  const member = await getMemberById(session?.id || "");
  if (!member) return null;

  return <MemberCardView member={member} />;
}

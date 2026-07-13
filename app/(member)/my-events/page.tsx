import { getSession } from "@/lib/auth";
import { getMemberById } from "@/lib/members";
import { getMemberEvents, getMemberRsvps } from "@/lib/events-data";
import { MemberEventsView } from "@/components/member/MemberEventsView";

export const dynamic = "force-dynamic";

export default async function MemberEventsPage() {
  const session = await getSession();
  const member = session?.id ? await getMemberById(session.id) : null;
  const [events, initialRsvps] = await Promise.all([
    getMemberEvents(member?.artistId),
    session?.id ? getMemberRsvps(session.id) : Promise.resolve({}),
  ]);

  return <MemberEventsView events={events} memberId={session?.id || ""} initialRsvps={initialRsvps} />;
}

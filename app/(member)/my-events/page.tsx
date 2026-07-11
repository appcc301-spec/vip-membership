import { getSession } from "@/lib/auth";
import { getMemberEvents, getMemberRsvps } from "@/lib/events-data";
import { MemberEventsView } from "@/components/member/MemberEventsView";

export const dynamic = "force-dynamic";

export default async function MemberEventsPage() {
  const session = await getSession();
  const [events, initialRsvps] = await Promise.all([
    getMemberEvents(),
    session?.id ? getMemberRsvps(session.id) : Promise.resolve({}),
  ]);

  return <MemberEventsView events={events} memberId={session?.id || ""} initialRsvps={initialRsvps} />;
}

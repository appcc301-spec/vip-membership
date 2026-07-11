import { getAllRsvpSummaries } from "@/lib/events-data";
import { AdminRsvpView } from "@/components/admin/AdminRsvpView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RsvpPage() {
  const summaries = await getAllRsvpSummaries();
  return <AdminRsvpView summaries={summaries} />;
}

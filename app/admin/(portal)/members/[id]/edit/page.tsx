import { notFound } from "next/navigation";
import { getMemberById, getArtists } from "@/lib/members";
import { MemberEditForm } from "./MemberEditForm";

export default async function MemberEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [member, artists] = await Promise.all([getMemberById(id), getArtists()]);
  if (!member) return notFound();

  return <MemberEditForm member={member} artists={artists} />;
}

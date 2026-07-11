import { notFound } from "next/navigation";
import { getArtistById } from "@/lib/members";
import { ArtistEditForm } from "./ArtistEditForm";

export default async function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistById(id);
  if (!artist) return notFound();
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-gold-gradient">Edit Artist</h1>
        <p className="text-white/60">Update artist profile and branding settings.</p>
      </div>
      <ArtistEditForm artist={artist} />
    </div>
  );
}

import Link from "next/link";
import { getArtists } from "@/lib/members";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ArtistsClient } from "./ArtistsClient";

export default async function ArtistsPage() {
  const artists = await getArtists();
  const active = artists.find((a) => a.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair text-gold-gradient">Artists</h1>
          <p className="text-white/60">
            {active
              ? <>Homepage is showing <span className="text-gold font-medium">{active.name}</span>.</>
              : "No active homepage artist set. Select one below."}
          </p>
        </div>
        <Link href="/admin/artists/new">
          <Button className="gap-2">
            <Plus size={18} /> Add Artist
          </Button>
        </Link>
      </div>

      <ArtistsClient initialArtists={artists} />
    </div>
  );
}

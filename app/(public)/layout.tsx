import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getPrimaryArtist, DEFAULT_ARTIST_NAME } from "@/lib/platform";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const artist = await getPrimaryArtist();
  const name = artist?.name || DEFAULT_ARTIST_NAME;
  return {
    title: { default: `${name} VIP Membership`, template: `%s | ${name} VIP` },
    description: `An exclusive invitation-only VIP membership platform for ${name} fans. Premium access, exclusive content, and a digital VIP card.`,
    openGraph: {
      title: `${name} VIP Membership`,
      description: `Exclusive VIP membership for ${name} fans.`,
      ...(artist?.bannerUrl ? { images: [{ url: artist.bannerUrl }] } : {}),
    },
  };
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const artist = await getPrimaryArtist();
  const artistName = artist?.name || DEFAULT_ARTIST_NAME;

  return (
    <div className="min-h-screen bg-rich-black text-white flex flex-col">
      <Navbar artistName={artistName} />
      <main className="flex-1">{children}</main>
      <Footer artistName={artistName} />
    </div>
  );
}

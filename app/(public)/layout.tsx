import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "VIP Membership Platform", template: "%s | VIP Membership Platform" },
  description: "An exclusive invitation-only VIP membership platform. Premium access, exclusive content, and a digital VIP card.",
  openGraph: {
    title: "VIP Membership Platform",
    description: "Exclusive invitation-only VIP membership platform.",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-rich-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

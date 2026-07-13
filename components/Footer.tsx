import Link from "next/link";

export function Footer({ artistName = "Robert Plant" }: { artistName?: string }) {
  return (
    <footer className="border-t border-white/10 bg-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="text-2xl font-playfair text-gold-gradient block mb-4">
              {artistName} VIP
            </span>
            <p className="text-white/60 text-sm max-w-md">
              An exclusive membership platform for the most dedicated fans.
              Memberships are invitation-only and managed by our administrator team.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/memberships" className="hover:text-gold">Membership</Link></li>
              <li><Link href="/benefits" className="hover:text-gold">Benefits</Link></li>
              <li><Link href="/faq" className="hover:text-gold">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/40">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {artistName} VIP. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

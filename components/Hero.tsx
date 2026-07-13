"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const FALLBACK_BANNER = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-rich-black to-rich-black" />
      <div
        className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-overlay"
        style={{ backgroundImage: `url('${FALLBACK_BANNER}')` }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-gold uppercase tracking-[0.3em] text-sm mb-6">
            Invitation Only
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair text-gold-gradient mb-8 leading-tight">
            VIP Membership Platform
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            A world-class, invitation-only VIP membership platform. Premium
            access, exclusive content, and digital membership cards curated by
            our administrator team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/memberships" className="btn-gold px-8 py-3 text-base">
              Explore Memberships
              <ChevronRight size={18} />
            </Link>
            <Link href="/login" className="btn-outline-gold px-8 py-3 text-base">
              Member Login
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface HeroProps {
  artistName?: string;
  bannerUrl?: string;
  logoUrl?: string;
}

const FALLBACK_BANNER = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop";
const FALLBACK_LOGO = "https://ui-avatars.com/api/?name=VIP&background=c9a84c&color=000&size=128&font-size=0.5&bold=true";

export function Hero({ artistName = "Robert Plant", bannerUrl, logoUrl }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-rich-black to-rich-black" />
      <div
        className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-overlay"
        style={{ backgroundImage: `url('${bannerUrl || FALLBACK_BANNER}')` }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.img
            src={logoUrl || FALLBACK_LOGO}
            alt={artistName}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-24 h-24 rounded-full object-cover border-2 border-gold/40 mx-auto mb-6 shadow-[0_0_40px_rgba(201,168,76,0.3)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_LOGO;
            }}
          />
          <p className="text-gold uppercase tracking-[0.3em] text-sm mb-6">
            Invitation Only
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair text-gold-gradient mb-8 leading-tight">
            The Private Circle
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            A world-class VIP membership platform for{" "}
            <span className="text-white font-medium">{artistName}</span> fans.
            Premium access, exclusive content, and a digital membership card
            curated by the administrator team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/membership" className="btn-gold px-8 py-3 text-base">
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

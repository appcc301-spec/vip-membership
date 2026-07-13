"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Membership", href: "/memberships" },
  { label: "Events", href: "/events" },
  { label: "Benefits", href: "/benefits" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl font-playfair text-gold-gradient tracking-tight">
              VIP Platform
            </span>
            <span className="hidden sm:inline text-xs uppercase tracking-widest text-white/60 border-l border-white/20 pl-3">
              Membership
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/80 hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="btn-outline-gold">
              Member Login
            </Link>
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className={`md:hidden glass border-t border-white/10 overflow-hidden transition-all duration-300 ${open ? "max-h-screen py-4" : "max-h-0"}`}>
        <nav className="flex flex-col px-4 pb-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-gold py-3 border-b border-white/5 last:border-0 text-base transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="btn-gold mt-4 text-center" onClick={() => setOpen(false)}>
            Member Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

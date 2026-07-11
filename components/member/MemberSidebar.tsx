"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Crown,
  Calendar,
  FileText,
  User,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Card", href: "/card", icon: CreditCard },
  { label: "Membership", href: "/my-membership", icon: Crown },
  { label: "Events", href: "/my-events", icon: Calendar },
  { label: "Content", href: "/content", icon: FileText },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Support", href: "/support", icon: HelpCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

const mobileTabItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Card", href: "/card", icon: CreditCard },
  { label: "Events", href: "/my-events", icon: Calendar },
  { label: "Profile", href: "/profile", icon: User },
  { label: "More", href: "#more", icon: Menu },
];

interface MemberSidebarProps {
  name?: string;
  tier?: string;
}

export function MemberSidebar({ name = "Member", tier = "VIP" }: MemberSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-charcoal border-r border-white/10 z-40">
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Crown className="text-gold" size={24} />
            <span className="font-playfair text-gold-gradient font-bold">VIP Lounge</span>
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
          <div className="glassmorphism p-4 rounded-xl mb-6">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Signed in as</p>
            <p className="text-sm font-medium text-white truncate">{name}</p>
            <p className="text-xs text-gold">{tier} Member</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    active ? "bg-gold/10 text-gold" : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <Link href="/logout" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-charcoal border-t border-white/10 flex items-center">
        {mobileTabItems.map((item) => {
          const Icon = item.icon;
          const isMore = item.href === "#more";
          const active = !isMore && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <button
              key={item.href}
              onClick={() => isMore ? setMobileOpen(true) : undefined}
              className={cn("flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors", active ? "text-gold" : "text-white/50")}
              {...(!isMore && { onClick: undefined })}
            >
              {isMore ? (
                <Link href="#" onClick={(e) => { e.preventDefault(); setMobileOpen(true); }} className="flex flex-col items-center gap-0.5 w-full">
                  <Icon size={20} />
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              ) : (
                <Link href={item.href} className={cn("flex flex-col items-center gap-0.5 w-full", active ? "text-gold" : "text-white/50 hover:text-white")}>
                  <Icon size={20} />
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Mobile full-screen drawer (for "More") ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        "lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-charcoal border-r border-white/10 flex flex-col transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Crown className="text-gold" size={22} />
            <span className="font-playfair text-gold-gradient font-bold">VIP Lounge</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-white/50 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
          <div className="glassmorphism p-3 rounded-xl mb-4">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Signed in as</p>
            <p className="text-sm font-medium text-white truncate">{name}</p>
            <p className="text-xs text-gold">{tier} Member</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                    active ? "bg-gold/10 text-gold" : "text-white/70 hover:bg-white/5 hover:text-white")}>
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-white/10 shrink-0">
          <Link href="/logout" className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

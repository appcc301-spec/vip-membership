"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Mail,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Crown,
  ClipboardList,
  Music2,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "Platform",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Members", href: "/admin/members", icon: Users },
      { label: "Artists", href: "/admin/artists", icon: Music2 },
      { label: "Cards", href: "/admin/cards", icon: CreditCard },
      { label: "Events", href: "/admin/events", icon: Calendar },
      { label: "RSVP Tracking", href: "/admin/rsvp", icon: ClipboardList },
      { label: "Content", href: "/admin/content", icon: FileText },
      { label: "Emails", href: "/admin/emails", icon: Mail },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({
  collapsed,
  onCollapse,
  onLinkClick,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={onLinkClick}>
            <Crown className="text-gold" size={24} />
            <span className="font-playfair text-gold-gradient font-bold">Admin</span>
          </Link>
        )}
        {collapsed && <Crown className="text-gold mx-auto" size={24} />}
        <button
          onClick={onCollapse}
          className="text-white/50 hover:text-white p-1 hidden lg:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="p-3 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 px-3">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        active
                          ? "bg-gold/10 text-gold"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon size={20} />
                      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <Link
          href="/admin/logout"
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </Link>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button — shown in topbar area */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-charcoal border border-white/10 text-white/70 hover:text-white"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-charcoal border-r border-white/10 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
        <SidebarContent
          collapsed={false}
          onCollapse={() => {}}
          onLinkClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-charcoal border-r border-white/10 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>
    </>
  );
}

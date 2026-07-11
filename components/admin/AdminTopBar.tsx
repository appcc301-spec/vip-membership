"use client";

import Link from "next/link";
import { Search, Bell, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AdminTopBar() {
  return (
    <header className="h-16 glass border-b border-white/10 flex items-center justify-between pl-14 lg:pl-6 pr-4 lg:pr-6 sticky top-0 z-30 gap-3">
      <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
        <Search className="text-white/40 shrink-0" size={18} />
        <Input
          placeholder="Search members, cards, events..."
          className="border-0 bg-transparent focus-visible:ring-0 placeholder:text-white/30"
        />
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button className="relative p-2 text-white/60 hover:text-white">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
        </button>
        <Link href="/admin/members/new">
          <Button className="gap-2 text-sm px-3 py-2">
            <Plus size={16} />
            <span className="hidden sm:inline">New Member</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}

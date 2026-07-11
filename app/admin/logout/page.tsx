"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    }
    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-rich-black text-white">
      <p className="text-white/60">Signing out...</p>
    </div>
  );
}

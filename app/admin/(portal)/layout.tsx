import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { seedDatabase } from "@/lib/members";
import { processExpiredPendingMembers } from "@/lib/expiry";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await seedDatabase();
  await processExpiredPendingMembers();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-rich-black text-white">
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <AdminTopBar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

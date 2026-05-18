import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await requireAdmin()) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}

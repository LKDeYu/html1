import { redirect } from "next/navigation";
import { AdminCmsClient } from "@/components/admin-cms-client";
import { requireAdmin } from "@/lib/admin-auth";
import { listProjects, listSkills } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await requireAdmin())) {
    redirect("/admin/login");
  }

  return <AdminCmsClient initialProjects={listProjects({ includeDrafts: true })} initialSkills={listSkills({ includeDrafts: true })} />;
}

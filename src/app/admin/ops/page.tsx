import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OpsDashboard } from "@/components/ops-dashboard";
import {
  isOpsAdminConfigured,
  OPS_SESSION_COOKIE,
  verifyOpsSessionValue,
} from "@/lib/ops/auth";
import { readOpsData } from "@/lib/ops/read-ops-data";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const cookieStore = await cookies();
  if (
    !isOpsAdminConfigured() ||
    !verifyOpsSessionValue(cookieStore.get(OPS_SESSION_COOKIE)?.value)
  ) {
    redirect("/admin/ops/login");
  }

  const data = await readOpsData();
  const uptimeStatusUrl =
    process.env.NEXT_PUBLIC_UPTIME_STATUS_URL?.trim() || null;

  return (
    <OpsDashboard
      initialData={data}
      uptimeStatusUrl={uptimeStatusUrl}
    />
  );
}

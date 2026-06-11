import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OpsLoginForm } from "@/components/ops-login-form";
import {
  isOpsAdminConfigured,
  OPS_SESSION_COOKIE,
  verifyOpsSessionValue,
} from "@/lib/ops/auth";

export const dynamic = "force-dynamic";

export default async function OpsLoginPage() {
  const configured = isOpsAdminConfigured();
  const cookieStore = await cookies();
  if (
    configured &&
    verifyOpsSessionValue(cookieStore.get(OPS_SESSION_COOKIE)?.value)
  ) {
    redirect("/admin/ops");
  }

  return (
    <main className="ops-login-page">
      <OpsLoginForm configured={configured} />
    </main>
  );
}

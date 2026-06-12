import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react";

import {
  isOpsAdminConfigured,
  OPS_SESSION_COOKIE,
  verifyOpsSessionValue,
} from "@/lib/ops/auth";
import { readTrafficReport } from "@/lib/ops/read-traffic-report";

export const dynamic = "force-dynamic";

export default async function TrafficPage() {
  const cookieStore = await cookies();
  if (
    !isOpsAdminConfigured() ||
    !verifyOpsSessionValue(cookieStore.get(OPS_SESSION_COOKIE)?.value)
  ) {
    redirect("/admin/ops/login");
  }

  const report = await readTrafficReport();

  return (
    <main className="traffic-page">
      <header className="traffic-header">
        <div>
          <p className="ops-eyebrow">Coordinate Zero / Operations</p>
          <h1>访问分析</h1>
          <p>GoAccess 静态报告，每 5 分钟由 ECS 宿主机重新生成。</p>
        </div>
        <nav aria-label="流量报告操作">
          <Link href="/admin/ops">
            <ArrowLeft aria-hidden="true" size={17} />
            返回运维面板
          </Link>
          <Link href="/admin/traffic">
            <RefreshCw aria-hidden="true" size={17} />
            刷新报告
          </Link>
        </nav>
      </header>

      {report.status === "ready" ? (
        <section className="traffic-report-frame">
          <iframe
            src="/api/admin/traffic"
            title="GoAccess 访问分析报告"
          />
        </section>
      ) : (
        <section className="traffic-empty" role="status">
          <BarChart3 aria-hidden="true" size={32} />
          <div>
            <h2>
              {report.status === "missing"
                ? "尚未生成 GoAccess 报告"
                : "GoAccess 报告暂时不可读取"}
            </h2>
            <p>
              在 ECS 上运行 `deploy/goaccess/generate-report.sh`，
              或检查对应 systemd timer。
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

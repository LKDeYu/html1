import { cookies } from "next/headers";

import {
  isOpsAdminConfigured,
  OPS_SESSION_COOKIE,
  verifyOpsSessionValue,
} from "@/lib/ops/auth";
import { readTrafficReport } from "@/lib/ops/read-traffic-report";

export const dynamic = "force-dynamic";

const reportHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy":
    "default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline';",
  "Content-Type": "text/html; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
};

function messageResponse(message: string, status: number) {
  return new Response(
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Traffic report</title><style>body{margin:0;background:#0b1720;color:#cbd7de;font:14px system-ui;padding:32px}h1{font-size:20px;color:#fff}p{color:#8fa2ad}</style><h1>${message}</h1><p>请返回运维面板检查 GoAccess 采集任务。</p>`,
    { status, headers: reportHeaders },
  );
}

export async function GET() {
  if (!isOpsAdminConfigured()) {
    return messageResponse("运维面板尚未配置", 503);
  }

  const cookieStore = await cookies();
  if (
    !verifyOpsSessionValue(
      cookieStore.get(OPS_SESSION_COOKIE)?.value,
    )
  ) {
    return messageResponse("未授权访问", 401);
  }

  const report = await readTrafficReport();
  if (report.status === "missing") {
    return messageResponse("尚未生成 GoAccess 报告", 404);
  }
  if (report.status !== "ready") {
    return messageResponse("GoAccess 报告暂时不可读取", 503);
  }

  return new Response(report.html, { headers: reportHeaders });
}

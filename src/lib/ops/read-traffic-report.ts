import { readFile, stat } from "node:fs/promises";

const DEFAULT_REPORT_PATH = "/app/runtime/goaccess/report.html";
const DEFAULT_MAX_REPORT_BYTES = 16 * 1024 * 1024;

export type TrafficReportResult =
  | { status: "ready"; html: string }
  | { status: "missing" | "too-large" | "unreadable" };

export async function readTrafficReport(
  reportPath =
    process.env.GOACCESS_REPORT_PATH?.trim() || DEFAULT_REPORT_PATH,
  maxBytes = DEFAULT_MAX_REPORT_BYTES,
): Promise<TrafficReportResult> {
  try {
    const reportStat = await stat(reportPath);
    if (!reportStat.isFile()) {
      return { status: "unreadable" };
    }
    if (reportStat.size > maxBytes) {
      return { status: "too-large" };
    }

    return {
      status: "ready",
      html: await readFile(reportPath, "utf8"),
    };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    return { status: code === "ENOENT" ? "missing" : "unreadable" };
  }
}

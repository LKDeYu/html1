const OPS_TIME_ZONE = "Asia/Shanghai";

export function formatOpsTime(value: string | null): string {
  if (!value) {
    return "未检测";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: false,
    timeZone: OPS_TIME_ZONE,
  }).format(new Date(value));
}

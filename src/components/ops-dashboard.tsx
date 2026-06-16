"use client";

import {
  Activity,
  Archive,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  ExternalLink,
  FileWarning,
  Gauge,
  Globe2,
  HardDrive,
  LineChart,
  LogOut,
  MemoryStick,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatOpsTime } from "@/lib/ops/format-time";
import type {
  AvailabilityStatus,
  ClusterHealth,
  ContainerState,
  DatabaseHealth,
  OpsAccessRecord,
  OpsDataEnvelope,
  OpsSecurityEvent,
  RiskLevel,
  TrafficClassification,
} from "@/lib/ops/types";

type MonitoringLinks = {
  uptimeRobot: string | null;
  hetrixTools: string | null;
  betterStack: string | null;
};

type OpsDashboardProps = {
  initialData: OpsDataEnvelope;
  insecureHttpMode: boolean;
  monitoringLinks: MonitoringLinks;
};

type StatusTone = "good" | "bad" | "warn" | "neutral";
type StatusValue =
  | AvailabilityStatus
  | ContainerState
  | DatabaseHealth
  | ClusterHealth;

const chartPalette = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0f766e",
];

const classColors: Record<TrafficClassification, string> = {
  visitor: "#2563eb",
  "search-engine": "#16a34a",
  scanner: "#f59e0b",
  internal: "#64748b",
  suspicious: "#dc2626",
};

const riskColors: Record<RiskLevel, string> = {
  low: "#2563eb",
  medium: "#f59e0b",
  high: "#dc2626",
};

function statusTone(status: StatusValue): StatusTone {
  if (status === "healthy" || status === "running") {
    return "good";
  }
  if (status === "degraded") {
    return "warn";
  }
  if (
    status === "unhealthy" ||
    status === "stopped" ||
    status === "down"
  ) {
    return "bad";
  }
  return "neutral";
}

function statusLabel(status: StatusValue) {
  const labels: Record<string, string> = {
    healthy: "正常",
    unhealthy: "异常",
    unknown: "未知",
    running: "运行中",
    stopped: "已停止",
    degraded: "降级运行",
    down: "不可用",
  };
  return labels[status] || status;
}

function classificationLabel(value: string) {
  const labels: Record<TrafficClassification, string> = {
    visitor: "访客",
    "search-engine": "搜索引擎",
    scanner: "扫描器",
    internal: "内部检查",
    suspicious: "可疑访问",
  };
  return labels[value as TrafficClassification] || value;
}

function riskLabel(level: RiskLevel) {
  return {
    low: "低",
    medium: "中",
    high: "高",
  }[level];
}

function formatBytes(value: number | null) {
  if (value === null) {
    return "未知";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 ** 2) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

function formatDuration(value: number | null) {
  if (value === null) {
    return "未知";
  }
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  return days > 0 ? `${days} 天 ${hours} 小时` : `${hours} 小时`;
}

function formatAge(value: string | null, referenceTime: string) {
  if (!value) {
    return "未知";
  }
  const seconds = Math.max(
    0,
    Math.floor(
      (new Date(referenceTime).getTime() - new Date(value).getTime()) /
        1000,
    ),
  );
  if (seconds < 60) {
    return `${seconds} 秒前`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} 分钟前`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} 小时前`;
  }
  return `${Math.floor(seconds / 86400)} 天前`;
}

function formatHour(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function shortReferer(value: string) {
  return value === "-" ? "直接访问" : value;
}

function recordRisk(record: OpsAccessRecord) {
  return record.risk ? riskLabel(record.risk) : "无";
}

function sumCounts(events: OpsSecurityEvent[], level: RiskLevel) {
  return events
    .filter((event) => event.level === level)
    .reduce((total, event) => total + event.count, 0);
}

function metric(value: number) {
  return value.toLocaleString("zh-CN");
}

export function OpsDashboard({
  initialData,
  insecureHttpMode,
  monitoringLinks,
}: OpsDashboardProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError("");

    try {
      const response = await fetch("/api/admin/ops", {
        cache: "no-store",
      });
      if (response.status === 401 || response.status === 503) {
        router.replace("/admin/ops/login");
        router.refresh();
        return;
      }
      if (!response.ok) {
        throw new Error("request failed");
      }
      setData((await response.json()) as OpsDataEnvelope);
    } catch {
      setRefreshError("刷新失败，当前仍显示上一份数据。");
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const services = useMemo(
    () =>
      [
        {
          name: "Web Cluster",
          value: data.status.clusterHealth,
          detail: "2 replicas",
          icon: Boxes,
        },
        {
          name: "Website",
          value: data.status.website.status,
          detail: data.status.website.httpStatus
            ? `HTTP ${data.status.website.httpStatus}`
            : "No response",
          icon: Globe2,
        },
        {
          name: "Blog",
          value: data.status.blog.status,
          detail: data.status.blog.httpStatus
            ? `HTTP ${data.status.blog.httpStatus}`
            : "No response",
          icon: BookOpen,
        },
        {
          name: "Waline",
          value: data.status.waline.status,
          detail: data.status.waline.httpStatus
            ? `HTTP ${data.status.waline.httpStatus}`
            : "No response",
          icon: Activity,
        },
        {
          name: "Nginx",
          value: data.status.nginx.state,
          detail: `重启 ${data.status.nginx.restartCount}`,
          icon: Gauge,
        },
        {
          name: "Web Primary",
          value:
            data.status.webPrimary.health !== "unknown"
              ? data.status.webPrimary.health
              : data.status.webPrimary.state,
          detail: `重启 ${data.status.webPrimary.restartCount}`,
          icon: Server,
        },
        {
          name: "Web Replica",
          value:
            data.status.webReplica.health !== "unknown"
              ? data.status.webReplica.health
              : data.status.webReplica.state,
          detail: `重启 ${data.status.webReplica.restartCount}`,
          icon: Server,
        },
        {
          name: "MySQL",
          value:
            data.status.mysql.health !== "unknown"
              ? data.status.mysql.health
              : data.status.mysql.state,
          detail: `重启 ${data.status.mysql.restartCount}`,
          icon: Database,
        },
        {
          name: "Uptime Kuma",
          value: data.status.uptimeKuma.state,
          detail: `重启 ${data.status.uptimeKuma.restartCount}`,
          icon: Activity,
        },
        {
          name: "GoAccess",
          value: data.status.goaccess.state,
          detail: `重启 ${data.status.goaccess.restartCount}`,
          icon: BarChart3,
        },
      ] as const,
    [data],
  );

  const healthyServices = services.filter(
    (service) => statusTone(service.value) === "good",
  ).length;
  const highRiskCount = sumCounts(data.securityEvents, "high");
  const mediumRiskCount = sumCounts(data.securityEvents, "medium");

  const hourlyData = data.access.requestsByHour.map((item) => ({
    ...item,
    label: formatHour(item.time),
  }));

  const statusCodeData = data.access.statusCodes.map((item, index) => ({
    ...item,
    fill:
      Number(item.label) >= 500
        ? "#dc2626"
        : Number(item.label) >= 400
          ? "#f59e0b"
          : chartPalette[index % chartPalette.length],
  }));

  const trafficClassData = data.access.trafficClasses.map((item) => ({
    ...item,
    label: classificationLabel(item.label),
    fill:
      classColors[item.label as TrafficClassification] ||
      chartPalette[0],
  }));

  const riskData = (["high", "medium", "low"] as const).map((level) => ({
    label: `${riskLabel(level)}风险`,
    count: sumCounts(data.securityEvents, level),
    fill: riskColors[level],
  }));

  const monitoringCards = [
    {
      name: "UptimeRobot",
      url: monitoringLinks.uptimeRobot,
      detail: "公网多节点可用性",
    },
    {
      name: "Better Stack",
      url: monitoringLinks.betterStack,
      detail: "外部状态页与告警",
    },
    {
      name: "HetrixTools",
      url: monitoringLinks.hetrixTools,
      detail: "全球节点探测",
    },
  ];

  return (
    <main className="ops-shell">
      <aside className="ops-sidebar" aria-label="运维导航">
        <div className="ops-brand">
          <span>
            <Gauge size={19} />
          </span>
          <div>
            <strong>Coordinate Zero</strong>
            <small>Operations</small>
          </div>
        </div>
        <nav className="ops-side-nav">
          <a href="#overview">
            <Activity size={17} />
            总览
          </a>
          <a href="#traffic">
            <LineChart size={17} />
            流量
          </a>
          <a href="#security">
            <ShieldAlert size={17} />
            安全
          </a>
          <a href="#backup">
            <Archive size={17} />
            备份
          </a>
          <a href="#monitoring">
            <ExternalLink size={17} />
            外部监控
          </a>
        </nav>
        <div className="ops-sidebar-footer">
          <span>数据源</span>
          <strong>{data.source}</strong>
        </div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar">
          <div>
            <p className="ops-eyebrow">Read-only command center</p>
            <div className="ops-title-row">
              <h1>管理员运维面板</h1>
              {insecureHttpMode ? (
                <span className="ops-insecure-badge">
                  <ShieldAlert size={14} />
                  HTTP 测试模式
                </span>
              ) : null}
            </div>
            <p>服务、流量、安全事件和备份状态集中观察。</p>
          </div>
          <div className="ops-topbar-actions">
            <button
              className="ops-action-button"
              type="button"
              onClick={refresh}
              disabled={refreshing}
              title="刷新运行数据"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "is-spinning" : undefined}
              />
              {refreshing ? "刷新中" : "刷新"}
            </button>
            <form action="/api/admin/ops/logout" method="post">
              <button className="ops-action-button" type="submit">
                <LogOut size={17} />
                退出
              </button>
            </form>
          </div>
        </header>

        <section className="ops-meta-strip" aria-label="数据状态">
          <span>
            <Clock3 size={15} />
            检测时间 {formatOpsTime(data.status.checkedAt)}
          </span>
          <span>
            采集新鲜度{" "}
            <strong>
              {formatAge(data.status.checkedAt, data.generatedAt)}
            </strong>
          </span>
          {data.missingFiles.length ? (
            <span className="ops-meta-warning">
              缺少 {data.missingFiles.join(", ")}
            </span>
          ) : null}
          {refreshError ? (
            <span className="ops-meta-error">{refreshError}</span>
          ) : null}
        </section>

        <section id="overview" className="ops-kpi-grid">
          <article className="ops-kpi-card">
            <span>集群健康</span>
            <strong>{statusLabel(data.status.clusterHealth)}</strong>
            <small>
              {healthyServices}/{services.length} services healthy
            </small>
          </article>
          <article className="ops-kpi-card">
            <span>今日请求</span>
            <strong>{metric(data.access.todayRequests)}</strong>
            <small>24h {metric(data.access.last24hRequests)}</small>
          </article>
          <article className="ops-kpi-card">
            <span>估算访客</span>
            <strong>{metric(data.access.estimatedVisitors)}</strong>
            <small>{data.access.sampleTruncated ? "样本已截断" : "样本完整"}</small>
          </article>
          <article className="ops-kpi-card" data-tone={highRiskCount ? "bad" : "good"}>
            <span>高风险事件</span>
            <strong>{metric(highRiskCount)}</strong>
            <small>中风险 {metric(mediumRiskCount)}</small>
          </article>
          <article className="ops-kpi-card" data-tone={data.backup.success ? "good" : "warn"}>
            <span>最近备份</span>
            <strong>
              {data.backup.success === null
                ? "未知"
                : data.backup.success
                  ? "成功"
                  : "失败"}
            </strong>
            <small>{formatAge(data.backup.lastBackupAt, data.generatedAt)}</small>
          </article>
        </section>

        <section className="ops-service-grid" aria-label="服务健康状态">
          {services.map(({ name, value, detail, icon: Icon }) => {
            const tone = statusTone(value);
            return (
              <article className="ops-service-tile" data-tone={tone} key={name}>
                <div>
                  <Icon size={18} />
                  <span>{name}</span>
                </div>
                <strong>{statusLabel(value)}</strong>
                <small>{detail}</small>
              </article>
            );
          })}
        </section>

        <section className="ops-resource-row" aria-label="ECS 主机资源">
          <div>
            <Cpu size={17} />
            <span>CPU</span>
            <strong>
              {data.status.host.cpuPercent === null
                ? "未知"
                : `${data.status.host.cpuPercent.toFixed(1)}%`}
            </strong>
          </div>
          <div>
            <MemoryStick size={17} />
            <span>内存</span>
            <strong>
              {data.status.host.memoryPercent === null
                ? "未知"
                : `${data.status.host.memoryPercent.toFixed(1)}%`}
            </strong>
          </div>
          <div>
            <HardDrive size={17} />
            <span>系统盘</span>
            <strong>
              {data.status.host.diskPercent === null
                ? "未知"
                : `${data.status.host.diskPercent.toFixed(1)}%`}
            </strong>
          </div>
          <div>
            <Clock3 size={17} />
            <span>ECS 运行时间</span>
            <strong>{formatDuration(data.status.host.uptimeSeconds)}</strong>
          </div>
        </section>

        <section id="traffic" className="ops-chart-grid">
          <article className="ops-panel ops-panel-wide">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Traffic trend</p>
                <h2>24 小时请求趋势</h2>
              </div>
            </div>
            <div className="ops-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis tickLine={false} axisLine={false} width={34} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    name="请求"
                    stroke="#2563eb"
                    fill="url(#requestsGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    name="4xx/5xx"
                    stroke="#dc2626"
                    fill="#dc2626"
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="ops-panel">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Response profile</p>
                <h2>状态码分布</h2>
              </div>
            </div>
            <div className="ops-chart ops-chart-compact">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCodeData} dataKey="count" nameKey="label" innerRadius={50} outerRadius={78}>
                    {statusCodeData.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="ops-panel">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Traffic classes</p>
                <h2>访问分类</h2>
              </div>
            </div>
            <div className="ops-chart ops-chart-compact">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={trafficClassData} dataKey="count" nameKey="label" outerRadius={80}>
                    {trafficClassData.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="ops-panel">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Top destinations</p>
                <h2>热门路径</h2>
              </div>
            </div>
            <div className="ops-chart ops-chart-bar">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.access.topPaths.slice(0, 8)} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" width={118} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="请求" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="ops-panel">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Top clients</p>
                <h2>访问最多的 IP</h2>
              </div>
            </div>
            <div className="ops-chart ops-chart-bar">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.access.topIps.slice(0, 8)} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" width={118} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="请求" fill="#16a34a" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section id="security" className="ops-two-column">
          <article className="ops-panel">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Heuristic detection</p>
                <h2>风险等级分布</h2>
              </div>
              <ShieldAlert size={21} />
            </div>
            <p className="ops-disclaimer">
              当前检测基于路径、方法和访问频率，不替代专业 WAF。
            </p>
            <div className="ops-chart ops-chart-compact">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={34} />
                  <Tooltip />
                  <Bar dataKey="count" name="命中次数" radius={[6, 6, 0, 0]}>
                    {riskData.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="ops-panel">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Security roadmap</p>
                <h2>CrowdSec 扩展</h2>
              </div>
              <ShieldCheck size={21} />
            </div>
            <div className="ops-roadmap">
              <strong>建议作为下一阶段</strong>
              <span>读取 Nginx 日志，接入社区规则，先只做检测和报告。</span>
              <span>确认误报率后，再考虑 bouncer 或 WAF 拦截。</span>
            </div>
          </article>
        </section>

        <section className="ops-panel">
          <div className="ops-section-heading">
            <div>
              <p className="ops-eyebrow">Suspicious requests</p>
              <h2>可疑访问事件</h2>
            </div>
            <span>{data.securityEvents.length} events</span>
          </div>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>等级</th>
                  <th>IP</th>
                  <th>路径</th>
                  <th>规则</th>
                  <th>次数</th>
                  <th>最近出现</th>
                </tr>
              </thead>
              <tbody>
                {data.securityEvents.length ? (
                  data.securityEvents.map((event, index) => (
                    <tr key={`${event.ip}-${event.rule}-${event.path}-${index}`}>
                      <td>
                        <span className="ops-risk-badge" data-risk={event.level}>
                          {riskLabel(event.level)}
                        </span>
                      </td>
                      <td><code>{event.ip}</code></td>
                      <td><code>{event.path}</code></td>
                      <td>{event.rule}</td>
                      <td>{event.count}</td>
                      <td>{formatOpsTime(event.lastSeenAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="ops-empty-cell" colSpan={6}>
                      当前样本中没有可疑事件
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="backup" className="ops-two-column">
          <article className="ops-panel">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Database protection</p>
                <h2>备份状态</h2>
              </div>
              <Archive size={21} />
            </div>
            {data.backup.success === null ? (
              <div className="ops-backup-empty">
                <FileWarning size={24} />
                <div>
                  <strong>尚未配置自动备份</strong>
                  <span>运行宿主机备份脚本后，此处会显示最近结果。</span>
                </div>
              </div>
            ) : (
              <div>
                <dl className="ops-detail-list">
                  <div>
                    <dt>最近结果</dt>
                    <dd className={data.backup.success ? "is-good" : "is-bad"}>
                      {data.backup.success ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      {data.backup.success ? "成功" : "失败"}
                    </dd>
                  </div>
                  <div>
                    <dt>备份时间</dt>
                    <dd>
                      {formatOpsTime(data.backup.lastBackupAt)}
                      {" · "}
                      {formatAge(data.backup.lastBackupAt, data.generatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt>文件</dt>
                    <dd><code>{data.backup.fileName || "未知"}</code></dd>
                  </div>
                  <div>
                    <dt>大小</dt>
                    <dd>{formatBytes(data.backup.sizeBytes)}</dd>
                  </div>
                  <div>
                    <dt>保留数量</dt>
                    <dd>
                      {data.backup.availableBackups} / {data.backup.retentionCount}
                    </dd>
                  </div>
                  <div>
                    <dt>目录</dt>
                    <dd><code>{data.backup.directory || "未知"}</code></dd>
                  </div>
                  {data.backup.errorSummary ? (
                    <div>
                      <dt>错误摘要</dt>
                      <dd className="is-bad">{data.backup.errorSummary}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            )}
          </article>

          <article className="ops-panel">
            <div className="ops-section-heading">
              <div>
                <p className="ops-eyebrow">Backup inventory</p>
                <h2>备份文件</h2>
              </div>
            </div>
            {data.backup.backups.length ? (
              <div className="ops-backup-list">
                {data.backup.backups.map((backup) => (
                  <div key={backup.fileName}>
                    <code>{backup.fileName}</code>
                    <span>{formatBytes(backup.sizeBytes)}</span>
                    <span>{formatOpsTime(backup.createdAt)}</span>
                    <strong data-valid={backup.gzipValid}>
                      {backup.gzipValid ? "gzip 有效" : "gzip 异常"}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ops-empty">暂无备份文件记录</p>
            )}
          </article>
        </section>

        <section id="monitoring" className="ops-panel">
          <div className="ops-section-heading">
            <div>
              <p className="ops-eyebrow">External monitoring</p>
              <h2>外部监控与快捷入口</h2>
            </div>
            <ExternalLink size={21} />
          </div>
          <div className="ops-monitor-grid">
            {monitoringCards.map((card) =>
              card.url ? (
                <a key={card.name} href={card.url} target="_blank" rel="noreferrer">
                  <strong>{card.name}</strong>
                  <span>{card.detail}</span>
                  <ArrowUpRight size={16} />
                </a>
              ) : (
                <span className="is-disabled" key={card.name}>
                  <strong>{card.name}</strong>
                  <span>未配置链接</span>
                </span>
              ),
            )}
            <Link href="/admin/traffic">
              <strong>GoAccess</strong>
              <span>Nginx 访问分析</span>
              <ArrowUpRight size={16} />
            </Link>
            <Link href="/waline/ui">
              <strong>Waline</strong>
              <span>评论后台</span>
              <ArrowUpRight size={16} />
            </Link>
            <Link href="/">
              <strong>Homepage</strong>
              <span>公网首页</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="ops-kuma-command">
            <Activity size={18} />
            <div>
              <strong>Uptime Kuma（SSH 隧道）</strong>
              <code>ssh -L 3001:127.0.0.1:3001 root@ECS公网IP</code>
            </div>
          </div>
        </section>

        <section className="ops-panel">
          <div className="ops-section-heading">
            <div>
              <p className="ops-eyebrow">Recent requests</p>
              <h2>最近访问</h2>
            </div>
            <span>{data.access.recent.length} records</span>
          </div>
          <div className="ops-table-wrap">
            <table className="ops-table ops-access-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>IP</th>
                  <th>方法</th>
                  <th>路径</th>
                  <th>状态</th>
                  <th>Referer</th>
                  <th>User-Agent</th>
                  <th>分类</th>
                  <th>风险</th>
                </tr>
              </thead>
              <tbody>
                {data.access.recent.length ? (
                  data.access.recent.map((record, index) => (
                    <tr key={`${record.time}-${record.ip}-${index}`}>
                      <td>{formatOpsTime(record.time)}</td>
                      <td><code>{record.ip}</code></td>
                      <td><code>{record.method}</code></td>
                      <td><code>{record.path}</code></td>
                      <td>
                        <span
                          className="ops-http-code"
                          data-error={record.statusCode >= 400}
                        >
                          {record.statusCode}
                        </span>
                      </td>
                      <td>{shortReferer(record.referer)}</td>
                      <td>{record.userAgent}</td>
                      <td>{classificationLabel(record.classification)}</td>
                      <td>
                        {record.risk ? (
                          <span className="ops-risk-badge" data-risk={record.risk}>
                            {recordRisk(record)}
                          </span>
                        ) : (
                          "无"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="ops-empty-cell" colSpan={9}>
                      暂无最近访问记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

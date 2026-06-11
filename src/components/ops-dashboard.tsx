"use client";

import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  FileWarning,
  Gauge,
  Globe2,
  LogOut,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AvailabilityStatus,
  ContainerState,
  DatabaseHealth,
  OpsAccessRecord,
  OpsDataEnvelope,
  RiskLevel,
} from "@/lib/ops/types";

type OpsDashboardProps = {
  initialData: OpsDataEnvelope;
  uptimeStatusUrl: string | null;
};

type StatusTone = "good" | "bad" | "neutral";

function statusTone(
  status: AvailabilityStatus | ContainerState | DatabaseHealth,
): StatusTone {
  if (status === "healthy" || status === "running") {
    return "good";
  }
  if (
    status === "unhealthy" ||
    status === "stopped"
  ) {
    return "bad";
  }
  return "neutral";
}

function statusLabel(
  status: AvailabilityStatus | ContainerState | DatabaseHealth,
) {
  const labels: Record<string, string> = {
    healthy: "正常",
    unhealthy: "异常",
    unknown: "未知",
    running: "运行中",
    stopped: "已停止",
  };
  return labels[status] || status;
}

function riskLabel(level: RiskLevel) {
  return {
    low: "低",
    medium: "中",
    high: "高",
  }[level];
}

function formatTime(value: string | null) {
  if (!value) {
    return "未检测";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: false,
  }).format(new Date(value));
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

function shortReferer(value: string) {
  return value === "-" ? "直接访问" : value;
}

function recordRisk(record: OpsAccessRecord) {
  return record.risk ? riskLabel(record.risk) : "无";
}

export function OpsDashboard({
  initialData,
  uptimeStatusUrl,
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

  const maxStatusCodeCount = useMemo(
    () =>
      Math.max(
        1,
        ...data.access.statusCodes.map((item) => item.count),
      ),
    [data.access.statusCodes],
  );

  const services = [
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
      detail: "Gateway",
      icon: Gauge,
    },
    {
      name: "Web",
      value: data.status.web.state,
      detail: "Next.js",
      icon: Server,
    },
    {
      name: "MySQL",
      value:
        data.status.mysql.health !== "unknown"
          ? data.status.mysql.health
          : data.status.mysql.state,
      detail: "Database",
      icon: Database,
    },
  ] as const;

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-eyebrow">Coordinate Zero / Operations</p>
          <h1>只读运维面板</h1>
          <p>
            数据来自宿主机定时生成的运行状态摘要，不提供远程控制能力。
          </p>
        </div>
        <div className="ops-header-actions">
          <button
            className="ops-icon-button"
            type="button"
            onClick={refresh}
            disabled={refreshing}
            title="刷新运行数据"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "is-spinning" : undefined}
            />
            <span>{refreshing ? "刷新中" : "刷新"}</span>
          </button>
          <form action="/api/admin/ops/logout" method="post">
            <button className="ops-icon-button" type="submit">
              <LogOut size={18} />
              <span>退出</span>
            </button>
          </form>
        </div>
      </header>

      <section className="ops-meta-bar" aria-label="数据状态">
        <span>
          <Clock3 size={15} />
          检测时间 {formatTime(data.status.checkedAt)}
        </span>
        <span>
          数据源 <strong>{data.source}</strong>
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

      <section className="ops-service-grid" aria-label="服务健康状态">
        {services.map(({ name, value, detail, icon: Icon }) => {
          const tone = statusTone(value);
          return (
            <article className="ops-service-card" data-tone={tone} key={name}>
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

      <section className="ops-summary-band">
        <div className="ops-section-heading">
          <div>
            <p className="ops-eyebrow">Traffic overview</p>
            <h2>访问摘要</h2>
          </div>
          {data.access.sampleTruncated ? (
            <span className="ops-sample-note">日志样本已截断</span>
          ) : null}
        </div>
        <div className="ops-metric-grid">
          <div>
            <span>今日请求</span>
            <strong>{data.access.todayRequests.toLocaleString()}</strong>
          </div>
          <div>
            <span>最近 24 小时</span>
            <strong>{data.access.last24hRequests.toLocaleString()}</strong>
          </div>
          <div>
            <span>404</span>
            <strong>{data.access.notFoundCount.toLocaleString()}</strong>
          </div>
          <div>
            <span>5xx</span>
            <strong>{data.access.serverErrorCount.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      <div className="ops-two-column">
        <section className="ops-panel">
          <div className="ops-section-heading">
            <div>
              <p className="ops-eyebrow">Top destinations</p>
              <h2>热门路径</h2>
            </div>
          </div>
          <ol className="ops-ranked-list">
            {data.access.topPaths.length ? (
              data.access.topPaths.map((item) => (
                <li key={item.label}>
                  <code>{item.label}</code>
                  <strong>{item.count.toLocaleString()}</strong>
                </li>
              ))
            ) : (
              <li className="ops-empty">暂无访问数据</li>
            )}
          </ol>
        </section>

        <section className="ops-panel">
          <div className="ops-section-heading">
            <div>
              <p className="ops-eyebrow">Response profile</p>
              <h2>状态码分布</h2>
            </div>
          </div>
          <div className="ops-status-bars">
            {data.access.statusCodes.length ? (
              data.access.statusCodes.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <i
                      style={{
                        width: `${Math.max(
                          3,
                          (item.count / maxStatusCodeCount) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <strong>{item.count.toLocaleString()}</strong>
                </div>
              ))
            ) : (
              <p className="ops-empty">暂无状态码数据</p>
            )}
          </div>
        </section>
      </div>

      <section className="ops-panel">
        <div className="ops-section-heading">
          <div>
            <p className="ops-eyebrow">Heuristic detection</p>
            <h2>可疑访问</h2>
          </div>
          <ShieldAlert size={21} />
        </div>
        <p className="ops-disclaimer">
          以下内容是基于路径、方法和访问频率的启发式风险提示，不是专业 WAF，
          不能保证识别所有攻击。
        </p>
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
                  <tr
                    key={`${event.ip}-${event.rule}-${event.path}-${index}`}
                  >
                    <td>
                      <span
                        className="ops-risk-badge"
                        data-risk={event.level}
                      >
                        {riskLabel(event.level)}
                      </span>
                    </td>
                    <td><code>{event.ip}</code></td>
                    <td><code>{event.path}</code></td>
                    <td>{event.rule}</td>
                    <td>{event.count}</td>
                    <td>{formatTime(event.lastSeenAt)}</td>
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

      <div className="ops-two-column">
        <section className="ops-panel">
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
                <dd>{formatTime(data.backup.lastBackupAt)}</dd>
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
          )}
        </section>

        <section className="ops-panel">
          <div className="ops-section-heading">
            <div>
              <p className="ops-eyebrow">Admin shortcuts</p>
              <h2>快捷入口</h2>
            </div>
            <ExternalLink size={21} />
          </div>
          <nav className="ops-shortcuts" aria-label="运维快捷入口">
            <Link href="/waline/ui">
              <ShieldCheck size={18} />
              Waline 后台
              <ArrowUpRight size={15} />
            </Link>
            <Link href="/">
              <Globe2 size={18} />
              公网首页
              <ArrowUpRight size={15} />
            </Link>
            <Link href="/blog/home">
              <BookOpen size={18} />
              博客首页
              <ArrowUpRight size={15} />
            </Link>
            {uptimeStatusUrl ? (
              <a
                href={uptimeStatusUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Activity size={18} />
                UptimeRobot
                <ArrowUpRight size={15} />
              </a>
            ) : (
              <span className="is-disabled">
                <AlertTriangle size={18} />
                UptimeRobot 未配置
              </span>
            )}
          </nav>
        </section>
      </div>

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
                <th>风险</th>
              </tr>
            </thead>
            <tbody>
              {data.access.recent.length ? (
                data.access.recent.map((record, index) => (
                  <tr key={`${record.time}-${record.ip}-${index}`}>
                    <td>{formatTime(record.time)}</td>
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
                    <td>
                      {record.risk ? (
                        <span
                          className="ops-risk-badge"
                          data-risk={record.risk}
                        >
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
                  <td className="ops-empty-cell" colSpan={8}>
                    暂无最近访问记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ops-panel">
        <div className="ops-section-heading">
          <div>
            <p className="ops-eyebrow">Top clients</p>
            <h2>访问最多的 IP</h2>
          </div>
        </div>
        <ol className="ops-ip-grid">
          {data.access.topIps.length ? (
            data.access.topIps.map((item) => (
              <li key={item.label}>
                <code>{item.label}</code>
                <strong>{item.count.toLocaleString()}</strong>
              </li>
            ))
          ) : (
            <li className="ops-empty">暂无 IP 摘要</li>
          )}
        </ol>
      </section>
    </main>
  );
}

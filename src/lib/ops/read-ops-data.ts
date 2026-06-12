import { promises as fs } from "node:fs";
import path from "node:path";
import { createMockOpsData } from "@/lib/ops/mock-data";
import {
  OPS_DATA_FILES,
  type AvailabilityStatus,
  type ClusterHealth,
  type ContainerState,
  type DatabaseHealth,
  type OpsAccessRecord,
  type OpsAccessSummary,
  type OpsBackupStatus,
  type OpsCountItem,
  type OpsDataEnvelope,
  type OpsDataFile,
  type OpsSecurityEvent,
  type OpsServiceStatus,
  type RiskLevel,
  type TrafficClassification,
} from "@/lib/ops/types";

const MAX_JSON_BYTES = 2_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, maxLength: number, fallback = "") {
  return typeof value === "string"
    ? value.slice(0, maxLength)
    : fallback;
}

function urlText(value: unknown, maxLength: number, fallback = "") {
  const result = text(value, maxLength, fallback);
  const queryIndex = result.indexOf("?");
  const fragmentIndex = result.indexOf("#");
  const indexes = [queryIndex, fragmentIndex].filter((index) => index >= 0);
  return indexes.length ? result.slice(0, Math.min(...indexes)) : result;
}

function nullableText(value: unknown, maxLength: number) {
  const result = text(value, maxLength);
  return result || null;
}

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function nullableCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : null;
}

function nullablePercent(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : null;
}

function boolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function nullableBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function isoDate(value: unknown) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    return null;
  }
  return new Date(value).toISOString();
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
) {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

function availability(value: unknown): AvailabilityStatus {
  return enumValue(
    value,
    ["healthy", "unhealthy", "unknown"] as const,
    "unknown",
  );
}

function containerState(value: unknown): ContainerState {
  return enumValue(
    value,
    ["running", "stopped", "unknown"] as const,
    "unknown",
  );
}

function databaseHealth(value: unknown): DatabaseHealth {
  return enumValue(
    value,
    ["healthy", "unhealthy", "unknown"] as const,
    "unknown",
  );
}

function riskLevel(value: unknown): RiskLevel | null {
  return enumValue(
    value,
    ["low", "medium", "high", "none"] as const,
    "none",
  ) === "none"
    ? null
    : (value as RiskLevel);
}

function clusterHealth(value: unknown): ClusterHealth {
  return enumValue(
    value,
    ["healthy", "degraded", "down", "unknown"] as const,
    "unknown",
  );
}

function trafficClassification(value: unknown): TrafficClassification {
  return enumValue(
    value,
    [
      "visitor",
      "search-engine",
      "scanner",
      "internal",
      "suspicious",
    ] as const,
    "visitor",
  );
}

function emptyStatus(): OpsServiceStatus {
  const endpoint = { status: "unknown" as const, httpStatus: null };
  const container = {
    state: "unknown" as const,
    health: "unknown" as const,
    restartCount: 0,
  };

  return {
    checkedAt: null,
    host: {
      cpuPercent: null,
      memoryPercent: null,
      diskPercent: null,
      uptimeSeconds: null,
    },
    clusterHealth: "unknown",
    website: { ...endpoint },
    blog: { ...endpoint },
    waline: { ...endpoint },
    nginx: { ...container },
    web: { ...container },
    webPrimary: { ...container },
    webReplica: { ...container },
    walineContainer: { ...container },
    mysql: { ...container },
    uptimeKuma: { ...container },
    goaccess: { ...container },
  };
}

function emptyAccess(): OpsAccessSummary {
  return {
    generatedAt: null,
    todayRequests: 0,
    last24hRequests: 0,
    notFoundCount: 0,
    serverErrorCount: 0,
    sampleTruncated: false,
    estimatedVisitors: 0,
    trafficClasses: [],
    topPaths: [],
    statusCodes: [],
    topIps: [],
    recent: [],
  };
}

function emptyBackup(): OpsBackupStatus {
  return {
    checkedAt: null,
    lastBackupAt: null,
    fileName: null,
    sizeBytes: null,
    success: null,
    retentionCount: 0,
    availableBackups: 0,
    directory: null,
    errorSummary: null,
    backups: [],
  };
}

function parseEndpoint(value: unknown) {
  const input = isRecord(value) ? value : {};
  const httpStatus =
    typeof input.httpStatus === "number" &&
    input.httpStatus >= 100 &&
    input.httpStatus <= 599
      ? Math.floor(input.httpStatus)
      : null;

  return {
    status: availability(input.status),
    httpStatus,
  };
}

function parseContainer(value: unknown) {
  const input = isRecord(value) ? value : {};
  return {
    state: containerState(input.state),
    health: databaseHealth(input.health),
    restartCount: count(input.restartCount),
  };
}

function parseStatus(value: unknown): OpsServiceStatus {
  if (!isRecord(value)) {
    return emptyStatus();
  }

  const host = isRecord(value.host) ? value.host : {};
  const webPrimary = parseContainer(value.webPrimary || value.web);

  return {
    checkedAt: isoDate(value.checkedAt),
    host: {
      cpuPercent: nullablePercent(host.cpuPercent),
      memoryPercent: nullablePercent(host.memoryPercent),
      diskPercent: nullablePercent(host.diskPercent),
      uptimeSeconds: nullableCount(host.uptimeSeconds),
    },
    clusterHealth: clusterHealth(value.clusterHealth),
    website: parseEndpoint(value.website),
    blog: parseEndpoint(value.blog),
    waline: parseEndpoint(value.waline),
    nginx: parseContainer(value.nginx),
    web: webPrimary,
    webPrimary,
    webReplica: parseContainer(value.webReplica),
    walineContainer: parseContainer(value.walineContainer),
    mysql: parseContainer(value.mysql),
    uptimeKuma: parseContainer(value.uptimeKuma),
    goaccess: parseContainer(value.goaccess),
  };
}

function parseCountItems(
  value: unknown,
  limit: number,
  sanitizeUrl = false,
): OpsCountItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, limit).flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const label = sanitizeUrl
      ? urlText(item.label, 300)
      : text(item.label, 300);
    return label ? [{ label, count: count(item.count) }] : [];
  });
}

function parseTrafficClassItems(value: unknown): OpsCountItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const allowed = [
    "visitor",
    "search-engine",
    "scanner",
    "internal",
    "suspicious",
  ] as const;
  return value.slice(0, allowed.length).flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const label = enumValue(item.label, allowed, "visitor");
    return [{ label, count: count(item.count) }];
  });
}

function parseAccessRecord(value: unknown): OpsAccessRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const time = isoDate(value.time);
  const pathValue = urlText(value.path, 300);
  const statusCode =
    typeof value.statusCode === "number" &&
    value.statusCode >= 100 &&
    value.statusCode <= 599
      ? Math.floor(value.statusCode)
      : null;
  if (!time || !pathValue || statusCode === null) {
    return null;
  }

  return {
    time,
    ip: text(value.ip, 64, "unknown"),
    method: text(value.method, 12, "GET").toUpperCase(),
    path: pathValue,
    statusCode,
    referer: urlText(value.referer, 240, "-"),
    userAgent: text(value.userAgent, 160, "unknown"),
    risk: riskLevel(value.risk),
    classification: trafficClassification(value.classification),
  };
}

function parseAccess(value: unknown): OpsAccessSummary {
  if (!isRecord(value)) {
    return emptyAccess();
  }

  return {
    generatedAt: isoDate(value.generatedAt),
    todayRequests: count(value.todayRequests),
    last24hRequests: count(value.last24hRequests),
    notFoundCount: count(value.notFoundCount),
    serverErrorCount: count(value.serverErrorCount),
    sampleTruncated: boolean(value.sampleTruncated),
    estimatedVisitors: count(value.estimatedVisitors),
    trafficClasses: parseTrafficClassItems(value.trafficClasses),
    topPaths: parseCountItems(value.topPaths, 10, true),
    statusCodes: parseCountItems(value.statusCodes, 20),
    topIps: parseCountItems(value.topIps, 10),
    recent: Array.isArray(value.recent)
      ? value.recent
          .slice(0, 50)
          .map(parseAccessRecord)
          .filter((record): record is OpsAccessRecord => record !== null)
      : [],
  };
}

function parseSecurityEvents(value: unknown): OpsSecurityEvent[] {
  const source =
    isRecord(value) && Array.isArray(value.events) ? value.events : value;
  if (!Array.isArray(source)) {
    return [];
  }

  return source.slice(0, 100).flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const lastSeenAt = isoDate(item.lastSeenAt);
    const rule = text(item.rule, 120);
    const pathValue = urlText(item.path, 300);
    const level = riskLevel(item.level);
    if (!lastSeenAt || !rule || !pathValue || !level) {
      return [];
    }

    return [
      {
        ip: text(item.ip, 64, "unknown"),
        path: pathValue,
        rule,
        count: count(item.count),
        lastSeenAt,
        level,
      },
    ];
  });
}

function parseBackup(value: unknown): OpsBackupStatus {
  if (!isRecord(value)) {
    return emptyBackup();
  }

  const backups = Array.isArray(value.backups)
    ? value.backups.slice(0, 20).flatMap((item) => {
        if (!isRecord(item)) {
          return [];
        }
        const fileName = text(item.fileName, 200);
        const createdAt = isoDate(item.createdAt);
        if (!fileName || !createdAt) {
          return [];
        }
        return [
          {
            fileName,
            createdAt,
            sizeBytes: count(item.sizeBytes),
            gzipValid: boolean(item.gzipValid),
          },
        ];
      })
    : [];

  return {
    checkedAt: isoDate(value.checkedAt),
    lastBackupAt: isoDate(value.lastBackupAt),
    fileName: nullableText(value.fileName, 200),
    sizeBytes: nullableCount(value.sizeBytes),
    success: nullableBoolean(value.success),
    retentionCount: count(value.retentionCount),
    availableBackups: count(value.availableBackups),
    directory: nullableText(value.directory, 300),
    errorSummary: nullableText(value.errorSummary, 240),
    backups,
  };
}

async function readJsonFile(directory: string, fileName: OpsDataFile) {
  try {
    const filePath = path.join(directory, fileName);
    const stats = await fs.stat(filePath);
    if (!stats.isFile() || stats.size > MAX_JSON_BYTES) {
      return null;
    }
    return JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

export async function readOpsData(): Promise<OpsDataEnvelope> {
  const directory =
    process.env.OPS_DATA_DIR || path.join(process.cwd(), "runtime", "ops");
  const entries = await Promise.all(
    OPS_DATA_FILES.map(async (fileName) => [
      fileName,
      await readJsonFile(directory, fileName),
    ] as const),
  );
  const files = Object.fromEntries(entries) as Record<OpsDataFile, unknown>;
  const missingFiles = entries
    .filter(([, value]) => value === null)
    .map(([fileName]) => fileName);
  const hasRuntimeData = missingFiles.length < OPS_DATA_FILES.length;

  if (
    !hasRuntimeData &&
    process.env.NODE_ENV !== "production" &&
    process.env.OPS_USE_MOCK_DATA === "true"
  ) {
    return createMockOpsData();
  }

  return {
    source: hasRuntimeData ? "runtime" : "empty",
    generatedAt: new Date().toISOString(),
    missingFiles,
    status: parseStatus(files["status.json"]),
    access: parseAccess(files["access-summary.json"]),
    securityEvents: parseSecurityEvents(files["security-events.json"]),
    backup: parseBackup(files["backup-status.json"]),
  };
}

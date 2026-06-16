export const OPS_DATA_FILES = [
  "status.json",
  "access-summary.json",
  "security-events.json",
  "backup-status.json",
] as const;

export type OpsDataFile = (typeof OPS_DATA_FILES)[number];
export type OpsDataSource = "runtime" | "mock" | "empty";
export type AvailabilityStatus = "healthy" | "unhealthy" | "unknown";
export type ContainerState = "running" | "stopped" | "unknown";
export type DatabaseHealth = "healthy" | "unhealthy" | "unknown";
export type RiskLevel = "low" | "medium" | "high";
export type ClusterHealth = "healthy" | "degraded" | "down" | "unknown";
export type TrafficClassification =
  | "visitor"
  | "search-engine"
  | "scanner"
  | "internal"
  | "suspicious";

export type EndpointStatus = {
  status: AvailabilityStatus;
  httpStatus: number | null;
};

export type ContainerStatus = {
  state: ContainerState;
  health: DatabaseHealth;
  restartCount: number;
};

export type OpsHostMetrics = {
  cpuPercent: number | null;
  memoryPercent: number | null;
  diskPercent: number | null;
  uptimeSeconds: number | null;
};

export type OpsServiceStatus = {
  checkedAt: string | null;
  host: OpsHostMetrics;
  clusterHealth: ClusterHealth;
  website: EndpointStatus;
  blog: EndpointStatus;
  waline: EndpointStatus;
  nginx: ContainerStatus;
  web: ContainerStatus;
  webPrimary: ContainerStatus;
  webReplica: ContainerStatus;
  walineContainer: ContainerStatus;
  mysql: ContainerStatus;
  uptimeKuma: ContainerStatus;
  goaccess: ContainerStatus;
};

export type OpsCountItem = {
  label: string;
  count: number;
};

export type OpsHourlyAccessItem = {
  time: string;
  requests: number;
  errors: number;
  notFound: number;
  serverErrors: number;
};

export type OpsAccessRecord = {
  time: string;
  ip: string;
  method: string;
  path: string;
  statusCode: number;
  referer: string;
  userAgent: string;
  risk: RiskLevel | null;
  classification: TrafficClassification;
};

export type OpsAccessSummary = {
  generatedAt: string | null;
  todayRequests: number;
  last24hRequests: number;
  notFoundCount: number;
  serverErrorCount: number;
  sampleTruncated: boolean;
  estimatedVisitors: number;
  requestsByHour: OpsHourlyAccessItem[];
  trafficClasses: OpsCountItem[];
  topPaths: OpsCountItem[];
  statusCodes: OpsCountItem[];
  topIps: OpsCountItem[];
  recent: OpsAccessRecord[];
};

export type OpsSecurityEvent = {
  ip: string;
  path: string;
  rule: string;
  count: number;
  lastSeenAt: string;
  level: RiskLevel;
};

export type OpsBackupStatus = {
  checkedAt: string | null;
  lastBackupAt: string | null;
  fileName: string | null;
  sizeBytes: number | null;
  success: boolean | null;
  retentionCount: number;
  availableBackups: number;
  directory: string | null;
  errorSummary: string | null;
  backups: OpsBackupItem[];
};

export type OpsBackupItem = {
  fileName: string;
  createdAt: string;
  sizeBytes: number;
  gzipValid: boolean;
};

export type OpsDataEnvelope = {
  source: OpsDataSource;
  generatedAt: string;
  missingFiles: OpsDataFile[];
  status: OpsServiceStatus;
  access: OpsAccessSummary;
  securityEvents: OpsSecurityEvent[];
  backup: OpsBackupStatus;
};

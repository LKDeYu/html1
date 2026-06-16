import type { OpsDataEnvelope } from "./types.ts";

export function createMockOpsData(): OpsDataEnvelope {
  const generatedAt = new Date().toISOString();
  const currentHour = new Date(generatedAt);
  currentHour.setMinutes(0, 0, 0);
  const requestsByHour = Array.from({ length: 24 }, (_, index) => {
    const time = new Date(currentHour);
    time.setHours(currentHour.getHours() - (23 - index));
    const requests = 12 + ((index * 17) % 38);
    const notFound = index % 7 === 0 ? 2 : index % 5 === 0 ? 1 : 0;
    const serverErrors = index === 18 ? 1 : 0;
    return {
      time: time.toISOString(),
      requests,
      errors: notFound + serverErrors,
      notFound,
      serverErrors,
    };
  });

  return {
    source: "mock",
    generatedAt,
    missingFiles: [],
    status: {
      checkedAt: generatedAt,
      host: {
        cpuPercent: 18.4,
        memoryPercent: 47.2,
        diskPercent: 36.8,
        uptimeSeconds: 528400,
      },
      clusterHealth: "healthy",
      website: { status: "healthy", httpStatus: 200 },
      blog: { status: "healthy", httpStatus: 200 },
      waline: { status: "healthy", httpStatus: 200 },
      nginx: { state: "running", health: "unknown", restartCount: 0 },
      web: { state: "running", health: "healthy", restartCount: 0 },
      webPrimary: { state: "running", health: "healthy", restartCount: 0 },
      webReplica: { state: "running", health: "healthy", restartCount: 0 },
      walineContainer: { state: "running", health: "unknown", restartCount: 0 },
      mysql: { state: "running", health: "healthy", restartCount: 0 },
      uptimeKuma: { state: "running", health: "unknown", restartCount: 0 },
      goaccess: { state: "running", health: "unknown", restartCount: 0 },
    },
    access: {
      generatedAt,
      todayRequests: 486,
      last24hRequests: 731,
      notFoundCount: 18,
      serverErrorCount: 1,
      sampleTruncated: false,
      estimatedVisitors: 183,
      requestsByHour,
      trafficClasses: [
        { label: "visitor", count: 621 },
        { label: "search-engine", count: 54 },
        { label: "internal", count: 38 },
        { label: "scanner", count: 15 },
        { label: "suspicious", count: 3 },
      ],
      topPaths: [
        { label: "/", count: 124 },
        { label: "/blog/home", count: 92 },
        { label: "/waline/api/comment", count: 71 },
        { label: "/blog/interest-reading", count: 56 },
      ],
      statusCodes: [
        { label: "200", count: 674 },
        { label: "304", count: 38 },
        { label: "404", count: 18 },
        { label: "502", count: 1 },
      ],
      topIps: [
        { label: "203.0.113.42", count: 92 },
        { label: "198.51.100.18", count: 64 },
        { label: "192.0.2.77", count: 41 },
      ],
      recent: [
        {
          time: generatedAt,
          ip: "203.0.113.42",
          method: "GET",
          path: "/blog/home",
          statusCode: 200,
          referer: "/",
          userAgent: "Chrome 148 / Windows",
          risk: null,
          classification: "visitor",
        },
        {
          time: generatedAt,
          ip: "198.51.100.18",
          method: "GET",
          path: "/.env",
          statusCode: 404,
          referer: "-",
          userAgent: "curl",
          risk: "high",
          classification: "suspicious",
        },
      ],
    },
    securityEvents: [
      {
        ip: "198.51.100.18",
        path: "/.env",
        rule: "Sensitive file probe",
        count: 3,
        lastSeenAt: generatedAt,
        level: "high",
      },
      {
        ip: "192.0.2.77",
        path: "/wp-admin",
        rule: "CMS scanner",
        count: 8,
        lastSeenAt: generatedAt,
        level: "medium",
      },
    ],
    backup: {
      checkedAt: generatedAt,
      lastBackupAt: generatedAt,
      fileName: "waline-20260611-033000.sql.gz",
      sizeBytes: 182400,
      success: true,
      retentionCount: 7,
      availableBackups: 4,
      directory: "/var/backups/coordinate-zero/mysql",
      errorSummary: null,
      backups: [
        {
          fileName: "waline-20260611-033000.sql.gz",
          createdAt: generatedAt,
          sizeBytes: 182400,
          gzipValid: true,
        },
      ],
    },
  };
}

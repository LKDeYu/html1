import type { OpsDataEnvelope } from "@/lib/ops/types";

export function createMockOpsData(): OpsDataEnvelope {
  const generatedAt = new Date().toISOString();

  return {
    source: "mock",
    generatedAt,
    missingFiles: [],
    status: {
      checkedAt: generatedAt,
      website: { status: "healthy", httpStatus: 200 },
      blog: { status: "healthy", httpStatus: 200 },
      waline: { status: "healthy", httpStatus: 200 },
      nginx: { state: "running", health: "unknown" },
      web: { state: "running", health: "unknown" },
      walineContainer: { state: "running", health: "unknown" },
      mysql: { state: "running", health: "healthy" },
    },
    access: {
      generatedAt,
      todayRequests: 486,
      last24hRequests: 731,
      notFoundCount: 18,
      serverErrorCount: 1,
      sampleTruncated: false,
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
        { label: "203.0.113.18", count: 92 },
        { label: "198.51.100.27", count: 64 },
        { label: "192.0.2.45", count: 41 },
      ],
      recent: [
        {
          time: generatedAt,
          ip: "203.0.113.18",
          method: "GET",
          path: "/blog/home",
          statusCode: 200,
          referer: "/",
          userAgent: "Chrome 148 / Windows",
          risk: null,
        },
        {
          time: generatedAt,
          ip: "198.51.100.27",
          method: "GET",
          path: "/.env",
          statusCode: 404,
          referer: "-",
          userAgent: "curl",
          risk: "high",
        },
      ],
    },
    securityEvents: [
      {
        ip: "198.51.100.27",
        path: "/.env",
        rule: "Sensitive file probe",
        count: 3,
        lastSeenAt: generatedAt,
        level: "high",
      },
      {
        ip: "192.0.2.45",
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
    },
  };
}

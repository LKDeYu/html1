export const REPLICA_ID_HEADER = "X-Web-Replica";

const REPLICA_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function normalizeReplicaId(value: string | undefined): string {
  const replicaId = value?.trim().toLowerCase();
  return replicaId && REPLICA_ID_PATTERN.test(replicaId)
    ? replicaId
    : "web-unknown";
}

export function getReplicaId(): string {
  return normalizeReplicaId(process.env.WEB_REPLICA_ID);
}

export function createHealthPayload(replicaId: string) {
  return {
    status: "ok" as const,
    replica: normalizeReplicaId(replicaId),
  };
}

interface InstanceRuntime {
  hostname: string;
  pid: number;
  uptimeSeconds: number;
}

export function createInstancePayload(
  replicaId: string,
  runtime: InstanceRuntime,
) {
  return {
    replica: normalizeReplicaId(replicaId),
    hostname: runtime.hostname.slice(0, 128),
    pid: runtime.pid,
    uptimeSeconds: Math.max(0, Math.floor(runtime.uptimeSeconds)),
  };
}

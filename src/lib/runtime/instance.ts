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

export function createHealthPayload(
  replicaId: string,
  checkedAt = new Date(),
) {
  return {
    status: "ok" as const,
    replica: normalizeReplicaId(replicaId),
    checkedAt: checkedAt.toISOString(),
  };
}

export function createInstancePayload(
  replicaId: string,
  time = new Date(),
) {
  return {
    replica: normalizeReplicaId(replicaId),
    time: time.toISOString(),
  };
}

import { NextResponse } from "next/server";

import {
  createInstancePayload,
  getReplicaId,
  REPLICA_ID_HEADER,
} from "@/lib/runtime/instance";

export const dynamic = "force-dynamic";

export function GET() {
  const replicaId = getReplicaId();
  const payload = createInstancePayload(replicaId);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
      [REPLICA_ID_HEADER]: replicaId,
    },
  });
}

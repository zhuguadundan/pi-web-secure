import { NextResponse } from "next/server";
import { getRunningRpcSessionIds } from "@/lib/rpc-manager";

export const dynamic = "force-dynamic";

// Lightweight snapshot used by visible browser tabs. A short poll is more
// resilient than a second long-lived SSE broadcaster on mobile and proxies.
export async function GET() {
  return NextResponse.json(
    { runningSessionIds: getRunningRpcSessionIds() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { isEventIncludedInSnapshot, toClientAgentEvent } from "@/lib/agent-event-wire";
import { resolveSessionPath } from "@/lib/session-reader";
import { getRpcSession, startRpcSession } from "@/lib/rpc-manager";
import { SessionManager } from "@earendil-works/pi-coding-agent";

export const dynamic = "force-dynamic";

// GET /api/agent/[id]/events - SSE stream of agent events
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fast path: already-running session
  let session = getRpcSession(id);
  if (!session || !session.isAlive()) {
    const filePath = await resolveSessionPath(id);
    if (!filePath) {
      return new Response("Session not found", { status: 404 });
    }
    const cwd = SessionManager.open(filePath).getHeader()?.cwd ?? process.cwd();
    try {
      ({ session } = await startRpcSession(id, filePath, cwd));
    } catch (error) {
      return new Response(`Failed to start agent: ${error}`, { status: 500 });
    }
  }

  let cancelStream: (() => void) | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const encode = (data: unknown) => {
        const text = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(text));
      };

      // Subscribe before taking the snapshot. Events emitted during snapshot
      // publication are buffered so there is no connection-time loss window.
      const bufferedEvents: Parameters<typeof toClientAgentEvent>[0][] = [];
      let snapshotPublished = false;
      const snapshot = { message: undefined as unknown };
      const forwardEvent = (event: Parameters<typeof toClientAgentEvent>[0]) => {
        if (isEventIncludedInSnapshot(event, snapshot.message)) return;
        const clientEvent = toClientAgentEvent(event);
        if (clientEvent) encode(clientEvent);
      };
      const unsubscribe = session.onEvent((event) => {
        if (!snapshotPublished) {
          bufferedEvents.push(event);
          return;
        }
        forwardEvent(event);
      });

      snapshot.message = session.streamingMessage;
      encode({
        type: "connected",
        sessionId: id,
        isRunning: session.isRunning(),
        isStreaming: session.isStreaming,
      });
      if (snapshot.message) encode({ type: "message_start", message: snapshot.message });
      snapshotPublished = true;
      // Events captured after the snapshot are replayed against that baseline.
      // An agent_end in this buffer must remain after the snapshot so it cannot
      // be followed by a stale streaming bubble.
      for (const event of bufferedEvents) forwardEvent(event);

      // Heartbeat every 30s to prevent server/proxy timeout (Next.js default ~120-150s)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(":\n\n"));
        } catch {
          // controller already closed
        }
      }, 30_000);

      // Cleanup is idempotent because request abort and stream cancellation can
      // race when a browser tab closes or a proxy tears down the response.
      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        clearInterval(heartbeat);
        unsubscribe();
        try { controller.close(); } catch { /* already closed */ }
      };
      cancelStream = cleanup;

      // Detect client disconnect via abort signal
      req.signal?.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      cancelStream?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

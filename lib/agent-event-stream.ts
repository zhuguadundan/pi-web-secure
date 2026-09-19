/**
 * Registry of live agent SSE streams, closed from the SIGINT/SIGTERM hook in
 * instrumentation.ts.
 *
 * In production Next 16 answers those signals with server.close() and waits
 * for every connection to end, with no timeout. An SSE stream only ends when
 * the client disconnects, so without this the process stops listening but
 * never exits.
 *
 * instrumentation.ts and the route handlers are bundled into separate module
 * graphs. Symbol.for + globalThis shares one registry across those graphs.
 */
const CLOSER_REGISTRY: symbol = Symbol.for("pi-web.agentEventStreamClosers");

type StreamCloser = () => void;

function getActiveStreamClosers(): Set<StreamCloser> {
  const store = globalThis as Record<symbol, Set<StreamCloser>>;
  return (store[CLOSER_REGISTRY] ??= new Set<StreamCloser>());
}

export function closeAllAgentEventStreams(): void {
  for (const close of [...getActiveStreamClosers()]) {
    try { close(); } catch { /* stream already closed */ }
  }
}

export function registerAgentEventStreamCloser(close: StreamCloser): () => void {
  const closers = getActiveStreamClosers();
  closers.add(close);
  return () => closers.delete(close);
}

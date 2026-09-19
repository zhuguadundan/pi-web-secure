"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { SessionInfo } from "@/lib/types";
import type { SessionSearchResponse } from "@/lib/session-search";

function formatRelativeTime(value: string): string {
  const then = Date.parse(value);
  if (!Number.isFinite(then)) return value;
  const deltaSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(deltaSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 60) return rtf.format(deltaSec, "second");
  if (abs < 3600) return rtf.format(Math.round(deltaSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(deltaSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(deltaSec / 86400), "day");
  return rtf.format(Math.round(deltaSec / (86400 * 30)), "month");
}

export function SessionSearch({
  open,
  query,
  refreshKey,
  children,
  selectedSessionId,
  onSelectSession,
}: {
  open: boolean;
  query: string;
  refreshKey: number | null;
  children: ReactNode;
  selectedSessionId: string | null;
  onSelectSession: (session: SessionInfo, entryId?: string, blockIndex?: number) => void;
}) {
  const [state, setState] = useState<{ query: string; response?: SessionSearchResponse; failed?: boolean }>({ query: "" });
  const search = query.trim();
  const response = state.query === search ? state.response : undefined;
  const failed = state.query === search && state.failed;

  useEffect(() => {
    if (!open || !search) return;
    const controller = new AbortController();
    setState({ query: search });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sessions/search?${new URLSearchParams({ q: search })}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as SessionSearchResponse;
        if (!controller.signal.aborted) setState({ query: search, response: data });
      } catch {
        if (!controller.signal.aborted) setState({ query: search, failed: true });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, search, refreshKey]);

  if (!open || !search) return children;

  const status = failed
    ? "Search failed"
    : !response
      ? "Searching…"
      : response.results.length === 0
        ? "No matching messages"
        : `${response.results.length} match${response.results.length === 1 ? "" : "es"}`;

  return (
    <div style={{ flex: 1, minHeight: 80, overflowY: "auto" }} aria-busy={!response && !failed}>
      <div role="status" style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-muted)" }}>
        {status}
      </div>
      {response?.truncated && (
        <div role="status" style={{ padding: "0 12px 8px", fontSize: 11, color: "var(--text-dim)" }}>
          Partial results — newest sessions only
        </div>
      )}
      {response?.results.map(({ session, entryId, blockIndex, before, match, after }) => {
        const selected = session.id === selectedSessionId;
        return (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelectSession(session, entryId, blockIndex)}
            aria-current={selected ? "true" : undefined}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 12px",
              border: "none",
              borderBottom: "1px solid var(--border)",
              background: selected ? "var(--bg-selected)" : "transparent",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              if (!selected) e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = selected ? "var(--bg-selected)" : "transparent";
            }}
          >
            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
              {session.name || session.firstMessage}
            </span>
            <span style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 10, color: "var(--text-dim)" }}>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={session.cwd}>
                {session.cwd}
              </span>
              <span style={{ flexShrink: 0 }}>{formatRelativeTime(session.modified)}</span>
            </span>
            <span style={{ display: "block", marginTop: 4, fontSize: 11, lineHeight: 1.45, color: "var(--text-muted)", overflowWrap: "anywhere" }}>
              {before}<mark className="session-search-hit">{match}</mark>{after}
            </span>
          </button>
        );
      })}
    </div>
  );
}

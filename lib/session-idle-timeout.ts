export const DEFAULT_SESSION_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_SESSION_IDLE_TIMEOUT_MS = 2_147_483_647;

/**
 * Resolves PI_WEB_IDLE_TIMEOUT_MS into a session idle timeout.
 * 0 disables idle shutdown. Invalid values fall back to 10 minutes.
 */
export function resolveSessionIdleTimeoutMs(
  rawValue: string | undefined = process.env.PI_WEB_IDLE_TIMEOUT_MS,
): number {
  if (rawValue === undefined) return DEFAULT_SESSION_IDLE_TIMEOUT_MS;
  const trimmed = rawValue.trim();
  if (trimmed === "") return DEFAULT_SESSION_IDLE_TIMEOUT_MS;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_SESSION_IDLE_TIMEOUT_MS) {
    console.warn(`[pi-web] invalid PI_WEB_IDLE_TIMEOUT_MS "${rawValue}", falling back to 10 minutes`);
    return DEFAULT_SESSION_IDLE_TIMEOUT_MS;
  }
  return parsed;
}

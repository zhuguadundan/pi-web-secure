import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "pi_web_session";
export const AUTH_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const MIN_AUTH_PASSWORD_LENGTH = 10;

const TOKEN_VERSION = "v1";

export function getAuthPassword(): string | null {
  const password = process.env.PI_WEB_AUTH_PASSWORD;
  return password && password.length > 0 ? password : null;
}

export function isAuthEnabled(): boolean {
  return getAuthPassword() !== null;
}

export function isAuthPasswordValid(password: string): boolean {
  return password.length >= MIN_AUTH_PASSWORD_LENGTH;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function signingKey(password: string): Buffer {
  return createHash("sha256")
    .update("pi-web-auth-signing-key-v1\0", "utf8")
    .update(password, "utf8")
    .digest();
}

function sign(payload: string, password: string): string {
  return createHmac("sha256", signingKey(password))
    .update(payload, "utf8")
    .digest("base64url");
}

export function passwordsMatch(candidate: string, expected: string): boolean {
  return timingSafeEqual(digest(candidate), digest(expected));
}

export function createAuthToken(
  password: string,
  now = Date.now(),
): string {
  const expiresAt = Math.floor(now / 1000) + AUTH_SESSION_MAX_AGE_SECONDS;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload, password)}`;
}

export function verifyAuthToken(
  token: string | undefined,
  password: string,
  now = Date.now(),
): boolean {
  if (!token) return false;

  const [version, expiresAtRaw, signature, ...extra] = token.split(".");
  if (extra.length > 0 || version !== TOKEN_VERSION || !expiresAtRaw || !signature) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  const nowSeconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowSeconds) return false;
  if (expiresAt > nowSeconds + AUTH_SESSION_MAX_AGE_SECONDS + 60) return false;

  const expected = sign(`${version}.${expiresAtRaw}`, password);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isUnsafeCrossSiteRequest(request: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "none") return false;
  if (fetchSite === "cross-site") return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const requestHost = forwardedHost || request.headers.get("host") || new URL(request.url).host;
    return originUrl.host !== requestHost;
  } catch {
    return true;
  }
}

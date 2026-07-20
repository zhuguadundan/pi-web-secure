import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_SECONDS,
  MIN_AUTH_PASSWORD_LENGTH,
  createAuthToken,
  getAuthPassword,
  isAuthPasswordValid,
  passwordsMatch,
} from "@/lib/web-auth";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProto) return forwardedProto === "https";
  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const configuredPassword = getAuthPassword();
  if (!configuredPassword) {
    return NextResponse.json({ success: true, authDisabled: true }, { headers: NO_STORE_HEADERS });
  }

  if (!isAuthPasswordValid(configuredPassword)) {
    console.error(`PI_WEB_AUTH_PASSWORD must be at least ${MIN_AUTH_PASSWORD_LENGTH} characters`);
    return NextResponse.json(
      { error: "Authentication is not configured safely" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  let candidate = "";
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 4096) throw new Error("Request too large");
    const body = await request.json() as { password?: unknown };
    if (typeof body.password === "string" && body.password.length <= 1024) {
      candidate = body.password;
    }
  } catch {
    // Return the same response as an incorrect password.
  }

  if (!passwordsMatch(candidate, configuredPassword)) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const response = NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: createAuthToken(configuredPassword),
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

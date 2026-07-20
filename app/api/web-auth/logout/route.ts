import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/web-auth";

export async function POST(request: Request) {
  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https" || new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 0,
  });
  return response;
}

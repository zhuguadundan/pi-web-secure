import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_SESSION_MAX_AGE_SECONDS,
  createAuthToken,
  isAuthPasswordValid,
  isUnsafeCrossSiteRequest,
  passwordsMatch,
  verifyAuthToken,
} from "./web-auth.ts";

const PASSWORD = "correct-horse-battery-staple";

test("auth tokens are signed, expire, and change with the password", () => {
  const now = Date.UTC(2026, 0, 1);
  const token = createAuthToken(PASSWORD, now);

  assert.equal(verifyAuthToken(token, PASSWORD, now), true);
  assert.equal(verifyAuthToken(token, "a-different-long-password", now), false);
  assert.equal(
    verifyAuthToken(token, PASSWORD, now + (AUTH_SESSION_MAX_AGE_SECONDS + 1) * 1000),
    false,
  );
  assert.equal(verifyAuthToken(`${token}tampered`, PASSWORD, now), false);
});

test("password validation and comparison enforce the configured minimum", () => {
  assert.equal(isAuthPasswordValid("1234567890"), true);
  assert.equal(isAuthPasswordValid("123456789"), false);
  assert.equal(passwordsMatch(PASSWORD, PASSWORD), true);
  assert.equal(passwordsMatch("wrong", PASSWORD), false);
});

test("cross-site writes are rejected without blocking same-origin requests", () => {
  const crossSite = new Request("https://pi.example/api/agent/new", {
    method: "POST",
    headers: { "sec-fetch-site": "cross-site", origin: "https://evil.example" },
  });
  const sameOrigin = new Request("https://pi.example/api/agent/new", {
    method: "POST",
    headers: { "sec-fetch-site": "same-origin", origin: "https://pi.example" },
  });
  const legacySameOrigin = new Request("https://pi.example/api/agent/new", {
    method: "POST",
    headers: { origin: "https://pi.example", host: "pi.example" },
  });

  assert.equal(isUnsafeCrossSiteRequest(crossSite), true);
  assert.equal(isUnsafeCrossSiteRequest(sameOrigin), false);
  assert.equal(isUnsafeCrossSiteRequest(legacySameOrigin), false);
});

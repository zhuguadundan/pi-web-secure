import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SESSION_IDLE_TIMEOUT_MS, resolveSessionIdleTimeoutMs } from "./session-idle-timeout.ts";

test("defaults to the 10-minute idle timeout when the env var is unset or blank", () => {
  assert.equal(resolveSessionIdleTimeoutMs(), DEFAULT_SESSION_IDLE_TIMEOUT_MS);
  assert.equal(resolveSessionIdleTimeoutMs(""), DEFAULT_SESSION_IDLE_TIMEOUT_MS);
  assert.equal(resolveSessionIdleTimeoutMs("   "), DEFAULT_SESSION_IDLE_TIMEOUT_MS);
});

test("treats zero as disabling idle shutdown", () => {
  assert.equal(resolveSessionIdleTimeoutMs("0"), 0);
});

test("uses a positive value as the timeout in milliseconds", () => {
  assert.equal(resolveSessionIdleTimeoutMs("1800000"), 1_800_000);
  assert.equal(resolveSessionIdleTimeoutMs("2147483647"), 2_147_483_647);
});

test("falls back to the 10-minute default and warns for invalid or out-of-range values", (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  assert.equal(resolveSessionIdleTimeoutMs("abc"), DEFAULT_SESSION_IDLE_TIMEOUT_MS);
  assert.equal(resolveSessionIdleTimeoutMs("-5"), DEFAULT_SESSION_IDLE_TIMEOUT_MS);
  assert.equal(resolveSessionIdleTimeoutMs("NaN"), DEFAULT_SESSION_IDLE_TIMEOUT_MS);
  assert.equal(resolveSessionIdleTimeoutMs("Infinity"), DEFAULT_SESSION_IDLE_TIMEOUT_MS);
  assert.equal(resolveSessionIdleTimeoutMs("2147483648"), DEFAULT_SESSION_IDLE_TIMEOUT_MS);
  assert.equal(warn.mock.callCount(), 5);
});

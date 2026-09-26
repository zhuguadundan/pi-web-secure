import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

/**
 * Pi eagerly resolves every derived theme color while constructing `Theme`, and
 * the web RPC manager builds one at module scope. A missing color source makes
 * the import itself throw (`undefined.startsWith`), which breaks `next build`
 * and every route that loads the RPC manager. Importing the module is the
 * assertion: it must not throw against the installed Pi version.
 */
const { PLAIN_TEXT_THEME, PlainTextTheme } = await jiti.import("./plain-text-theme.ts");

test("plain text theme constructs against the installed Pi theme contract", () => {
  assert.ok(PLAIN_TEXT_THEME instanceof PlainTextTheme);
  assert.doesNotThrow(() => new PlainTextTheme());
});

test("plain text theme strips ANSI styling for the web UI", () => {
  const theme = PLAIN_TEXT_THEME;
  assert.equal(theme.fg("text", "hello"), "hello");
  assert.equal(theme.bg("selectedBg", "hello"), "hello");
  assert.equal(theme.bold("hello"), "hello");
  assert.equal(theme.italic("hello"), "hello");
  assert.equal(theme.underline("hello"), "hello");
  assert.equal(theme.inverse("hello"), "hello");
  assert.equal(theme.strikethrough("hello"), "hello");
  assert.equal(theme.getFgAnsi(), "");
  assert.equal(theme.getBgAnsi(), "");
  assert.equal(theme.getThinkingBorderColor()("hello"), "hello");
  assert.equal(theme.getBashModeBorderColor()("hello"), "hello");
  assert.doesNotMatch(theme.bold("hello"), /\u001b\[/);
});

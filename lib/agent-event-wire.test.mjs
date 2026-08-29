import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { isEventIncludedInSnapshot, toClientAgentEvent } = await jiti.import("./agent-event-wire.ts");

function assistantMessage(text) {
  return { role: "assistant", content: [{ type: "text", text }], provider: "test", model: "test", timestamp: 1 };
}

test("projects message updates onto the Pi 0.84 delta shape", () => {
  const partial = assistantMessage("Hello");
  const projected = toClientAgentEvent({
    type: "message_update",
    message: partial,
    assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "o", partial },
  });
  assert.deepEqual(projected, {
    type: "message_update",
    assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "o" },
  });
});

test("keeps tool identity while omitting cumulative partials", () => {
  const partial = {
    ...assistantMessage(""),
    content: [{ type: "toolCall", id: "call-1", name: "write", arguments: {}, partialJson: "" }],
  };
  assert.deepEqual(toClientAgentEvent({
    type: "message_update",
    message: partial,
    assistantMessageEvent: { type: "toolcall_start", contentIndex: 0, partial },
  }), {
    type: "message_update",
    assistantMessageEvent: { type: "toolcall_start", contentIndex: 0, id: "call-1", toolName: "write" },
  });
});

test("recognizes reconnect events already represented by the snapshot", () => {
  const snapshot = assistantMessage("Hello");
  assert.equal(isEventIncludedInSnapshot({ type: "message_update", message: snapshot }, snapshot), true);
  assert.equal(isEventIncludedInSnapshot({ type: "message_end", message: snapshot }, snapshot), false);
});

function projectedBytes(totalLength) {
  const chunkSize = 64;
  let text = "";
  let bytes = 0;
  for (let offset = 0; offset < totalLength; offset += chunkSize) {
    const chunk = "x".repeat(Math.min(chunkSize, totalLength - offset));
    text += chunk;
    const partial = assistantMessage(text);
    const projected = toClientAgentEvent({
      type: "message_update",
      message: partial,
      assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: chunk, partial },
    });
    bytes += Buffer.byteLength(JSON.stringify(projected));
  }
  return bytes;
}

test("serialized streaming traffic grows linearly", () => {
  const twoKiB = projectedBytes(2 * 1024);
  const fourKiB = projectedBytes(4 * 1024);
  assert.ok(fourKiB / twoKiB < 2.2);
});

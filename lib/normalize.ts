import type { AgentMessage, AssistantMessage, ToolCallContent } from "./types";

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function normalizeToolCallBlock(block: unknown, includeStreamingRawInput = false): ToolCallContent | null {
  if (!isObject(block) || block.type !== "toolCall") return null;
  return {
    type: "toolCall",
    toolCallId: typeof block.toolCallId === "string" ? block.toolCallId : (typeof block.id === "string" ? block.id : ""),
    toolName: typeof block.toolName === "string" ? block.toolName : (typeof block.name === "string" ? block.name : ""),
    input: typeof block.input === "object" && block.input !== null && !Array.isArray(block.input)
      ? block.input as Record<string, unknown>
      : (typeof block.arguments === "object" && block.arguments !== null && !Array.isArray(block.arguments)
        ? block.arguments as Record<string, unknown>
        : {}),
    ...(includeStreamingRawInput && typeof block.partialJson === "string" ? { rawInput: block.partialJson } : {}),
  };
}

function normalizeAssistantToolCalls(msg: AgentMessage, includeStreamingRawInput = false): AgentMessage {
  if (msg.role !== "assistant") return msg;
  const content = (msg as AssistantMessage).content;
  if (!Array.isArray(content)) return msg;
  const normalized = content.map((block) => normalizeToolCallBlock(block, includeStreamingRawInput) ?? block);
  return { ...msg, content: normalized } as AgentMessage;
}

export function normalizeToolCalls(msg: AgentMessage): AgentMessage {
  return normalizeAssistantToolCalls(msg);
}

export function normalizeStreamingToolCalls(msg: AgentMessage): AgentMessage {
  return normalizeAssistantToolCalls(msg, true);
}

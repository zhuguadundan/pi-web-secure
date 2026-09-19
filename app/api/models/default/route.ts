import { NextResponse } from "next/server";
import { createAgentSessionServices, getAgentDir } from "@earendil-works/pi-coding-agent";
import { invalidateModelsCache } from "@/lib/models-cache";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PUT(req: Request) {
  try {
    const body = await req.json() as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "JSON object required" }, { status: 400, headers: NO_STORE });
    }
    const provider = typeof body.provider === "string" ? body.provider.trim() : "";
    const modelId = typeof body.modelId === "string" ? body.modelId.trim() : "";
    if (!provider || !modelId) {
      return NextResponse.json({ error: "provider and modelId are required" }, { status: 400, headers: NO_STORE });
    }

    const agentDir = getAgentDir();
    const services = await createAgentSessionServices({ cwd: process.cwd(), agentDir });
    services.settingsManager.setDefaultModelAndProvider(provider, modelId);
    await services.settingsManager.flush();
    invalidateModelsCache();

    return NextResponse.json({ success: true, defaultModel: { provider, modelId } }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500, headers: NO_STORE });
  }
}

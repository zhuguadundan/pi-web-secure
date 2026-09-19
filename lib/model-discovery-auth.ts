import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { ModelRuntime } from "@earendil-works/pi-coding-agent";

export interface ModelDiscoveryAuth {
  apiKey?: string;
  headers: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

/**
 * Resolve the effective credential for a models.json provider entry by loading
 * it through a throwaway ModelRuntime with a placeholder model. This reuses
 * pi's own auth resolution — env-var key names, "!shell-command" keys, OAuth
 * credentials from the real agent dir, and compatibility headers — instead of
 * reimplementing any of it here. The temp models.json is deleted afterwards.
 */
export async function resolveModelDiscoveryAuth(
  providerName: string,
  provider: Record<string, unknown>,
): Promise<ModelDiscoveryAuth> {
  let tempDir: string | undefined;
  try {
    tempDir = mkdtempSync(join(tmpdir(), "pi-web-model-discovery-"));
    const modelsPath = join(tempDir, "models.json");
    const discoveryModelId = "__pi_web_model_discovery__";
    writeFileSync(modelsPath, JSON.stringify({
      providers: {
        [providerName]: {
          ...provider,
          models: [{ id: discoveryModelId }],
        },
      },
    }, null, 2), "utf8");

    const modelRuntime = await ModelRuntime.create({ modelsPath });
    const loadError = modelRuntime.getError();
    if (loadError) throw new Error(loadError);
    const model = modelRuntime.getModel(providerName, discoveryModelId);
    if (!model) throw new Error(`Unable to load provider "${providerName}"`);

    const resolved = await modelRuntime.getAuth(model);
    if (resolved) {
      return {
        apiKey: resolved.auth.apiKey,
        headers: stringRecord(resolved.auth.headers),
      };
    }

    return {
      headers: stringRecord(modelRuntime.getCompatibilityRequestConfig(model).headers),
    };
  } finally {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  }
}

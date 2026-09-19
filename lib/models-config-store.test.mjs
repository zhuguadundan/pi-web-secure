import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const {
  normalizeModelsConfigCosts,
  readModelsConfig,
  writeModelsConfig,
} = await jiti.import("./models-config-store.ts");
const { invalidateModelsCache, loadModelsWithCache } = await jiti.import("./models-cache.ts");

function createTempRoot(t) {
  const root = mkdtempSync(join(tmpdir(), "pi-web-models-config-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function modelsData(id) {
  return {
    models: { [`provider:${id}`]: id },
    modelList: [{ id, name: id, provider: "provider" }],
    defaultModel: null,
    thinkingLevels: {},
    thinkingLevelMaps: {},
  };
}

test("saving models.json atomically invalidates the model-list cache", async (t) => {
  const root = createTempRoot(t);
  const modelsPath = join(root, "agent", "models.json");
  const config = {
    providers: {
      acme: {
        baseUrl: "https://models.example.test/v1",
        api: "openai-completions",
        models: [{ id: "acme-2" }],
      },
    },
  };
  let loads = 0;

  invalidateModelsCache();
  await loadModelsWithCache(root, async () => modelsData(`load-${++loads}`));
  writeModelsConfig(config, modelsPath);
  const reloaded = await loadModelsWithCache(root, async () => modelsData(`load-${++loads}`));

  assert.equal(loads, 2);
  assert.equal(reloaded.modelList[0].id, "load-2");
  assert.deepEqual(readModelsConfig(modelsPath), config);
  assert.deepEqual(readdirSync(join(root, "agent")), ["models.json"]);
  if (process.platform !== "win32") {
    assert.equal(statSync(modelsPath).mode & 0o777, 0o600);
  }
});

test("models.json writes fill partial cost groups with zero and remove empty groups", (t) => {
  const root = createTempRoot(t);
  const modelsPath = join(root, "agent", "models.json");
  const config = {
    providers: {
      acme: {
        models: [
          { id: "empty-cost", cost: {} },
          { id: "partial-cost", cost: { input: 1, output: 2, cacheRead: 0.1 } },
          { id: "complete-cost", cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.1 } },
        ],
        modelOverrides: {
          inherited: { cost: { input: 3 } },
        },
      },
    },
  };

  const normalized = normalizeModelsConfigCosts(config);
  assert.deepEqual(normalized.providers.acme.models, [
    { id: "empty-cost" },
    { id: "partial-cost", cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 0 } },
    { id: "complete-cost", cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.1 } },
  ]);
  assert.deepEqual(normalized.providers.acme.modelOverrides, {
    inherited: { cost: { input: 3 } },
  });
  assert.deepEqual(config.providers.acme.models[0], { id: "empty-cost", cost: {} });

  writeModelsConfig(config, modelsPath);
  assert.deepEqual(readModelsConfig(modelsPath), normalized);
});

test("saving models.json drops blank model rows without hiding other schema errors", (t) => {
  const root = createTempRoot(t);
  const modelsPath = join(root, "agent", "models.json");

  writeModelsConfig({
    providers: {
      acme: {
        baseUrl: "https://models.example.test/v1",
        api: "openai-completions",
        models: [
          { id: "working-model", cost: { input: 1 } },
          { id: "" },
          { id: "  " },
          { id: 42 },
          { name: "Missing identifier" },
          null,
        ],
      },
    },
  }, modelsPath);

  assert.deepEqual(readModelsConfig(modelsPath), {
    providers: {
      acme: {
        baseUrl: "https://models.example.test/v1",
        api: "openai-completions",
        models: [
          { id: "working-model", cost: { input: 1, output: 0, cacheRead: 0, cacheWrite: 0 } },
          { id: 42 },
          { name: "Missing identifier" },
          null,
        ],
      },
    },
  });
});

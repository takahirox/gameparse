import path from "node:path";
import { readFile } from "node:fs/promises";
import { hash, manifest } from "./io.mjs";

export async function identities(root, output) {
  const directories = {
    source: path.join(root, "src"),
    workers: path.join(root, "workers"),
    fixture: path.join(root, "fixture"),
    analysisInputs: path.join(output, "analysis-input"),
    analysisOutputs: path.join(output, "analysis-output"),
    analysisTools: path.join(output, "analyze-tool"),
    generatorInputs: path.join(output, "generator-input"),
    generatorTools: path.join(output, "generate-tool"),
    reconstruction: path.join(output, "reconstruction"),
  };
  const files = {
    protocol: path.join(root, "docs/initial-experiment.md"),
    condition: path.join(root, "docs/experiments/controlled-clock.md"),
    dependencies: path.join(root, "package-lock.json"),
    package: path.join(root, "package.json"),
    plan: path.join(output, "preregistration.json"),
    finalCases: path.join(output, "private-final.json"),
    analysisAudit: path.join(output, "analyze-audit.json"),
    generationAudit: path.join(output, "generate-audit.json"),
  };
  const result = {};
  for (const [name, directory] of Object.entries(directories))
    result[name] = await manifest(directory);
  for (const [name, file] of Object.entries(files))
    result[name] = hash(await readFile(file));
  return result;
}

export function assertIdentities(expected, actual) {
  const changed = [
    ...new Set([...Object.keys(expected), ...Object.keys(actual)]),
  ].filter(
    (key) => JSON.stringify(expected[key]) !== JSON.stringify(actual[key]),
  );
  if (changed.length)
    throw new Error(`Frozen artifacts changed: ${changed.join(", ")}`);
}

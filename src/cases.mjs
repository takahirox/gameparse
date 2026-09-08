import { readdir } from "node:fs/promises";
import path from "node:path";
import { readJSON } from "./io.mjs";

export const caseIdentity = (scenario) =>
  JSON.stringify({ duration: scenario.duration, events: scenario.events });

// Conservatively reserve every frozen set, even if a process failed before reporting.
export async function previousCases(artifacts, currentId) {
  const consumed = new Set();
  for (const name of await readdir(artifacts)) {
    if (name === currentId) continue;
    let data;
    try {
      data = await readJSON(path.join(artifacts, name, "private-final.json"));
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") continue;
      throw error;
    }
    if (!Array.isArray(data.cases))
      throw new Error(`Invalid prior case ledger: ${name}`);
    for (const scenario of data.cases) consumed.add(caseIdentity(scenario));
  }
  return consumed;
}

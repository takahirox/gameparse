import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { finalCases, recorded } from "../src/scenarios.mjs";
import { caseIdentity, previousCases } from "../src/cases.mjs";
import { assertIdentities } from "../src/integrity.mjs";
import { validateRecording } from "../src/validation.mjs";
import { compare } from "../src/evaluate.mjs";
test("new final runs exclude all consumed cases and fail explicitly on exhaustion", () => {
  const consumed = new Set();
  for (let i = 0; i < 4; i++)
    for (const s of finalCases(() => 0, consumed)) {
      assert.ok(!consumed.has(caseIdentity(s)));
      consumed.add(caseIdentity(s));
    }
  assert.throws(() => finalCases(() => 0, consumed), /exhausted/);
});
test("prior frozen cases are reserved even without a completed report", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "gameparse-ledger-"));
  try {
    await mkdir(path.join(directory, "old"));
    await writeFile(
      path.join(directory, "old/private-final.json"),
      JSON.stringify({ cases: finalCases(() => 0) }),
    );
    assert.equal((await previousCases(directory, "new")).size, 5);
    assert.equal((await previousCases(directory, "old")).size, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test("mutating evaluator or allowed inputs after freezing invalidates the run", () => {
  const frozen = {
    source: { "evaluate.mjs": "abc" },
    analysisInputs: { "frame.png": "123" },
  };
  assert.doesNotThrow(() => assertIdentities(frozen, structuredClone(frozen)));
  const changed = structuredClone(frozen);
  changed.source["evaluate.mjs"] = "modified";
  assert.throws(() => assertIdentities(frozen, changed), /source/);
  delete changed.analysisInputs;
  assert.throws(() => assertIdentities(frozen, changed), /analysisInputs/);
});
function recording() {
  const scenario = recorded[0];
  return {
    scenario,
    captureValid: true,
    cleanup: true,
    condition: "controlled-clock-image-only-v1",
    clock: { stepMs: 16, wallTimeClaim: false },
    pointerLock: false,
    inputModality: "left-button drag; no pointer lock",
    inputs: scenario.events.map((e) => ({
      ...e,
      dispatchTime: e.at,
      acknowledgmentTime: e.at,
      wallRoundTripMs: 1,
      received: [
        {
          type: e.type === "down" ? "keydown" : "keyup",
          code: `Key${e.key.toUpperCase()}`,
          trusted: true,
          virtualTime: e.at,
        },
      ],
    })),
    frames: Array.from({ length: scenario.duration / 16 + 1 }, (_, i) => ({
      time: i * 16,
      file: `frame-${String(i * 16).padStart(5, "0")}.png`,
      sha256: "a".repeat(64),
    })),
  };
}
test("complete input evidence is required; frame traversal and missing events are rejected", () => {
  assert.doesNotThrow(() => validateRecording(recording()));
  const missing = recording();
  missing.inputs.pop();
  assert.throws(() => validateRecording(missing), /Missing input/);
  const incorrect = recording();
  incorrect.inputs[0].key = "s";
  assert.throws(() => validateRecording(incorrect), /mismatch/);
  const traversal = recording();
  traversal.frames[0].file = "../secret.png";
  assert.throws(() => validateRecording(traversal), /frame evidence/);
  const truncated = recording();
  truncated.frames.pop();
  assert.throws(() => validateRecording(truncated), /Incomplete/);
});
test("runtime failure in a collected candidate is a behavior failure, not a retry", () => {
  const reference = { recording: { runtimeErrors: [] } },
    candidate = { recording: { runtimeErrors: ["intentional failure"] } };
  assert.equal(compare(reference, candidate, {}).decision, "failure");
  assert.equal(compare(candidate, reference, {}).decision, "inconclusive");
});

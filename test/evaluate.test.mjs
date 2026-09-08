import test from "node:test";
import assert from "node:assert/strict";
import { compare, summarize, events } from "../src/evaluate.mjs";
const requirements = {
  viewport: { width: 1000, height: 1000 },
  landmarks: [{ id: "a" }, { id: "b" }, { id: "c" }],
};
function trial(behavior = "movement", offset = 0) {
  return {
    recording: {
      captureValid: true,
      cleanup: true,
      condition: "controlled-clock-image-only-v1",
      scenario: { behavior, duration: 800 },
    },
    samples: Array.from({ length: 51 }, (_, i) => ({
      time: i * 16,
      points: requirements.landmarks.map((m, j) => ({
        id: m.id,
        x: 100 + j * 200 + offset,
        y: 200,
        pixels: 100,
      })),
    })),
  };
}
test("identical full paths pass; visible trajectory divergence fails", () => {
  assert.equal(compare(trial(), trial(), requirements).decision, "success");
  assert.equal(
    compare(trial(), trial("movement", 60), requirements).decision,
    "failure",
  );
});
test("matching truncated or missing captures never pass", () => {
  const a = trial();
  a.samples.pop();
  assert.equal(
    compare(a, structuredClone(a), requirements).decision,
    "inconclusive",
  );
  const b = trial();
  b.samples[2].points[1].pixels = 0;
  assert.equal(compare(trial(), b, requirements).decision, "inconclusive");
  const c = trial();
  c.recording.captureValid = false;
  assert.equal(compare(c, c, requirements).decision, "inconclusive");
});
test("duplicate time or nonfinite coordinates cannot count as valid evidence", () => {
  const a = trial();
  a.samples[2].time = 16;
  assert.equal(compare(a, a, requirements).decision, "inconclusive");
  const b = trial();
  b.samples[2].points[0].x = NaN;
  assert.equal(compare(b, b, requirements).decision, "inconclusive");
});
test("a missing candidate jump fails, an unobservable reference is inconclusive", () => {
  const jumping = trial("jumping");
  for (const s of jumping.samples)
    if (s.time >= 160 && s.time < 480) for (const p of s.points) p.y += 20;
  assert.deepEqual(events(jumping.samples, 1000), {
    departure: 160,
    landing: 480,
    airtime: 320,
  });
  assert.equal(
    compare(jumping, trial("jumping"), requirements).decision,
    "failure",
  );
  assert.equal(
    compare(trial("jumping"), jumping, requirements).decision,
    "inconclusive",
  );
  assert.equal(
    compare(jumping, structuredClone(jumping), requirements).decision,
    "success",
  );
});
test("repetition gate does not average away two failures or absent reference stability", () => {
  const pass = { decision: "success" },
    fail = { decision: "failure" };
  assert.equal(
    summarize([pass, pass, pass, pass, fail], Array(4).fill(pass)),
    "success",
  );
  assert.equal(
    summarize([pass, pass, pass, fail, fail], Array(4).fill(pass)),
    "failure",
  );
  assert.equal(summarize(Array(5).fill(pass), []), "inconclusive");
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { project, poseFromPixels } from "../workers/vision.mjs";
const requirements = JSON.parse(
  await readFile(new URL("../fixture/requirements.json", import.meta.url)),
);
test("image pose fitting recovers an independently chosen translated and rotated camera", () => {
  const target = [0.7, 2.1, 0.9, 0.04, -0.02];
  const points = requirements.landmarks.map((m) => {
    const [x, y] = project(m.position, target, requirements);
    return { id: m.id, x, y, pixels: 100 };
  });
  const fit = poseFromPixels(points, requirements, [0, 1.6, 0, 0, 0]);
  assert.ok(Math.hypot(...fit.pose.map((v, i) => v - target[i])) < 1e-5);
  points[0].pixels = 0;
  assert.throws(() => poseFromPixels(points, requirements, target), /Missing/);
});

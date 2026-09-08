import { readFile } from "node:fs/promises";
import pngjs from "pngjs";
export async function landmarks(file, requirements) {
  const image = pngjs.PNG.sync.read(await readFile(file));
  if (
    image.width !== requirements.viewport.width ||
    image.height !== requirements.viewport.height
  )
    throw new Error("Unexpected image dimensions");
  const sums = requirements.landmarks.map(() => [0, 0, 0]);
  const colors = new Map(
    requirements.landmarks.map((p, i) => [
      (p.rgb[0] << 16) | (p.rgb[1] << 8) | p.rgb[2],
      i,
    ]),
  );
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) {
      const at = (y * image.width + x) * 4;
      const i = colors.get(
        (image.data[at] << 16) | (image.data[at + 1] << 8) | image.data[at + 2],
      );
      if (i !== undefined) {
        sums[i][0] += x;
        sums[i][1] += y;
        sums[i][2]++;
      }
    }
  return sums.map((s, i) => ({
    id: requirements.landmarks[i].id,
    x: s[2] ? s[0] / s[2] + 0.5 : null,
    y: s[2] ? s[1] / s[2] + 0.5 : null,
    pixels: s[2],
  }));
}
export function project(position, pose, requirements) {
  const [x, y, z, yaw, pitch] = pose,
    [px, py, pz] = position;
  const right = (px - x) * Math.cos(yaw) - (pz - z) * Math.sin(yaw);
  const depth = (px - x) * Math.sin(yaw) + (pz - z) * Math.cos(yaw);
  const up = (py - y) * Math.cos(pitch) + depth * Math.sin(pitch);
  const forward = depth * Math.cos(pitch) - (py - y) * Math.sin(pitch);
  return [
    requirements.viewport.width / 2 +
      (requirements.camera.focalPixels * right) / forward,
    requirements.viewport.height / 2 -
      (requirements.camera.focalPixels * up) / forward,
  ];
}
export function solve(a, b) {
  a = a.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < b.length; i++) {
    let pivot = i;
    for (let k = i + 1; k < b.length; k++)
      if (Math.abs(a[k][i]) > Math.abs(a[pivot][i])) pivot = k;
    [a[i], a[pivot]] = [a[pivot], a[i]];
    if (Math.abs(a[i][i]) < 1e-12) throw new Error("Unidentifiable fit");
    const d = a[i][i];
    for (let j = i; j <= b.length; j++) a[i][j] /= d;
    for (let k = 0; k < b.length; k++)
      if (k !== i) {
        const f = a[k][i];
        for (let j = i; j <= b.length; j++) a[k][j] -= f * a[i][j];
      }
  }
  return a.map((r) => r[b.length]);
}
export function leastSquares(rows, values) {
  const n = rows[0].length;
  return solve(
    Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) =>
        rows.reduce((s, r) => s + r[i] * r[j], 0),
      ),
    ),
    Array.from({ length: n }, (_, i) =>
      rows.reduce((s, r, k) => s + r[i] * values[k], 0),
    ),
  );
}
export function poseFromPixels(points, requirements, initial) {
  if (points.some((p) => p.pixels < 50))
    throw new Error("Missing or occluded landmark");
  let pose = [...initial];
  const predict = (p) =>
    requirements.landmarks.flatMap((m) => project(m.position, p, requirements));
  const observed = points.flatMap((p) => [p.x, p.y]);
  for (let step = 0; step < 12; step++) {
    const predicted = predict(pose),
      residual = observed.map((v, i) => v - predicted[i]);
    const cols = pose.map((_, j) => {
      const p = [...pose];
      p[j] += 1e-5;
      return predict(p).map((v, i) => (v - predicted[i]) / 1e-5);
    });
    const delta = leastSquares(
      predicted.map((_, i) => cols.map((c) => c[i])),
      residual,
    );
    pose = pose.map((v, i) => v + delta[i]);
    if (Math.hypot(...delta) < 1e-7) break;
  }
  const error = Math.sqrt(
    predict(pose).reduce((s, v, i) => s + (v - observed[i]) ** 2, 0) /
      observed.length,
  );
  if (!pose.every(Number.isFinite) || error > 1)
    throw new Error(`Pose fit failed: ${error}`);
  return { pose, error };
}

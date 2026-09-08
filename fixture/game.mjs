// Evaluator-only reference implementation. Never mount this in analysis/generation.
const scene = await (await fetch("requirements.json")).json();
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let x,
  y,
  z,
  yaw,
  pitch,
  vertical,
  keys = new Set(),
  previous;
function reset() {
  x = z = yaw = pitch = vertical = 0;
  y = 1.6;
  keys.clear();
}
reset();
addEventListener("keydown", (e) => {
  if (e.code === "Space") e.preventDefault();
  if (e.key === "r") reset();
  else keys.add(e.code);
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
canvas.addEventListener("dblclick", () =>
  canvas.requestPointerLock().catch(() => {}),
);
addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== canvas && !(e.buttons & 1)) return;
  yaw += e.movementX * 0.0025;
  pitch = Math.max(-1, Math.min(1, pitch + e.movementY * 0.0025));
});
function project([px, py, pz]) {
  const dx = px - x,
    dz = pz - z,
    dy = py - y;
  const u = dx * Math.cos(yaw) - dz * Math.sin(yaw);
  const depth = dx * Math.sin(yaw) + dz * Math.cos(yaw);
  const v = dy * Math.cos(pitch) + depth * Math.sin(pitch);
  const w = depth * Math.cos(pitch) - dy * Math.sin(pitch);
  return w > 0.1 ? [640 + (620 * u) / w, 360 - (620 * v) / w] : null;
}
function line(a, b, color) {
  a = project(a);
  b = project(b);
  if (!a || !b) return;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.stroke();
}
function render() {
  ctx.fillStyle = "#142034";
  ctx.fillRect(0, 0, 1280, 720);
  for (let i = -20; i <= 30; i += 2) {
    line([i, 0, 1], [i, 0, 40], "#293b50");
    if (i > 0) line([-20, 0, i], [20, 0, i], "#293b50");
  }
  for (const mark of scene.landmarks) {
    const p = project(mark.position);
    if (!p) continue;
    ctx.fillStyle = `rgb(${mark.rgb.join(",")})`;
    ctx.fillRect(Math.round(p[0]) - 5, Math.round(p[1]) - 5, 10, 10);
  }
  ctx.strokeStyle = "#d9e2ef";
  ctx.beginPath();
  ctx.moveTo(632, 360);
  ctx.lineTo(648, 360);
  ctx.moveTo(640, 352);
  ctx.lineTo(640, 368);
  ctx.stroke();
}
function frame(now) {
  const dt =
    previous === undefined ? 0 : Math.min((now - previous) / 1000, 0.05);
  previous = now;
  let side = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
  let forward = Number(keys.has("KeyW")) - Number(keys.has("KeyS"));
  const magnitude = Math.hypot(side, forward) || 1;
  side /= magnitude;
  forward /= magnitude;
  x += (side * Math.cos(yaw) + forward * Math.sin(yaw)) * 3.2 * dt;
  z += (forward * Math.cos(yaw) - side * Math.sin(yaw)) * 3.2 * dt;
  if (keys.has("Space") && y <= 1.600001 && vertical === 0) vertical = 5.4;
  if (vertical !== 0 || y > 1.6) {
    y += vertical * dt - 5.4 * dt * dt;
    vertical -= 10.8 * dt;
    if (y <= 1.6) {
      y = 1.6;
      vertical = 0;
    }
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
canvas.dataset.ready = "true";

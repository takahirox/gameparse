import { caseIdentity } from "./cases.mjs";
const key = (at, type, key) => ({ at, type, key });
const hold = (id, behavior, k, duration) => ({
  id,
  behavior,
  duration: behavior === "jumping" ? 1440 : 960,
  events: [key(160, "down", k), key(160 + duration, "up", k)],
});
const aim = (id, dx, dy = 0) => ({
  id,
  behavior: "aiming",
  duration: 960,
  events: [{ at: 160, type: "mouse", dx, dy }],
});
export const recorded = [
  hold("move-forward", "movement", "w", 320),
  hold("move-right", "movement", "d", 480),
  aim("aim-horizontal", 40),
  aim("aim-vertical", 0, 32),
  hold("jump-short", "jumping", "Space", 32),
  hold("jump-long", "jumping", "Space", 160),
];
recorded.push({
  id: "move-diagonal",
  behavior: "movement",
  duration: 960,
  events: [
    key(160, "down", "w"),
    key(160, "down", "d"),
    key(480, "up", "w"),
    key(480, "up", "d"),
  ],
});
export const development = [
  hold("calibration-forward", "movement", "w", 256),
  aim("calibration-aim", 24),
  hold("calibration-jump", "jumping", "Space", 64),
];
// Evaluator-only sampling. Generated after analysis/generation; never included in their bundles.
export const finalRanges = {
  movementHoldMs: [192, 224, 352, 416],
  mousePixels: [-36, -28, 20, 52],
  jumpHoldMs: [48, 80, 112, 192],
};
export function finalCases(random, consumed = new Set()) {
  const pools = [[], [], [], [], []];
  for (const duration of finalRanges.movementHoldMs) {
    pools[0].push(hold("held-movement", "movement", "w", duration));
    pools[3].push({
      id: "held-diagonal",
      behavior: "movement",
      duration: 960,
      events: [
        key(160, "down", "w"),
        key(160, "down", "a"),
        key(160 + duration, "up", "w"),
        key(160 + duration, "up", "a"),
      ],
    });
    for (const amount of finalRanges.mousePixels) {
      pools[1].push({
        id: "held-aim",
        behavior: "aiming",
        duration: 960,
        events: [
          { at: 160, type: "mouse", dx: amount, dy: 0 },
          { at: 160 + duration, type: "mouse", dx: amount, dy: 0 },
        ],
      });
      pools[4].push({
        id: "held-move-aim",
        behavior: "movement",
        duration: 960,
        events: [
          key(160, "down", "w"),
          { at: 256, type: "mouse", dx: amount, dy: 0 },
          key(160 + duration, "up", "w"),
        ],
      });
    }
  }
  for (const duration of finalRanges.jumpHoldMs)
    pools[2].push(hold("held-jump", "jumping", "Space", duration));
  const excluded = new Set([
    ...consumed,
    ...recorded.map(caseIdentity),
    ...development.map(caseIdentity),
  ]);
  return pools.map((pool) => {
    const available = pool.filter((s) => !excluded.has(caseIdentity(s)));
    if (!available.length)
      throw new Error(
        "Independent final case space exhausted; preregister a new condition",
      );
    const draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1)
      throw new Error("Invalid random draw");
    return available[Math.floor(draw * available.length)];
  });
}

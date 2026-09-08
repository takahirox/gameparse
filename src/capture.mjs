import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { hash, json } from "./io.mjs";
import { validateScenario, validateInputReceipt } from "./validation.mjs";
export async function capture(browser, url, scenario, output, { signal } = {}) {
  validateScenario(scenario);
  signal?.throwIfAborted();
  await mkdir(output, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const abort = () => {
    void context.close().catch(() => {});
  };
  signal?.addEventListener("abort", abort, { once: true });
  const record = {
    schemaVersion: 1,
    condition: "controlled-clock-image-only-v1",
    scenario,
    clock: {
      kind: "Playwright virtual clock",
      stepMs: 16,
      wallTimeClaim: false,
    },
    inputs: [],
    frames: [],
    cleanup: false,
  };
  const wallStart = performance.now();
  try {
    signal?.throwIfAborted();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install({ time: new Date(0) });
    await page.clock.pauseAt(new Date(1000));
    await page.addInitScript(() => {
      window.__gameparseEvents = [];
      for (const type of ["keydown", "keyup", "mousemove"]) {
        addEventListener(
          type,
          (event) =>
            window.__gameparseEvents.push({
              type,
              code: event.code ?? null,
              dx: event.movementX ?? 0,
              dy: event.movementY ?? 0,
              buttons: event.buttons ?? 0,
              trusted: event.isTrusted,
              virtualTime: performance.now(),
              nativeTimestamp: event.timeStamp,
            }),
          true,
        );
      }
    });
    await page.goto(url);
    // Poll using the host clock: rAF/timers inside the page are deliberately paused.
    for (let i = 0; i < 100; i++) {
      if (
        await page.evaluate(
          () => document.querySelector("canvas")?.dataset.ready === "true",
        )
      )
        break;
      if (i === 99) throw new Error("Game readiness timeout");
      await delay(20);
    }
    await page.mouse.move(640, 360);
    await page.mouse.down();
    await page.keyboard.press("r");
    await page.clock.runFor(32);
    const origin = await page.evaluate(() => {
      window.__gameparseEvents.length = 0;
      return performance.now();
    });
    record.pointerLock = await page.evaluate(
      () => document.pointerLockElement !== null,
    );
    record.inputModality = "left-button drag; no pointer lock";
    record.reset = {
      method: "r then 32 ms controlled clock",
      initialConditions: "requirements.json",
    };
    let mouseX = 640,
      mouseY = 360;
    for (let time = 0; time <= scenario.duration; time += 16) {
      signal?.throwIfAborted();
      if (time) await page.clock.runFor(16);
      for (const event of scenario.events.filter((e) => e.at === time)) {
        const dispatchTime =
          (await page.evaluate(() => performance.now())) - origin;
        const before = performance.now();
        if (event.type === "down") await page.keyboard.down(event.key);
        else if (event.type === "up") await page.keyboard.up(event.key);
        else if (event.type === "mouse") {
          mouseX += event.dx;
          mouseY += event.dy;
          await page.mouse.move(mouseX, mouseY);
        } else throw new Error(`Unknown input type ${event.type}`);
        const acknowledgmentTime =
          (await page.evaluate(() => performance.now())) - origin;
        const received = await page.evaluate(() =>
          window.__gameparseEvents.splice(0),
        );
        for (const receipt of received) receipt.virtualTime -= origin;
        validateInputReceipt(event, received);
        record.inputs.push({
          ...event,
          dispatchTime,
          acknowledgmentTime,
          received,
          wallRoundTripMs: performance.now() - before,
        });
      }
      const started = performance.now(),
        png = await page.screenshot({ type: "png" });
      const observedTime =
        (await page.evaluate(() => performance.now())) - origin;
      if (observedTime !== time) throw new Error("Virtual frame clock drift");
      const file = `frame-${String(time).padStart(5, "0")}.png`;
      await writeFile(path.join(output, file), png);
      record.frames.push({
        time,
        file,
        sha256: hash(png),
        wallCaptureMs: performance.now() - started,
      });
    }
    if (record.inputs.length !== scenario.events.length)
      throw new Error("Input schedule must use 16 ms grid");
    record.runtimeErrors = errors;
    record.captureValid = true;
  } catch (error) {
    record.captureValid = false;
    record.failure = error.message;
    throw error;
  } finally {
    signal?.removeEventListener("abort", abort);
    await context.close();
    record.cleanup = true;
    record.wallDurationMs = performance.now() - wallStart;
    await json(path.join(output, "recording.json"), record);
  }
  return record;
}

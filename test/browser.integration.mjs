import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, access, rm } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { serve } from "../src/server.mjs";
import { capture } from "../src/capture.mjs";
import { development } from "../src/scenarios.mjs";
import { observe, compare } from "../src/evaluate.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test(
  "Chrome capture resets reproducibly and detects edited PNG evidence",
  { timeout: 30000 },
  async () => {
    const temporary = await mkdtemp(
      path.join(os.tmpdir(), "gameparse-browser-"),
    );
    let server, browser;
    try {
      server = await serve(path.join(root, "fixture"));
      browser = await chromium.launch({ channel: "chrome", headless: true });
      const requirements = JSON.parse(
        await readFile(path.join(root, "fixture/requirements.json")),
      );
      await capture(
        browser,
        server.url,
        development[0],
        path.join(temporary, "first"),
      );
      await capture(
        browser,
        server.url,
        development[0],
        path.join(temporary, "second"),
      );
      const first = await observe(path.join(temporary, "first"), requirements),
        second = await observe(path.join(temporary, "second"), requirements);
      assert.equal(compare(first, second, requirements).decision, "success");
      assert.ok(
        Math.abs(
          first.samples[0].points[0].x - first.samples.at(-1).points[0].x,
        ) > 1,
        "prescribed movement must visibly move the scene",
      );
      const aiming = await capture(
        browser,
        server.url,
        development[1],
        path.join(temporary, "aiming"),
      );
      assert.equal(aiming.inputs[0].received[0].dx, 24);
      await writeFile(
        path.join(temporary, "second/frame-00000.png"),
        "tampered",
      );
      await assert.rejects(
        observe(path.join(temporary, "second"), requirements),
        /integrity mismatch/,
      );
    } finally {
      await browser?.close();
      await server?.close();
      await rm(temporary, { recursive: true, force: true });
    }
  },
);

test(
  "SIGTERM during capture preserves an incomplete report and closes owned resources",
  { timeout: 30000 },
  async () => {
    const id = `cancellation-test-${Date.now()}`;
    const child = spawn(
      process.execPath,
      ["src/cli.mjs", "smoke", "--id", id],
      { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
    );
    let output = "";
    child.stdout.on("data", (data) => {
      output += data;
    });
    child.stderr.on("data", (data) => {
      output += data;
    });
    const exited = new Promise((resolve) =>
      child.once("exit", (code, signal) => resolve({ code, signal })),
    );
    try {
      let started = false;
      for (let i = 0; i < 500; i++) {
        try {
          await access(
            path.join(root, "artifacts", id, "smoke/frame-00000.png"),
          );
          started = true;
          break;
        } catch {
          await delay(20);
        }
      }
      assert.ok(started, `capture never started: ${output}`);
      child.kill("SIGTERM");
      const result = await exited;
      assert.equal(result.code, 130, output);
      const report = JSON.parse(
        await readFile(path.join(root, "artifacts", id, "report.json")),
      );
      assert.equal(report.cancelled, true);
      assert.equal(report.cleanup, true);
      assert.equal(report.completion, "incomplete");
      const record = JSON.parse(
        await readFile(
          path.join(root, "artifacts", id, "smoke/recording.json"),
        ),
      );
      assert.equal(record.cleanup, true);
      assert.equal(record.captureValid, false);
    } finally {
      if (child.exitCode === null) child.kill("SIGKILL");
    }
  },
);
